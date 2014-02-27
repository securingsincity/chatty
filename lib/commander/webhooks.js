var _ = require('lodash');
var RSVP = require('rsvp');
var trier = require('trier');

function Webhooks(addon, hipchat) {
  this.addon = addon;
  this.logger = addon.logger;
  this.hipchat = hipchat;
  this.webhooks = this.addon.descriptor.capabilities.webhook;
  if (!this.webhooks) {
    this.webhooks = this.addon.descriptor.capabilities.webhook = [];
  }
}

Webhooks.prototype.add = function (def) {
  var pattern = def.hear.toString();
  // TODO: tail trimming needs to be more robust to account for multiple flags
  pattern = pattern.slice(1, pattern.length - (/\/[gimy]$/.test(pattern) ? 2 : 1));
  this.webhooks.push({
    name: def.id,
    event: 'room_message',
    pattern: pattern,
    url: this.addon.config.localBaseUrl() + '/webhook?type=' + def.type + '&id=' + def.id
  });
};

Webhooks.prototype.update = function () {
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
              self.logger.warn('Failed to retrieve clientInfo for key: ' + key + '\n' + (err.stack || err));
              // skip it
              resolveOne();
            }
            // only update for tenants with an associated room id
            var clientInfo = JSON.parse(clientInfoJson);
            if (!clientInfo.roomId) {
              self.logger.warn('Skipping tenant with unknown roomId:', clientInfo.clientKey);
            } else {
              // run a retry loop until we successfully update the current tenant
              var complete = false;
              trier.attempt({
                // 1s with exponential dropoff
                interval: -1000,
                // try 17 times over about 3 days
                limit: 17,
                until: function () {
                  return complete;
                },
                action: function (done) {
                  self.updateTenant(clientInfo, function (err) {
                    if (err) {
                      if (err.request )
                      self.logger.warn('Failed to update tenant webhooks (will retry):' + JSON.stringify(clientInfo));
                    } else {
                      complete = true;
                    }
                    done();
                  });
                }
              });
            }
            resolveOne();
          });
        });
      })).then(resolve, reject);
    });
  });
};

Webhooks.prototype.updateTenant = function (clientInfo, callback) {
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
          self.logger.info('Added message webhook to tenant', clientInfo.clientKey, 'in room', clientInfo.roomId, 'for pattern', webhook.pattern);
        });
      }));
    }).then(function () {
      if (remove.length > 0 || add.length > 0) {
        self.hipchat.sendMessage(clientInfo, clientInfo.roomId, self.addon.descriptor.name + '\'s capabilities have been updated');
      }
      callback();
    }).catch(function (err) {
      callback(err);
    });
  }
  function fail(err) {
    callback(err);
  }
  self.hipchat.getRoomWebhooks(clientInfo, clientInfo.roomId).then(done, fail);
};

exports.create = function (addon, hipchat, commands, spies) {
  return new Webhooks(addon, hipchat, commands, spies);
};
