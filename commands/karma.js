var _ = require('lodash');

module.exports = function (commander, logger) {

  commander.script({
    help: 'A command and spy for managing karma'
  });

  commander.command({
    name: 'karma',
    args: '<subject>',
    help: 'Looks up the subject\'s current karma',
    action: function (event, response) {
      if (!event.input) {
        return response.send('A subject is required when looking up karma');
      }
      var match = /\b(\w+)\b/.exec(event.input);
      if (match) {
        var subject = match[1];
        if (ignore(subject)) {
          return response.send(subject + ' is on the karma ignore list');
        }
        var name = displayName(event, subject);
        event.store.gget(subject).then(function (karma) {
          response.send(name + ' has ' + (karma || 0) + ' karma');
        }, function () {
          response.send(name + ' has 0 karma');
        });
      }
    }
  });

  commander.spy({
    hear: /(?:^|\s)(\w+)\s?(\+\+|--)(?:\s|$)/,
    help: 'Adds or removes karma',
    action: function (event, response) {
      var subject = event.captures[0];
      if (ignore(subject)) return;
      var add = event.captures[1] === '++';
      if (ignore(subject) || event.from.mention_name === subject) {
        return response.send(event.from.name + ', I am so disappointed in you!');
      }
      event.store.gget(subject).then(function (karma) {
        karma = (karma || 0) + (add ? 1 : -1);
        event.store.gset(subject, karma).then(function () {
          var changed = (add ? 'increased' : 'decreased');
          var name = displayName(event, subject);
          response.send(name + '\'s karma has ' + changed + ' to ' + karma);
        });
      });
    }
  });

  var ignoreList = [
    // 'c'
  ];

  function ignore(subject) {
    subject = subject.toLowerCase();
    return !ignoreList.every(function (entry) {
      return entry !== subject;
    });
  }

  function displayName(event, subject) {
    var mention = _.find(event.mentions, function (entry) {
      return entry.mention_name === subject;
    });
    if (mention) subject = mention.name;
    return subject;
  }

};
