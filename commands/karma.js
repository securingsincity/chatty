var _ = require('lodash');

module.exports = function (commander) {

  commander.command({
    name: 'karma',
    args: '<subject>',
    help: 'Looks up the current karma of the given subject',
    action: function (event, response, store) {
      var match = /\b(\w+)\b/.exec(event.input);
      if (match) {
        var subject = match[1];
        var subjectKey = 'karma:' + subject;
        store.get(subjectKey).then(function (karma) {
          response.send(subject + ' has ' + karma + ' karma');
        }, function () {
          response.send(subject + ' has 0 karma');
        });
      }
    }
  });

  commander.spy({
    hear: /\b(\w+)\s*(\+\+|--)(?:[^+-]|$)/,
    action: function (event, response, store) {
      var subject = event.captures[0];
      var subjectKey = 'karma:' + subject;
      var add = event.captures[1] === '++';
      store.get(subjectKey).then(function (karma) {
        karma = (karma || 0) + (add ? 1 : -1);
        store.set(subjectKey, karma).then(function () {
          var changed = (add ? 'increased' : 'decreased');
          response.send(subject + '\'s karma has ' + changed + ' to ' + karma);
        });
      });
    }
  });

};
