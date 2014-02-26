var _ = require('lodash');
var Tenant = require('./tenant');
var Store = require('./store');

function Event(addon, clientInfo, webhook, def) {
  var item = webhook.item;
  var msg = item.message;
  var message = msg.message;
  this.definition = def;
  this.messageId = msg.id;
  this.message = message;
  this.mentions = msg.mentions;
  this.date = new Date(msg.date);
  this.from = msg.from;
  this.room = item.room;
  this.tenant = Tenant.create(clientInfo, addon);
  this.store = def.script.createStore(this.tenant, addon);
};

Event.prototype.clone = function (overrides) {
  return _.extend(Object.create(this), overrides);
};

Event.prototype.args = function () {
  return this.input ? this.input.split(/\s+/) : [];
};

function SpyEvent(addon, clientInfo, webhook, def) {
  Event.call(this, addon, clientInfo, webhook, defi);
  var match = def.hear.exec(this.message);
  this.captures = match.slice(1);
}

SpyEvent.prototype = Object.create(Event.prototype);

function CommandEvent(addon, clientInfo, webhook, def) {
  Event.call(this, addon, clientInfo, webhook, def);
  var match = def.hear.exec(this.message);
  this.command = match[1];
  this.input = match[2];
}

CommandEvent.prototype = Object.create(Event.prototype);

exports.create = function (addon, clientInfo, webhook, def) {
  return def.type === 'spy'
    ? new SpyEvent(addon, clientInfo, webhook, def)
    : new CommandEvent(addon, clientInfo, webhook, def);
};
