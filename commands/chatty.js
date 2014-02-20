module.exports = function (commander, logger) {

  commander.script({
    required: true
  });

  commander.command({
    name: 'chatty',
    args: '[<filter>]',
    help: 'Prints both commands and spies help',
    opts: {format: 'html'},
    action: function (event, response) {
      response.send(commander.help({
        type: 'all',
        filter: event.input,
        format: 'html'
      }));
    }
  });

  commander.command({
    name: 'commands',
    args: '[<filter>]',
    help: 'Prints command help',
    opts: {format: 'html'},
    action: function (event, response) {
      response.send(commander.help({
        type: 'commands',
        filter: event.input,
        format: 'html'
      }));
    }
  });

  commander.command({
    name: 'spies',
    args: '[<filter>]',
    help: 'Prints spies help',
    opts: {format: 'html'},
    action: function (event, response) {
      response.send(commander.help({
        type: 'spies',
        filter: event.input,
        format: 'html'
      }));
    }
  });

};
