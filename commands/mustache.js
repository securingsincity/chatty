var request = require('request');

module.exports = function (commander) {

  commander.command({
    name: 'mustache',
    args: '<url>|<query>',
    help: 'Mustachifies an image url or found with the query term',
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

};

function mustachify(url, next) {
  if (url) {
    next('http://mustachify.me/?src=' + encodeURIComponent(url));
  }
}
