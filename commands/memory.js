var _ = require('lodash');
var cliff = require('cliff');

module.exports = function (commander, logger, scope) {

  commander.command({
    name: 'remember',
    args: '<key> <value>',
    help: 'Remembers a value for a given key',
    action: function (event, response) {
      var match = /^([\w-]+)\s+(.+)/.exec(event.input);
      if (match) {
        var key = scopedKey(match[1]);
        var value = match[2].trim();
        event.tenant.store.set(key, value).then(function () {
          response.send('Ok, I will remember that');
        });
      } else {
        response.send('Sorry, I didn\'t understand that');
      }
    }
  });

  commander.command({
    name: 'recall',
    args: '<key>',
    help: 'Recalls a value for a given key, if recognized',
    action: function (event, response) {
      var match = /^([\w-]+)/.exec(event.input);
      if (match) {
        var key = scopedKey(match[1]);
        event.tenant.store.get(key).then(function (value) {
          if (value) {
            response.send(value);
          } else {
            response.send('Sorry, I don\'t remember that');
          }
        });
      } else {
        response.send('Sorry, I didn\'t understand that');
      }
    }
  });

  commander.command({
    name: 'forget',
    args: '<key>',
    help: 'Forgets a value for a given key, if recognized',
    action: function (event, response) {
      var match = /^([\w-]+)/.exec(event.input);
      if (match) {
        var key = scopedKey(match[1]);
        event.tenant.store.del(key).then(function () {
          response.send('Ok, that has been forgotten');
        });
      } else {
        response.send('Sorry, I didn\'t understand that');
      }
    }
  });

  commander.command({
    name: ['mem', 'memory'],
    args: '[<filter>]',
    opts: {format: 'html'},
    help: 'Recalls all remembered values',
    action: function (event, response) {
      var search = event.input;
      event.tenant.store.all(scope).then(function (all) {
        function filter(line) {
          var esc = /[-[\]{}()*+?.,\\^$|#\s]/g;
          return search ? new RegExp('\\b' + search.replace(esc, '\\$&') + '\\b', 'i').test(line.join('    ')) : true;
        }
        if (_.size(all) === 0) {
          return response.send('I haven\'t been given anything to remember');
        }
        var entries = _.map(all, function (v, k) {
          return [k, '  ', v];
        }).filter(filter).sort();
        if (entries.length > 0) {
          var msg = cliff.stringifyRows(entries);
          var re = /\b(https?:\/\/[-A-Z0-9+&@#\/%?=~_|!:,.;]*[-A-Z0-9+&@#\/%=~_|])/ig;
          msg = msg.replace(re, function ($0, $1) {
            return '<a href="' + $1 + '">' + $1 + '</a>';
          });
          response.send('<pre>' + msg + '</pre>');
        } else {
          response.send('Nothing in my memory matches that filter');
        }
      });
    }
  });

  function scopedKey(key) {
    return scope + ':' + key;
  }

};
