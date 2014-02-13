var _ = require('lodash');

var slashRe = /^\/(\w+)(\s+.*)?$/;

module.exports = function (addon, hipchat) {

  return new Commander(addon, hipchat);

};

function Commander(addon, hipchat) {
  var self = this;
  self.addon = addon;
  self.hipchat = hipchat;
  self.matchers = [];

  // load scripts
  var fs = require('fs');
  var dir = __dirname + '/../commands/';
  if (fs.existsSync(dir)) {
    fs.readdirSync(dir).forEach(function(file) {
      var path = dir + file;
      if (file.charAt(0) !== '_') { // skip 'private' modules
        if (file.indexOf('index.') === -1) {
          addon.logger.info('Loading commands from', file);
          var module = require(path);
          if (typeof module === 'function') {
            try {
              module(self, addon.logger);
            } catch (e) {
              addon.logger.error(e.stack);
            }
          } else {
            addon.logger.warn('Found command module of unexpected type (module must be a function):', path);
          }
        } else {
          addon.logger.warn('Not loading command module index:', path);
        }
      }
    });
  }
}

Commander.prototype.on = function (matcher, options, handler) {
  if (typeof options === 'function') {
    handler = options;
    options = undefined;
  }
  if (!matcher || !(typeof handler === 'function')) return;
  if (typeof matcher === 'string') {
    matcher = new RegExp(matcher);
  }
  options = _.extend({}, {color: 'gray', format: 'text'}, options);
  this.matchers.push({matcher: matcher, handler: handler, options: options});
}

Commander.prototype.handleWebhook = function (req) {
  var self = this;
  if (!self.recognizes(req)) return false;
  process.nextTick(function () {
    var event = new Event(req);
    self.execute(event, function (content, options) {
      options = {options: options};
      self.hipchat.sendMessage(event.clientInfo, event.room.id, content, options);
    });
  });
  return true;
}

Commander.prototype.recognizes = function(req) {
  return req
      && req.context
      && req.context.event === 'room_message'
      && req.context.item
      && req.context.item.message
      && req.context.item.message.message
      && slashRe.test(req.context.item.message.message);
}

Commander.prototype.execute = function(event, send) {
  var self = this;
  self.matchers.forEach(function (entry) {
    var match = slashRe.exec(event.message);
    if (match && match[1]) {
      var cmdMatch = entry.matcher.exec(match[1]);
      if (cmdMatch) {
        try {
          entry.handler(event, {
            send: function (content, options) {
              options = _.extend({}, entry.options, options);
              send(content, options);
            }
          });
        } catch (e) {
          self.addon.logger.error('Error executing command handler:\n', e.stack);
        }
      }
    }
  });
}

Commander.prototype.pipe = function (command, event, next) {
  message = event.message.replace(new RegExp('^/' + event.command), '/' + command);
  event = event.clone({
    command: command,
    message: message
  });
  console.log(event);
  this.execute(event, next);
};

function Event(req) {
  var env = req.context;
  var clientId = env.oauth_client_id;
  var item = env.item;
  var msg = item.message;
  var message = msg.message;
  var match = slashRe.exec(message);
  this.oauthClientId = env.oauth_client_id;
  this.clientInfo = req.clientInfo;
  this.messageId = msg.id;
  this.message = message;
  this.command = match[1];
  this.input = match[2] ? match[2].trim() : '';
  this.mentions = msg.mentions;
  this.date = new Date(msg.date);
  this.from = msg.from;
  this.room = item.room;
};

Event.prototype.clone = function (overrides) {
  return _.extend(Object.create(this), overrides);
};
