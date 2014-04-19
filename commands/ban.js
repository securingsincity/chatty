// Port of https://github.com/github/hubot-scripts/blob/master/src/scripts/alot.coffee

module.exports = function (commander, logger) {

  commander.script({
    help: 'Fake Ban'
  });

  commander.command({
    name: 'ban',
    args: '[<word>]',
    help: 'Replies with a random ban message',
    action: action
  });

  function action(event, response) {
    response.random([
      'dude i\'m so banning you right now',
      event.input + ' you are so banned',
      'guys i\'m banning '+ event.input
    ]);
  }

};
