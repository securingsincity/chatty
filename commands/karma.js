var _ = require('lodash');

module.exports = function (commander, logger) {

  commander.command({
    name: 'karma',
    args: '<subject>',
    help: 'Looks up the current karma of the given subject',
    action: function (event, response, store) {
      var match = /\b(\w+)\b/.exec(event.input);
      if (match) {
        var subject = match[1];
        if (_.contains(ignore, subject)) return;
        var subjectKey = key(subject);
        store.gget(subjectKey).then(function (karma) {
          response.send(subject + ' has ' + (karma || 0) + ' karma');
        }, function () {
          response.send(subject + ' has 0 karma');
        });
      }
    }
  });

  commander.spy({
    hear: /\b(\w+)\s?(\+\+|--)(?:[^+-]|$)/,
    action: function (event, response, store) {
      var subject = event.captures[0];
      if (_.contains(ignore, subject)) return;
      var subjectKey = key(subject);
      var add = event.captures[1] === '++';
      store.gget(subjectKey).then(function (karma) {
        karma = (karma || 0) + (add ? 1 : -1);
        store.gset(subjectKey, karma).then(function () {
          var changed = (add ? 'increased' : 'decreased');
          response.send(subject + '\'s karma has ' + changed + ' to ' + karma);
        });
      });
    }
  });

  var ignore = [
    'c'
  ];

  function key(subject) {
    return 'karma:' + subject;
  }

};
