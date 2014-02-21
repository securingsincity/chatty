var roller = require('roll');

module.exports = function (commander, logger) {

  commander.script({
    help: 'A command for rolling dice'
  });

  commander.command({
    name: 'roll',
    help: 'Dice roller (see https://github.com/troygoode/node-roll)',
    opts: {format: 'html'},
    action: function (event, response) {
      var result;
      var expr = event.input ? event.input : '1d6';
      try {
        result = roller.roll(expr).result;
      } catch (e) {
        result = 'invalid roll';
      }
      response.send(event.from.name + ' rolled [' + expr + ' = <b>' + result + '</b>]');
    }
  });

};
