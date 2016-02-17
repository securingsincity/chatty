// Since Weiss never checks hipchat unless he's @ mentioned,
// set a spy to call him out

module.exports = function(commander, logger) {

  commander.script({
    help: 'A spy for @weiss'
  });

  commander.spy({
    hear: /\b(you\s+won't)|dare\b/i,
    help: 'Replies with an @ mention for Weiss',
    action: action
  });

  function action(event, response) {
    response.send('@weiss');
  }

};
