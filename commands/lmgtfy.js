var _ = require('lodash');

module.exports = function (commander, logger) {

  commander.script({
    help: 'A command to Google things for lazy people'
  });

  commander.command({
    name: 'lmgtfy',
    help: 'Let me Google that for you...',
    action: function (event, response) {
      var url = 'http://lmgtfy.com';
      if (event.input) {
        url += '?q=' + encodeURIComponent(event.input.trim());
      }
      response.send(url);
    }
  });

};
