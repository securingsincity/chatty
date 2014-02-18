module.exports = function (commander, logger) {

  commander.command({
    name: 'chatty',
    help: 'Prints both commands and spies help',
    args: '[<filter>]',
    opts: {format: 'html'},
    action: function (event, response) {
      response.send(commander.help(null, event.input));
    }
  });

  commander.command({
    name: 'commands',
    help: 'Prints command help',
    args: '[<filter>]',
    opts: {format: 'html'},
    action: function (event, response) {
      response.send(commander.help('commands', event.input));
    }
  });

  commander.command({
    name: 'spies',
    help: 'Prints spies help',
    args: '[<filter>]',
    opts: {format: 'html'},
    action: function (event, response) {
      response.send(commander.help('spies', event.input));
    }
  });

};
