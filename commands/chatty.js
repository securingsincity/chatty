module.exports = function (commander, logger) {

  commander.command({
    name: 'chatty',
    help: 'Prints both commands and spies help',
    opts: {format: 'html'},
    action: function (event, response) {
      response.send(commander.help());
    }
  });

  commander.command({
    name: 'commands',
    help: 'Prints command help',
    opts: {format: 'html'},
    action: function (event, response) {
      response.send(commander.help('commands'));
    }
  });

  commander.command({
    name: 'spies',
    help: 'Prints spies help',
    opts: {format: 'html'},
    action: function (event, response) {
      response.send(commander.help('spies'));
    }
  });

};
