var google = require('./_google');

module.exports = function (commander) {

  commander.on(/img|image/, function (event, response) {
    google({query: event.input}, response.send);
  });

};
