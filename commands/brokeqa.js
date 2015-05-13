module.exports = function (commander, logger) {

  commander.script({
    help: 'A spy for breaking the build'
  });

  commander.spy({
    hear: /\b(i\s+broke\s+qa)|(qa\s+is\s+broken)|(qa\s+broke)|(broke\s+the\s+build)|(build\s+is\s+broken)\b/i,
    help: 'How you feel when you break the build',
    action: action
  });

};

function action(event, response) {
  response.random([
    'http://i.imgur.com/c6a1BEQ.gif'
  ]);
}