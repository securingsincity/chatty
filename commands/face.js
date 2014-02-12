var google = require('./_google');

module.exports = function (commander) {

  commander.on('face', function (event, response) {
    google({query: event.input, face: true}, response.send);
  });

};
