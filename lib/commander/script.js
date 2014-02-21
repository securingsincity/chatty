var _ = require('lodash');
var RSVP = require('rsvp');
var Variables = require('./variables');

function Script(path, name) {
  this.path = path;
  this.name = name;
  this.variables = Variables.create(name);
  this._conf = {};
  this._commands = {};
  this._spies = {};
}

Script.prototype.configure = function (conf) {
  this._conf = conf;
};

Script.prototype.defineVariables = function (vars) {
  this.variables.define(vars);
};

Script.prototype.addCommand = function (def) {
  this._commands[def.id] = def;
};

Script.prototype.addSpy = function (def) {
  this._spies[def.id] = def;
};

Script.prototype.isEnabled = function (tenant) {
  var self = this;
  return self.getMeta(tenant).then(function (meta) {
    var enabled = meta.enabled === false ? false : true;
    if (enabled) {
      return self.variables.get(tenant).then(function (vars) {
        return !self._varsRequired(vars);
      });
    } else {
      return false;
    }
  });
};

Script.prototype.requiresConf = function (tenant) {
  return self.variables.get(tenant).then(function (vars) {
    return !self._varsRequired(vars);
  });
};

Script.prototype._varsRequired = function (vars) {
  var self = this;
  return !_.every(_.map(self.variables.spec, function (conf, k) {
    return !conf.required || (vars[k] != null && vars[k].length > 0);
  }));
};

Script.prototype.asJson = function (tenant) {
  var self = this;
  return self.isEnabled(tenant).then(function (enabled) {
    return RSVP.all(['commands', 'spies'].map(function (collection) {
      return RSVP.all(_.map(self['_' + collection], function (def, key) {
        return def.asJson(tenant);
      })).then(function (defs) {
        return [collection, defs];
      });
    })).then(function (kvs) {
      return self.variables.get(tenant).then(function (vars) {
        return _.extend(_.object(kvs), {
          name: self.name,
          variables: vars,
          varspec: self.variables.spec,
          varsRequired: self._varsRequired(vars),
          conf: self._conf,
          enabled: enabled
        });
      });
    });
  });
};

Script.prototype.update = function (tenant, json) {
  var self = this;
  return RSVP.all([
    self.setMeta(tenant, {enabled: json.enabled === false ? false : true}),
    self.variables.set(tenant, json.variables || {})
  ]);
};

Script.prototype.getMeta = function (tenant) {
  var self = this;
  var store = tenant._internalStore;
  var key = self.name + ':meta';
  return store.get(key).then(function (meta) {
    function loaded() {
      if (self._conf.required && !meta.enabled) {
        meta.enabled = true;
        return store.set(key, meta).then(function () {
          return meta;
        });
      } else {
        return meta;
      }
    }
    if (meta) {
      return loaded();
    } else {
      meta = {enabled: true};
      return store.set(key, meta).then(function () {
        return loaded();
      });
    }
  });
};

Script.prototype.setMeta = function (tenant, meta) {
  var self = this;
  var store = tenant._internalStore;
  var key = self.name + ':meta';
  return store.set(key, meta);
};

exports.create = function (path, name) {
  return new Script(path, name);
};
