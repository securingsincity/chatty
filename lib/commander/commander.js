var paths = require('path');
var crypto = require('crypto');
var _ = require('lodash');
var cliff = require('cliff');
var RSVP = require('rsvp');
var Script = require('./script');
var Definition = require('./definition');
var Event = require('./event');
var Response = require('./response');
var Webhooks = require('./webhooks');
var Tenant = require('./tenant');

function Commander(addon, hipchat, dir) {
  this.addon = addon;
  this.logger = addon.logger;
  this.hipchat = hipchat;
  this.dir = dir;
  this._scripts = {};
  this._commands = {};
  this._spies = {};
  this._webhooks = Webhooks.create(addon, hipchat);
  this._init();
  this._frozen = true;
}

Commander.prototype.command = function (spec) {
  this._define(_.extend({type: 'command'}, spec));
};

Commander.prototype.spy = function (spec) {
  this._define(_.extend({type: 'spy'}, spec));
};

Commander.prototype._init = function () {
  var self = this;
  self._loadScripts();
  // HACK: update webhooks registrations if not running on heroku
  //       or running on the first dyno
  var dyno = process.env.DYNO;
  var tasks = [];
  if (!dyno || dyno === 'web.1') {
    tasks.push(self._webhooks.update());
  }
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
    self.help({format: 'text'}).then(function (help) {
      self.logger.info(help);
    });
  } else {
    self.logger.warn('No such directory:', self.dir);
  }
};

Commander.prototype._loadScript = function (path, name) {
  var self = this;
  var module = require(path);
  if (typeof module === 'function') {
    try {
      self.currentScript = self._scripts[name] = Script.create(path, name);
      self.script = function (conf) {
        self.currentScript.configure(conf);
      };
      module(self, self.logger, name);
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

Commander.prototype.pipe = function (command, event, next) {
  var def = _.find(this._commands, function (item) {
    return _.contains(item.name, command);
  });
  if (def) {
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
  var type = options.type;
  var search = options.filter;
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
        return ['/' + def.name.join(', /'), '  ', def.args, '  ', def.help];
      }).filter(filter).sort(sort);
      var msg = commands.length > 0 ? cliff.stringifyRows(commands) : 'No matches';
      return (isHtml ? '<b>Commands</b>\n' : 'Commands\n\n') + msg;
    }
    function spies() {
      var spies = _.map(enabledSpies, function (def) {
        return [def.hear, '  ', def.help];
      }).filter(filter).sort(sort);
      var msg = spies.length > 0 ? cliff.stringifyRows(spies) : 'No matches';
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
  var event = Event.create(self.addon, req, def);
  var tenant = event.tenant;
  self._whenInited.then(function () {
    def.script.isEnabled(tenant).then(function (enabled) {
      if (enabled) {
        def.script.variables.get(tenant).then(function (vars) {
          event.variables = vars;
          self._execute(event, function (content, options) {
            self.hipchat.sendMessage(tenant, event.room.id, content, {options: options});
          });
        });
      }
    });
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
  var tenant = Tenant.create(clientInfo, self.addon);
  return self._whenInited.then(function () {
    return self._scripts[name].update(tenant, json);
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
  spec.opts = _.extend({color: 'gray', format: 'text'}, spec.opts);
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

Commander.prototype._definition = function(type, id) {
  return (type === 'spy' ? this._spies : this._commands)[id];
};

Commander.prototype._execute = function(event, send) {
  var self = this;
  var def = event.definition;
  try {
    var response = Response.create(send, event);
    def.action(event, response);
  } catch (e) {
    self.logger.error('Error executing ' + def.type + ' action:', '\n' + e.stack);
  }
}

module.exports = function (addon, hipchat, dir) {
  return new Commander(addon, hipchat, dir);
};
