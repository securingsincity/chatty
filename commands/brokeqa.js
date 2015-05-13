module.exports = function (commander, logger) {

  commander.script({
    help: 'A spy for breaking the build'
  });

  commander.spy({
    hear: /broken/i,
    help: 'How you feel when you break the build',
    action: action
  });

};

function action(event, response) {
  response.random([
    'http://i.imgur.com/c6a1BEQ.gif'
  ]);
}