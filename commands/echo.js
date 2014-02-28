module.exports = function (commander, logger) {

  commander.script({
    help: 'A command that echoes its input'
  });

  commander.command({
    name: ['echo', 'say'],
    args: '<message>',
    help: 'Prints the given message',
    action: function (event, response) {
      if (event.input) {
        response.send(event.input);
      }
    }
  });

};
