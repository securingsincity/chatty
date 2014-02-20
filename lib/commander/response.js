var _ = require('lodash');

function Response(_send, event) {
  this._send = _send;
  this._event = event;
  _.bindAll(this);
}

Response.prototype.send = function (content, options) {
  options = _.extend({}, this._event.definition.opts, options);
  this._send(content, options);
};

Response.prototype.random = function (list, options) {
  this.send(list[_.random(list.length - 1)], options);
};

exports.create = function (send, event) {
  return new Response(send, event);
};
