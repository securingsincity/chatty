var google = require('./_google');

module.exports = function (commander) {

  commander.on(/anim|animated/, function (event, response) {
    google({query: event.input, animated: true}, response.send);
  });

};
