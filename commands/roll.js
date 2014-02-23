var roller = require('roll');

module.exports = function (commander, logger) {

  commander.script({
    help: 'A command for rolling dice'
  });

  commander.command({
    name: 'roll',
    args: '[help|<expr>]',
    help: 'Evaluates dice expressions',
    opts: {format: 'html'},
    action: function (event, response) {
      if (event.input === 'help') {
        return response.send('<a href="https://github.com/troygoode/node-roll/blob/master/README.markdown">Expression help</a>');
      }
      var result;
      var expr = event.input ? event.input : '1d6';
      try {
        result = roller.roll(expr).result;
      } catch (e) {
        return response.send(expr + ' is not a valid dice expression');
      }
      response.send(event.from.name + ' rolled [' + expr + ' = <b>' + result + '</b>]');
    }
  });

};
