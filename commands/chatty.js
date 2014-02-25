var cliff = require('cliff');

module.exports = function (commander, logger) {

  commander.script({
    help: 'Commands for showing help for the chatty addon',
    required: true
  });

  commander.command({
    name: 'chatty',
    args: '[help|commands|spies]',
    help: 'Chatty help',
    opts: {format: 'html'},
    action: function (event, response) {
      var matchl
      if (!event.input || (match = /^help\b/i.exec(event.input))) {
        var helpUrl = commander.addon.config.localBaseUrl() + '/help';
        response.help('chatty', 'See <a href="' + helpUrl + '">all commands and spies</a>', [
          'commands [<filter>] -- lists commands available in this room',
          'spies    [<filter>] -- lists spies active in this room'
        ]);
      } else if (match = /^commands\s*(.*)/i.exec(event.input)) {
        commander.help({
          tenant: event.tenant,
          type: 'commands',
          filter: match[1],
          format: 'html'
        }).then(function (help) {
          response.send(help);
        });
      } else if (match = /^spies\s*(.*)/i.exec(event.input)) {
        commander.help({
          tenant: event.tenant,
          type: 'spies',
          filter: match[1],
          format: 'html'
        }).then(function (help) {
          response.send(help);
        });
      } else {
        response.confused();
      }
    }
  });

};
