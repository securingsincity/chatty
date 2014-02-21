var _ = require('lodash');
var Tenant = require('./tenant');
var Store = require('./store');

function Event(addon, req, def) {
  var item = req.context.item;
  var msg = item.message;
  var message = msg.message;
  this.definition = def;
  this.messageId = msg.id;
  this.message = message;
  this.mentions = msg.mentions;
  this.date = new Date(msg.date);
  this.from = msg.from;
  this.room = item.room;
  this.tenant = Tenant.create(req.clientInfo, addon);
  this.store = Store.create(
    addon.key,
    addon.settings,
    this.tenant.clientKey,
    this.tenant.capabilitiesDoc.links.homepage,
    this.tenant.groupId,
    false
  );
  this.store.scope(def.script.name);
};

Event.prototype.clone = function (overrides) {
  return _.extend(Object.create(this), overrides);
};

Event.prototype.args = function () {
  return this.input ? this.input.split(/\s+/) : [];
};

function SpyEvent(addon, req, def) {
  Event.call(this, addon, req, def);
  var match = def.hear.exec(this.message);
  this.captures = match.slice(1);
}

SpyEvent.prototype = Object.create(Event.prototype);

function CommandEvent(addon, req, def) {
  Event.call(this, addon, req, def);
  var match = def.hear.exec(this.message);
  this.command = match[1];
  this.input = match[2];
}

CommandEvent.prototype = Object.create(Event.prototype);

exports.create = function (addon, req, def) {
  return def.type === 'spy' ? new SpyEvent(addon, req, def) : new CommandEvent(addon, req, def);
};
