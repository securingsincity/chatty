var roller = require('roll');

module.exports = function (commander) {

  commander.on(/^roll$/, {format: 'html'}, function (event, response) {
    var result;
    try {
      result = roller.roll(event.input).result;
    } catch (e) {
      result = 'invalid roll';
    }
    response.send(event.from.name + ' rolled [' + event.input + ' = <b>' + result + '</b>]');
  });

};
