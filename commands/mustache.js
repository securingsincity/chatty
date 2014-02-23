// Port of https://github.com/github/hubot/blob/master/src/scripts/google-images.coffee

var request = require('request');

module.exports = function (commander, logger) {

  commander.script({
    help: 'A command to mustachify images'
  });

  commander.command({
    name: 'mustache',
    args: '<url>|<query>',
    help: 'Mustachify an image url or search result',
    action: function (event, response) {
      var type = Math.floor(Math.random() * 6);
      if (/^https?:\/\/.*?\.(png|jpg|jpeg|gif)$/i.test(event.input)) {
        mustachify(event.input, response.send);
      } else {
        commander.pipe('face', event, function (url) {
          mustachify(url, function (result) {
            response.send(result);
          });
        });
      }
    }
  });

  function mustachify(url, next) {
    if (url) {
      next('http://mustachify.me/?src=' + encodeURIComponent(url));
    }
  }

};
