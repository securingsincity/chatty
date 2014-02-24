var _ = require('lodash');
var cliff = require('cliff');

module.exports = function (commander, logger) {

  commander.script({
    help: 'A set of commands for storing and retrieving information'
  });

  commander.command({
    name: ['mem', 'memory'],
    args: '[help]',
    opts: {format: 'html'},
    help: 'Simple key-value storage',
    action: function (event, response) {
      var match;
      if (!event.input || (match = /^help\b/i.exec(event.input))) {
        response.help('memory', [
          'set <key> [=] <value>',
          'get <key>',
          'del|delete <key>',
          'show [<filter>]',
        ]);
      } else if (match = /^set\s+([\w-]+)(?:(?:\s*=\s*)|\s+)(.+)/i.exec(event.input)) {
        set(event, response, match[1], match[2]);
      } else if (match = /^get\s+([\w-]+)\s*$/i.exec(event.input)) {
        get(event, response, match[1]);
      } else if (match = /^del|delete\s+([\w-]+)\s*$/i.exec(event.input)) {
        del(event, response, match[1]);
      } else if (match = /^show\s*(.*)/i.exec(event.input)) {
        show(event, response, match[1]);
      } else {
        response.confused();
      }
    }
  });

  function set(event, response, key, value) {
    event.store.set(key, value).then(function () {
      response.send('Ok, I will remember that value for ' + key);
    });
  }

  function get(event, response, key) {
    event.store.get(key).then(function (value) {
      if (value) {
        response.send(linkify(value));
      } else {
        response.send('Sorry, I don\'t remember anything about ' + key);
      }
    });
  }

  function del(event, response, key) {
    event.store.del(key).then(function () {
      response.send('Ok, I forgot about ' + key);
    });
  }

  function show(event, response, filter) {
    event.store.all().then(function (all) {
      function filterer(line) {
        var esc = /[-[\]{}()*+?.,\\^$|#\s]/g;
        return filter ? new RegExp('\\b' + filter.replace(esc, '\\$&') + '\\b', 'i').test(line.join('    ')) : true;
      }
      if (_.size(all) === 0) {
        return response.send('I haven\'t been given anything to remember');
      }
      var entries = _.map(all, function (v, k) {
        return [k, '=', v];
      }).filter(filterer).sort();
      if (entries.length > 0) {
        response.send('<pre>' + linkify(cliff.stringifyRows(entries)) + '</pre>');
      } else {
        response.send('Nothing in my memory matches that filter');
      }
    });
  }

  function linkify(msg) {
    var re = /\b(https?:\/\/[-A-Z0-9+&@#\/%?=~_|!:,.;]*[-A-Z0-9+&@#\/%=~_|])/ig;
    return msg.replace(re, function ($0, $1) {
      return '<a href="' + $1 + '">' + $1 + '</a>';
    });
  }

};
