var _ = require('lodash');
var RSVP = require('rsvp');

function Variables(scope) {
  this.scope = scope;
  this.spec = {};
  this.values = {};
}

Variables.prototype.define = function (spec) {
  var self = this;
  if (spec) {
    self.spec = spec;
    _.each(spec, function (conf, key) {
      if (conf.value) {
        self.values[key] = conf.value;
      }
    })
  }
};

Variables.prototype.get = function (tenant) {
  var self = this;
  return tenant._store.get(self.scope + ':variables').then(function (vars) {
    return _.extend({}, self.values, vars);
  });
};

Variables.prototype.set = function (tenant, vars) {
  var self = this;
  return tenant._store.set(self.scope + ':variables', vars);
};

exports.create = function (scope) {
  return new Variables(scope);
};
