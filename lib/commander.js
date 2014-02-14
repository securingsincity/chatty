var crypto = require('crypto');
var _ = require('lodash');
var cliff = require('cliff');
var escapeHtml = require('escape-html');
var pjson = require('../package.json');

module.exports = function (addon, hipchat) {

  return new Commander(addon, hipchat);

};

function Commander(addon, hipchat) {
  var self = this;
  self.addon = addon;
  var logger = self.logger = addon.logger;
  self.hipchat = hipchat;
  self.commands = {};
  self.spies = {};
  self.frozen = false;

  // load scripts
  var fs = require('fs');
  var dir = __dirname + '/../commands/';
  if (fs.existsSync(dir)) {
    logger.info('Loading commands');
    fs.readdirSync(dir).forEach(function(file) {
      var path = dir + file;
      if (file.charAt(0) !== '_') { // skip 'private' modules
        if (file.indexOf('index.') === -1) {
          var shortName = file.split('.')[0];
          logger.info('  ' + shortName);
          var module = require(path);
          if (typeof module === 'function') {
            try {
              module(self, logger);
            } catch (e) {
              logger.error(e.stack);
            }
          } else {
            logger.warn('Found command module of unexpected type (module must be a function):', path);
          }
        } else {
          logger.warn('Not loading command module index:', path);
        }
      }
    });
  }

  self.frozen = true;
}

Commander.prototype._ensureMutable = function () {
  if (this.frozen) {
    // Definitions can only be loaded during init,
    // since they affect the addon descriptor
    throw new Error('Commander definitions are frozen');
  }
}

Commander.prototype.command = function (def) {
  this.define(_.extend({type: 'command'}, def));
};

Commander.prototype.spy = function (def) {
  this.define(_.extend({type: 'spy'}, def));
};

Commander.prototype.define = function (def) {
  this._ensureMutable();
  if (!def) {
    return this.logger.error('No definition');
  }
  if (!def.type) {
    return this.logger.error('Definition type required:', def);
  }
  if (!def.action) {
    return this.logger.error('Definition action required:', def);
  }
  if (typeof def.action !== 'function') {
    return this.logger.error('Definition action must be a function:', def);
  }
  def.opts = _.extend({color: 'gray', format: 'text'}, def.opts);
  var definitions;
  if (def.type === 'command') {
    if (!def.name) {
      this.logger.error('Command definition name required:', def);
    };
    if (!_.isArray(def.name)) {
      def.name = [def.name];
    }
    def.args = def.args || '';
    if (!def.help) {
      return this.logger.error('Command definition help required:', def);
    }
    def.hear = new RegExp('^/(' + def.name.join('|') + ')(?:(?:\\s+(.*))|$)');
    definitions = this.commands;
  } else if (def.type === 'spy') {
    if (!def.hear) {
      return this.logger.error('Spy definition hear pattern required:', def);
    };
    if (!_.isRegExp(def.hear)) {
      return this.logger.error('Spy definition hear pattern must be a regexp:', def);
    }
    definitions = this.spies;
  } else {
    return this.logger.error('Invalid command definition type:', def.type);
  }
  // TODO: change this to just be the file name prefix known at load time?
  def.id = crypto.createHash('sha1').update(def.hear.toString()).digest('hex');
  if (definitions[def.id]) {
    return this.logger.error('Duplicate ' + def.type + ' pattern detected:', def.hear);
  }
  definitions[def.id] = def;
  this._addWebhook(def);
};

Commander.prototype._addWebhook = function (def) {
  this._ensureMutable();
  var webhooks = this.addon.descriptor.capabilities.webhook;
  if (!webhooks) {
    webhooks = this.addon.descriptor.capabilities.webhook = [];
  }
  var pattern = def.hear.toString();
  // TODO: tail trimming needs to be more robust to account for multiple flags
  pattern = pattern.slice(1, pattern.length - (/\/[gimy]$/.test(pattern) ? 2 : 1));
  webhooks.push({
    name: def.id,
    event: 'room_message',
    pattern: pattern,
    url: this.addon.config.localBaseUrl() + '/webhook?type=' + def.type + '&id=' + def.id
  });
}

Commander.prototype.handleWebhook = function (req) {
  var self = this;
  if (!self.recognizes(req)) return false;
  var def = self._definition(req.param('type'), req.param('id'));
  var event = def.type === 'spy' ? new SpyEvent(req, def) : new CommandEvent(req, def);
  process.nextTick(function () {
    self.execute(event, function (content, options) {
      options = {options: options};
      self.hipchat.sendMessage(event.clientInfo, event.room.id, content, options);
    });
  });
  return true;
}

Commander.prototype.recognizes = function(req) {
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
}

Commander.prototype._definition = function(type, id) {
  return (type === 'spy' ? this.spies : this.commands)[id];
};

Commander.prototype.execute = function(event, send) {
  var self = this;
  var def = event.definition;
  try {
    var response = new Response(send, event);
    var store = new Store(
      this.addon.settings,
      event.clientInfo.capabilitiesDoc.links.homepage,
      event.clientInfo.clientKey,
      event.clientInfo.groupId
    );
    def.action(event, response, store);
  } catch (e) {
    self.logger.error('Error executing ' + def.type + ' action:', '\n' + e.stack);
  }
}

Commander.prototype.pipe = function (command, event, next) {
  var def = _.find(this.commands, function (item) {
    return _.contains(item.name, command);
  });
  if (def) {
    message = event.message.replace(new RegExp('^/' + event.command), '/' + command);
    event = event.clone({
      definition: def,
      command: command,
      message: message
    });
    this.execute(event, next);
  }
};

Commander.prototype.help = function (type) {
  if (type === 'commands') {
    var commands = _.map(this.commands, function (def) {
      return ['/' + def.name.join(', /'), '  ' + def.args + '  ', def.help];
    }).sort(function (a, b) {
      return a[0] < b[0] ? -1 : (a[0] > b[0] ? 1 : 0);
    });
    return '<b>Commands</b><pre>' + escapeHtml(cliff.stringifyRows(commands)) + '</pre>';
  } else if (type === 'spies') {
    // TODO: need help and examples or something for spy defs
    return '<b>Spies</b><pre>TODO</pre>';
  }
};

function Event(req, def) {
  var env = req.context;
  var clientId = env.oauth_client_id;
  var item = env.item;
  var msg = item.message;
  var message = msg.message;
  this.definition = def;
  this.clientInfo = req.clientInfo;
  this.messageId = msg.id;
  this.message = message;
  this.mentions = msg.mentions;
  this.date = new Date(msg.date);
  this.from = msg.from;
  this.room = item.room;
};

Event.prototype.clone = function (overrides) {
  return _.extend(Object.create(this), overrides);
};

Event.prototype.args = function () {
  return this.input ? this.input.split(/\s+/) : [];
};

function SpyEvent(req, def) {
  Event.call(this, req, def);
  var match = def.hear.exec(this.message);
  this.captures = match.slice(1);
}

SpyEvent.prototype = Object.create(Event.prototype);

function CommandEvent(req, def) {
  Event.call(this, req, def);
  var match = def.hear.exec(this.message);
  this.command = match[1];
  this.input = match[2];
}

CommandEvent.prototype = Object.create(Event.prototype);

function Response(_send, event) {
  this._send = _send;
  this._event = event;
  _.bindAll(this);
}

Response.prototype.send = function (content, options) {
  options = _.extend({}, this._event.definition.opts, options);
  this._send(content, options);
};

Response.prototype.random = function (list, options) {
  this.send(list[_.random(list.length - 1)], options);
};

function Store(settings, host, clientKey, groupId) {
  this._settings = settings;
  this._clientKey = clientKey;
  this._groupKey = require('crypto').createHash('sha1').update(host + ':' + groupId).digest('hex');
}

Store.prototype._key = function () {
  return pjson.name + ':commander:' + [].join.call(arguments, ':');
};

Store.prototype.get = function (key) {
  return this._settings.get(this._key(key), this._clientKey);
};

Store.prototype.set = function (key, value) {
  return this._settings.set(this._key(key), value, this._clientKey);
};

Store.prototype.del = function (key) {
  return this._settings.del(this._key(key), this._clientKey);
};

Store.prototype.gget = function (key) {
  return this._settings.get(this._key(key), this._groupKey);
};

Store.prototype.gset = function (key, value) {
  return this._settings.set(this._key(key), value, this._groupKey);
};

Store.prototype.gdel = function (key) {
  return this._settings.del(this._key(key), this._groupKey);
};
