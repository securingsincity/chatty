var _ = require('lodash');
var RSVP = require('rsvp');
var Store = require('./store');

function Tenant(clientInfo, addon) {
  // TODO: debugging an issue seen on heroku... why would we have clientInfo without the caps doc?
  if (!clientInfo.capabilitiesDoc) {
    addon.logger.error('No capabilitiesDoc for key:', clientInfo.clientKey, ', in clientInfo:', require('util').inspect(clientInfo));
    throw new Error('No capabilitiesDoc in clientInfo for clientKey: ' + clientInfo.clientKey);
  }
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
