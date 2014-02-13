var roller = require('roll');

module.exports = function (commander) {

  commander.command({
    name: 'roll',
    help: 'Dice roller (see https://github.com/troygoode/node-roll)',
    opts: {format: 'html'},
    action: function (event, response) {
      var result;
      try {
        result = roller.roll(event.input).result;
      } catch (e) {
        result = 'invalid roll';
      }
      response.send(event.from.name + ' rolled [' + event.input + ' = <b>' + result + '</b>]');
    }
  });

};
