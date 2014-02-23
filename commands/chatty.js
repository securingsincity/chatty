var cliff = require('cliff');

module.exports = function (commander, logger) {

  commander.script({
    help: 'Commands for showing help for the chatty addon',
    required: true
  });

  commander.command({
    name: 'chatty',
    help: 'High-level help for Chatty',
    opts: {format: 'html'},
    action: function (event, response) {
      var helpUrl = commander.addon.config.localBaseUrl() + '/help';
      response.send(
        '<pre>' +
        'See <a href="' + helpUrl + '">all commands and spies</a>, or use:\n' +
        cliff.stringifyRows([
          [' ', '/commands', ' ', '[<filter>]', ' ', 'lists commands available in this room'],
          [' ', '/spies',    ' ', '[<filter>]', ' ', 'lists spies active in this room']
        ]) +
        '</pre>'
      );
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
        type: 'spies',
        filter: event.input,
        format: 'html'
      }).then(function (help) {
        response.send(help);
      });
    }
  });

};
