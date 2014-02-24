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

Response.prototype.help = function (command, usages) {
  if (!(typeof command === 'string')) {
    throw new Error('Response::help requires a command');
  }
  if (!usages || !usages.length) {
    throw new Error('Response::help requires an array of usage lines');
  }
  var usage = '<pre>' + ['Usage:'].concat(usages.map(function (line) {
    return '  /' + command + ' ' + line;
  })).join('<br>') + '</pre>';
  this.send(usage, {format: 'html'});
};

Response.prototype.confused = function (options) {
  this.send('Sorry, I didn\'t understand that', options);
};

exports.create = function (send, event) {
  return new Response(send, event);
};
