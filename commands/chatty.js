module.exports = function (commander, logger) {

  commander.script({
    help: 'Commands for showing help for the chatty addon',
    required: true
  });

  commander.command({
    name: 'chatty',
    args: '[<filter>]',
    help: 'Prints both commands and spies help',
    opts: {format: 'html'},
    action: function (event, response) {
      commander.help({
        tenant: event.tenant,
        type: 'all',
        filter: event.input,
        format: 'html'
      }).then(function (help) {
        response.send(help);
      });
    }
  });

  commander.command({
    name: 'commands',
    args: '[<filter>]',
    help: 'Prints command help',
    opts: {format: 'html'},
    action: function (event, response) {
      commander.help({
        tenant: event.tenant,
        type: 'commands',
        filter: event.input,
        format: 'html'
      }).then(function (help) {
        response.send(help);
      });
    }
  });

  commander.command({
    name: 'spies',
    args: '[<filter>]',
    help: 'Prints spies help',
    opts: {format: 'html'},
    action: function (event, response) {
      commander.help({
        tenant: event.tenant,
        type: 'commands',
        filter: event.input,
        format: 'html'
      }).then(function (help) {
        response.send(help);
      });
    }
  });

};
