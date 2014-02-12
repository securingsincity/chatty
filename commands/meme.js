var memegen = require('./_memegen');

module.exports = function (commander) {

  commander.on('meme', function (event, response) {
    memegen.popular(response.send);
  });

};
