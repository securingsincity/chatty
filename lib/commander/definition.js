var _ = require('lodash');
var RSVP = require('rsvp');

function Definition(spec) {
  _.extend(this, spec);
}

Definition.prototype.isEnabled = function (tenant) {
  return this.script.isEnabled(tenant);
};

Definition.prototype.asJson = function (tenant) {
  return {
    id: this.id,
    type: this.type,
    name: this.name,
    hear: this.hear.toString(),
    args: this.args,
    help: this.help
  };
};

exports.create = function (spec) {
  return new Definition(spec);
};
