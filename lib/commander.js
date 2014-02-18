var crypto = require('crypto');
var _ = require('lodash');
var cliff = require('cliff');
var escapeHtml = require('escape-html');
var pjson = require('../package.json');
var RSVP = require('rsvp');
var request = require('request');
var trier = require('trier');

module.exports = function (addon, hipchat) {

  return new Commander(addon, hipchat);

};

function Commander(addon, hipchat) {
  var self = this;
  self.addon = addon;
  self.logger = addon.logger;
  self.hipchat = hipchat;
  self.commands = {};
  self.spies = {};
  self._init();
  self.frozen = true;
}

Commander.prototype._init = function () {
  var self = this;
  self._loadScripts();
  self._initPromise = self._updateWebhooks();
};

Commander.prototype._loadScripts = function () {
  var self = this;
  var fs = require('fs');
  var dir = __dirname + '/../commands/';
  if (fs.existsSync(dir)) {
    self.logger.info('Loading commander scripts:');
    fs.readdirSync(dir).forEach(function(file) {
      var path = dir + file;
      if (file.charAt(0) !== '_') { // skip 'private' modules
        if (file.indexOf('index.') === -1) {
          var shortName = file.split('.')[0];
          self.logger.info('  ' + shortName);
          var module = require(path);
          if (typeof module === 'function') {
            try {
              module(self, self.logger);
            } catch (e) {
              self.logger.error(e.stack);
            }
          } else {
            self.logger.warn('Found command module of unexpected type (module must be a function):', path);
          }
        } else {
          self.logger.warn('Not loading command module index:', path);
        }
      }
    });
  }
};

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
  if (!def.help) {
    return this.logger.error('Definition help required:', def);
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
  def.id = crypto.createHash('sha1').update(def.hear.toString()).digest('hex');
  if (definitions[def.id]) {
    return this.logger.error('Duplicate ' + def.type + ' pattern detected:', def.hear);
  }
  definitions[def.id] = def;
  this._addWebhook(def);
};

// TODO: move all of the following webhook management support into its own api

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
};

Commander.prototype._updateWebhooks = function () {
  var self = this;
  return new RSVP.Promise(function (resolve, reject) {
    self.addon.settings.client.keys('*:clientInfo', function (err, keys) {
      if (err) {
        return self.logger.error('Error retrieving tenant keys:' + '\n' + (err.stack || err));
      }
      RSVP.all(keys.map(function (key) {
        return new RSVP.Promise(function (resolveOne, rejectOne) {
          self.addon.settings.client.get(key, function (err, clientInfoJson) {
            if (err) {
              self.logger.info('Failed to retrieve clientInfo for key: ' + key + '\n' + (err.stack || err));
              // skip it
              resolveOne();
            }
            // only update for tenants with an associated room id
            var clientInfo = JSON.parse(clientInfoJson);
            self.logger.info('Updating tenant\'s webhooks:', clientInfo);
            if (!clientInfo.roomId) {
              self.logger.info('Skipping tenant with unknown roomId:', clientInfo);
              // nothing to do, so skip it
              resolveOne();
            } else {
              // run a retry loop until we successfully update the current tenant
              var complete = false;
              trier.attempt({
                // retry until complete
                limit: -1,
                // 1s with exponential dropoff
                interval: -1000,
                until: function () {
                  return complete;
                },
                action: function (done) {
                  self._tryUpdateWebhooks(clientInfo, function (err) {
                    if (err) {
                      self.logger.error('Error updating webhooks with tenant: ' + clientInfo.clientKey + ' (will retry later):\n' + (err.stack || err));
                    } else {
                      complete = true;
                      resolveOne();
                    }
                    done();
                  });
                }
              });
            }
          });
        });
      })).then(resolve, reject);
    });
  });
};

Commander.prototype._tryUpdateWebhooks = function (clientInfo, callback) {
  var self = this;
  function done(registeredList) {
    // TODO: hack to filter webhooks list to only this addon instance's
    registeredList = registeredList.filter(function (webhook) {
      return webhook.url.indexOf(self.addon.config.localBaseUrl()) === 0;
    });
    // compare the registered and local lists to find registration deltas
    var registeredMap = _.object(registeredList.map(function (webhook) {
      return [webhook.name, webhook];
    }));
    var localList = self.addon.descriptor.capabilities.webhook;
    var localMap = _.object(localList.map(function (webhook) {
      return [webhook.name, webhook];
    }));
    var remove = _.filter(registeredList, function (webhook) {
      return !localMap[webhook.name];
    });
    var add = _.filter(localList, function (webhook) {
      return !registeredMap[webhook.name];
    });
    RSVP.all(remove.map(function (webhook) {
      return self.hipchat.removeRoomWebhook(clientInfo, clientInfo.roomId, webhook.id).then(function () {
        self.logger.info('Removed webhook:', webhook);
      });
    })).then(function () {
      return RSVP.all(add.map(function (webhook) {
        return self.hipchat.addRoomWebhook(clientInfo, clientInfo.roomId, webhook).then(function () {
          self.logger.info('Added webhook:', webhook);
        });
      }));
    }).then(function () {
      if (remove.length > 0 || add.length > 0) {
        self.hipchat.sendMessage(clientInfo, clientInfo.roomId, self.addon.descriptor.name + '\'s commands have been updated');
      }
      callback();
    }, function () {
      self.logger.error(arguments);
      callback(new Error('TODO: check log and forward a proper error here'));
    }).catch(function (err) {
      callback(err);
    });
  }
  function fail(err) {
    callback(err);
  }
  self.hipchat.getRoomWebhooks(clientInfo, clientInfo.roomId).then(done, fail);
};

Commander.prototype.handleWebhook = function (req) {
  var self = this;
  if (!self.recognizes(req)) return false;
  var def = self._definition(req.param('type'), req.param('id'));
  var event = def.type === 'spy' ? new SpyEvent(req, def) : new CommandEvent(req, def);
  self._initPromise.then(function () {
    self.execute(event, function (content, options) {
      self.hipchat.sendMessage(event.clientInfo, event.room.id, content, {options: options});
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
  var self = this;
  function commands() {
    var commands = _.map(self.commands, function (def) {
      return ['/' + def.name.join(', /'), '  ', def.args, '  ', def.help];
    }).sort(function (a, b) {
      return a[0] < b[0] ? -1 : (a[0] > b[0] ? 1 : 0);
    });
    return '<b>Commands</b>\n' + escapeHtml(cliff.stringifyRows(commands));
  }
  function spies() {
    var spies = _.map(self.spies, function (def) {
      return [def.hear, '  ', def.help];
    }).sort(function (a, b) {
      return a[0] < b[0] ? -1 : (a[0] > b[0] ? 1 : 0);
    });
    return '<b>Spies</b>\n' + escapeHtml(cliff.stringifyRows(spies));
  }
  if (type === 'commands') {
    return '<pre>' + commands() + '</pre>';
  } else if (type === 'spies') {
    return '<pre>' + spies() + '</pre>';
  } else {
    return '<pre>' + commands() + '\n\n' + spies() + '</pre>';
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
