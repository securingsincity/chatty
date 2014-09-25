var paths = require('path');
var crypto = require('crypto');
var _ = require('lodash');
var cliff = require('cliff');
var RSVP = require('rsvp');
var escape = require('escape-html');
var Store = require('./store');
var Script = require('./script');
var Definition = require('./definition');
var Event = require('./event');
var Response = require('./response');
var Webhooks = require('./webhooks');
var Tenant = require('./tenant');
var errors = require('./errors');

function Commander(addon, hipchat, dir) {
  var self = this;
  self.addon = addon;
  self.logger = addon.logger;
  self.hipchat = hipchat;
  self.dir = dir;
  self._scripts = {};
  self._commands = {};
  self._spies = {};
  self._defaultSendOptions = {color: 'gray', format: 'text', notify: true};
  self._webhooks = Webhooks.create(addon, hipchat);
  self._init();
  self._frozen = true;
}

Commander.prototype.command = function (spec) {
  this._define(_.extend({type: 'command'}, spec));
};

Commander.prototype.spy = function (spec) {
  this._define(_.extend({type: 'spy'}, spec));
};

Commander.prototype.work = function (task) {
  // TODO: running tasks on the web server/primary web dyno is dumb, but works for now
  var dyno = process.env.DYNO;
  if (!dyno || dyno === 'web.1') {
    task();
  }
};

Commander.prototype._init = function () {
  var self = this;
  self._loadScripts();
  var tasks = [self._startScripts()];
  self.work(function () {
    tasks.push(self._webhooks.update());
  });
  self._whenInited = new RSVP.all(tasks);
};

Commander.prototype._loadScripts = function () {
  var self = this;
  var fs = require('fs');
  if (fs.existsSync(self.dir)) {
    fs.readdirSync(self.dir).forEach(function(file) {
      var path = paths.join(self.dir, file);
      if (!fs.statSync(path).isDirectory() && file.indexOf('index.') === -1) {
        self._loadScript(path, file.split('.')[0]);
      } else {
        self.logger.warn('Not loading command module index:', path);
      }
    });
    if (process.env.NODE_ENV !== 'production') {
      self.help({format: 'text'}).then(function (help) {
        self.logger.info(help);
      });
    }
  } else {
    self.logger.warn('No such directory:', self.dir);
  }
};

Commander.prototype._loadScript = function (path, scriptName) {
  var self = this;
  var module = require(path);
  if (typeof module === 'function') {
    try {
      self.currentScript = self._scripts[scriptName] = Script.create(path, scriptName);
      self.script = function (conf) {
        conf.opts = _.extend({}, self._defaultSendOptions, conf.opts);
        self.currentScript.configure(conf);
      };
      module(self, self.logger, scriptName);
    } catch (e) {
      self.logger.error(e.stack);
    } finally {
      delete self.currentScript;
      delete self.script;
      delete self.variables;
    }
  } else {
    self.logger.warn('Found command module of unexpected type (module must be a function):', path);
  }
};

Commander.prototype._startScripts = function () {
  var self = this;
  return self._tenants().then(function (tenants) {
    return _.map(tenants, function (tenant) {
      return self._startScriptsForTenant(tenant);
    });
  });
};

Commander.prototype._startScriptsForTenant = function (tenant) {
  var self = this;
  return RSVP.all(_.map(self._scripts, function (script) {
    return script.isEnabled(tenant).then(function (enabled) {
      if (enabled) {
        return script.start(tenant, script.createStore(tenant, self.addon), function (msg, options) {
          self.hipchat.sendMessage(tenant, tenant.roomId, msg, {
            options: options
          });
        });
      }
      return RSVP.all([]);
    });
  }));
};

Commander.prototype._stopScriptsForTenant = function (tenant) {
  var self = this;
  return RSVP.all(_.map(self._scripts, function (script) {
    return script.stop(tenant, script.createStore(tenant, self.addon), function (msg, options) {
      self.hipchat.sendMessage(tenant, tenant.roomId, msg, {
        options: options
      });
    });
  }));
};

Commander.prototype._tenants = function () {
  var self = this;
  return new RSVP.Promise(function (resolve, reject) {
    self.addon.settings.client.multi()
      .keys('*:clientInfo', function (err, multiResults) {
        if (err) return reject(err);
        if (!multiResults || multiResults.length === 0) return resolve({});
        self.addon.settings.client.mget(multiResults, function (err, mgetResults) {
          if (err) return reject(err);
          try {
            resolve(_.object(mgetResults.map(function (result, i) {
              var clientInfo = JSON.parse(result);
              return [clientInfo.clientKey, Tenant.create(clientInfo, self.addon)];
            })));
          } catch (err) {
            reject(err);
            if (err instanceof TypeError) {
              resolve({});
            } else {
              reject(err);
            }
          }
        })
      })
      .exec(function (err) {
        if (err) {
          reject(err);
        }
      });
  });
};

Commander.prototype.onInstalled = function (clientInfo) {
  var tenant = Tenant.create(clientInfo, this.addon);
  return this._startScriptsForTenant(tenant);
};

Commander.prototype.onUninstalled = function (clientInfo) {
  var tenant = Tenant.create(clientInfo, this.addon);
  return this._stopScriptsForTenant(tenant);
};

Commander.prototype.pipe = function (command, event, next) {
  var def = _.find(this._commands, function (item) {
    return _.contains(item.name, command);
  });
  if (def) {
    console.log("command : "+event.command);
    console.log("message : "+event.message);
    message = event.message.replace(new RegExp('^/' + event.command), '/' + command);
    event = event.clone({
      definition: def,
      command: command,
      message: message
    });
    this._execute(event, next);
  }
};

Commander.prototype.help = function (options) {
  options = options || {};
  var type = options.type;
  var search = options.filter;
  var escapeHtml = !!options.escapeHtml;
  var format = options.format || 'html';
  var isHtml = format === 'html';
  var tenant = options.tenant;
  var self = this;

  function generate(enabledCommands, enabledSpies) {
    function filter(line) {
      var esc = /[-[\]{}()*+?.,\\^$|#\s]/g;
      return search ? new RegExp('\\b' + search.replace(esc, '\\$&') + '\\b', 'i').test(line.join('    ')) : true;
    }
    function sort(a, b) {
      return a[0] < b[0] ? -1 : (a[0] > b[0] ? 1 : 0);
    }
    function commands() {
      var commands = _.map(enabledCommands, function (def) {
        return ['/' + def.name.join(', /'), ' ', def.args, ' ', def.help];
      }).filter(filter).sort(sort);
      var msg = commands.length > 0 ? cliff.stringifyRows(commands) : 'No matches';
      if (escapeHtml) msg = escape(msg);
      return (isHtml ? '<b>Commands</b>\n' : 'Commands\n\n') + msg;
    }
    function spies() {
      var spies = _.map(enabledSpies, function (def) {
        return [def.hear, ' ', def.help];
      }).filter(filter).sort(sort);
      var msg = spies.length > 0 ? cliff.stringifyRows(spies) : 'No matches';
      if (escapeHtml) msg = escape(msg);
      return (isHtml ? '<b>Spies</b>\n' : 'Spies\n\n') + msg;
    }
    var out;
    if (type === 'commands') {
      out = commands();
    } else if (type === 'spies') {
      out = spies();
    } else {
      out = commands() + '\n\n' + spies();
    }
    return (isHtml ? '<pre>' : '') + '\n' + out + (isHtml ? '\n</pre>' : '');
  }

  var commands = self._commands;
  var spies = self._spies;

  function filter(defs) {
    return RSVP.all(_.values(defs).map(function (def) {
      return def.script.isEnabled(tenant).then(function (enabled) {
        return enabled ? def : null;
      });
    })).then(function (defs) {
      return defs.filter(function (def) {
        return !!def;
      });
    });
  }

  if (tenant) {
    return RSVP.all([filter(commands), filter(spies)]).then(function (results) {
      return generate(results[0], results[1]);
    });
  } else {
    return new RSVP.Promise(function (resolve) {
      resolve(generate(commands, spies));
    });
  }
};

Commander.prototype.handleWebhook = function (req) {
  var self = this;
  if (!self._recognizes(req)) return false;
  var def = self._definition(req.param('type'), req.param('id'));
  var from = req.context.item.message.from;
  var room = req.context.item.room;
  self.logger.info('Received ' + def.type + ' webhook in script ' + def.script.name + ' from ' + from.name + ' in room ' + room.name + ' (' + room.id + ')');
  if (!req.clientInfo) {
    // TODO: a bug in ACE-HC seems to allow us to get here in some cases, so reject invalid requests ourselves for now
    throw new Error('No client info found for request');
  }
  var event = Event.create(self.addon, req.clientInfo, req.context, def);
  self._execute(event, function (msg, options) {
    self.hipchat.sendMessage(event.tenant, event.room.id, msg, {options: options});
  });
  return true;
};

Commander.prototype.getScripts = function (clientInfo) {
  var self = this;
  var tenant = Tenant.create(clientInfo, self.addon);
  return self._whenInited.then(function () {
    return RSVP.all(_.map(self._scripts, function (script) {
      return script.asJson(tenant);
    }));
  });
};

Commander.prototype.updateScript = function (clientInfo, name, json) {
  var self = this;
  var script = self._scripts[name];
  return self._whenInited.then(function () {
    if (script) {
      var tenant = Tenant.create(clientInfo, self.addon);
      var store = script.createStore(tenant, self.addon);
      var send = function (msg, options) {
        self.hipchat.sendMessage(tenant, tenant.roomId, msg, {options: options});
      }
      return script.update(tenant, store, send, json);
    }
    return RSVP.all([]);
  });
};

Commander.prototype._define = function (spec) {
  if (!this.currentScript.isConfigured) {
    throw new Error('Commander definitions require a preceding call to Commander::script');
  }
  if (this._frozen) {
    throw new Error('Commander definitions are frozen');
  }
  if (!spec) {
    return this.logger.error('No definition');
  }
  if (!spec.type) {
    return this.logger.error('Definition type required:', spec);
  }
  if (!spec.action) {
    return this.logger.error('Definition action required:', spec);
  }
  if (typeof spec.action !== 'function') {
    return this.logger.error('Definition action must be a function:', spec);
  }
  if (!spec.help) {
    return this.logger.error('Definition help required:', spec);
  }
  spec.opts = _.extend({}, this._defaultSendOptions, spec.opts);
  var definitions;
  if (spec.type === 'command') {
    if (!spec.name) {
      this.logger.error('Command definition name required:', spec);
    };
    if (!_.isArray(spec.name)) {
      spec.name = [spec.name];
    }
    spec.args = spec.args || '';
    spec.hear = new RegExp('^/(' + spec.name.join('|') + ')(?:(?:\\s+(.*))|$)');
    definitions = this._commands;
  } else if (spec.type === 'spy') {
    if (!spec.hear) {
      return this.logger.error('Spy definition hear pattern required:', spec);
    };
    if (!_.isRegExp(spec.hear)) {
      return this.logger.error('Spy definition hear pattern must be a regexp:', spec);
    }
    definitions = this._spies;
  } else {
    return this.logger.error('Invalid command definition type:', spec.type);
  }
  spec.id = crypto.createHash('sha1').update(spec.hear.toString()).digest('hex');
  if (definitions[spec.id]) {
    return this.logger.error('Duplicate ' + spec.type + ' pattern detected:', spec.hear);
  }
  spec.script = this.currentScript;
  var def = Definition.create(spec);
  this.currentScript['add' + (def.type === 'spy' ? 'Spy' : 'Command')](def);
  definitions[def.id] = def;
  this._webhooks.add(def);
};

Commander.prototype._recognizes = function (req) {
  var id = req.param('id');
  var type = req.param('type');
  return id
      && type
      && (type === 'command' || type === 'spy')
      && this._definition(type, id)
      && req.context
      && req.context.event === 'room_message'
      && req.context.item
      && req.context.item.message
      && req.context.item.message.message;
};

Commander.prototype._definition = function (type, id) {
  return (type === 'spy' ? this._spies : this._commands)[id];
};

Commander.prototype.execute = function (commandline, tenant, from, send) {
  var self = this;
  if (!commandline || typeof commandline !== 'string') {
    return self._sendError(new Error('Commander::execute requires a commandline string argument'), send);
  }
  if (!tenant) {
    return self._sendError(new Error('Commander::execute requires a valid tenant argument'), send);
  }
  if (!from || !from.id || !from.name || !from.mention_name) {
    return self._sendError(new Error('Commander::execute valid from argument'), send);
  }
  if (!send) {
    return self._sendError(new Error('Commander::execute requires a send function'), send);
  }
  var match = /^\/([\w-]+)(?:(?:\s+(.*))|$)/.exec(commandline);
  if (!match) {
    return self._sendError(new Error('Commander::execute commandline is invalid: "' + commandline + '"'), send);
  }
  var cmd = match[1];
  var def = _.find(self._commands, function (def) {
    return _.contains(def.name, cmd);
  });
  if (!def) {
    return self._sendError(new Error('Commander::execute command not recognized: "/' + cmd + '"'), send);
  }
  var mentions = commandline
    .split(/(@\w+)/)
    .filter(function (s) { return s.charAt(0) === '@'; })
    .map(function (s) { return {mention_name: s.slice(1)}; });
  // mock a webhook suitable for the creation of an event
  var webhook = {
    item: {
      message: {
        id: -1,
        message: commandline,
        mentions: mentions,
        date: new Date().toISOString(),
        from: from
      }
    }
  };
  var event = Event.create(self.addon, tenant, webhook, def);
  self._execute(event, send);
};

Commander.prototype._execute = function (event, send) {
  var self = this;
  event = event.clone();
  var def = event.definition;
  var tenant = event.tenant;
  self._whenInited.then(function () {
    def.script.isEnabled(tenant).then(function (enabled) {
      if (enabled) {
        def.script.variables.get(tenant).then(function (vars) {
          event.variables = vars;
          try {
            var response = Response.create(send, event.definition.opts);
            def.action(event, response);
          } catch (e) {
            self.logger.error('Error executing ' + def.type + ' action:', '\n' + e.stack);
            self._sendError(e, send);
          }
        });
      } else if (def.type === 'command') {
        send('That command is not enabled in this room', {color: 'red'});
      }
    });
  });
};

Commander.prototype._sendError = function (err, send) {
  send(errors[_.random(errors.length - 1)], {color: 'red'}, err);
};


module.exports = function (addon, hipchat, dir) {
  Store.init({
    redisUrl: addon.config.store().url
  });
  return new Commander(addon, hipchat, dir);
};
