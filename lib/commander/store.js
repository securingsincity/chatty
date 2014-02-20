var _ = require('lodash');
var RSVP = require('rsvp');

function Store(name, settings, clientKey, host, groupId, internal) {
  this._name = name;
  this._settings = settings;
  this._clientKey = clientKey;
  this._internal = !!internal;
  this._groupKey = require('crypto').createHash('sha1').update(host + ':' + groupId).digest('hex');
}

Store.prototype._key = function () {
  return this._name + ':commander' + (this._internal ? '-internal' : '') + ':' + [].join.call(arguments, ':');
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

Store.prototype.all = function (prefix) {
  var self = this;
  // TODO: support undefined prefix?
  prefix = self._clientKey + ':' + self._key(prefix) + ':';
  return new RSVP.Promise(function (resolve, reject) {
    self._settings.client.multi()
      .keys(prefix + '*', function (err, multiResults) {
        if (err) return reject(err);
        if (!multiResults || multiResults.length === 0) return resolve({});
        self._settings.client.mget(multiResults, function (err, mgetResults) {
          if (err) return reject(err);
          try {
            var results = _.object(mgetResults.map(function (result, i) {
              var key = multiResults[i].slice(prefix.length);
              return [key, JSON.parse(result)];
            }));
            resolve(results);
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

Store.prototype.gget = function (key) {
  return this._settings.get(this._key(key), this._groupKey);
};

Store.prototype.gset = function (key, value) {
  return this._settings.set(this._key(key), value, this._groupKey);
};

Store.prototype.gdel = function (key) {
  return this._settings.del(this._key(key), this._groupKey);
};

exports.create = function (settings, clientKey, host, groupId, internal) {
  return new Store(settings, clientKey, host, groupId, internal);
};
