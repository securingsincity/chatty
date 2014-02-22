module.exports = function (commander, logger) {

  commander.script({
    help: 'A spy that helps Chatty fight back against negative karma'
  });

  commander.spy({
    hear: /(?:^|\s)chatty\s?--(?:\s|$)/i,
    help: 'Chatty is watching you',
    action: function (event, response) {
      response.send('I\'ll cut you!  http://i.imgur.com/C1PG0CM.png');
    }
  });

};
