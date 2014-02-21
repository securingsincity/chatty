var _ = require('lodash');
var RSVP = require('rsvp');
var Store = require('./store');

function Tenant(clientInfo, addon) {
  _.extend(this, clientInfo);
  this.addon = addon;
  this.store = Store.create(
    addon.key,
    addon.settings,
    this.clientKey,
    this.capabilitiesDoc.links.homepage,
    this.groupId,
    false
  );
  this._internalStore = Store.create(
    addon.key,
    addon.settings,
    this.clientKey,
    this.capabilitiesDoc.links.homepage,
    this.groupId,
    true
  );
}

exports.create = function (clientInfo, addon) {
  return new Tenant(clientInfo, addon);
};
