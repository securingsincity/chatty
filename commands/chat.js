// Port of https://github.com/github/hubot-scripts/blob/master/src/scripts/chat.coffee

var request = require('request');

module.exports = function (commander, logger) {

  commander.command({
    name: 'chat',
    help: 'Suggests a topic for conversation',
    action: function (event, response) {
      request.get({
        url: 'http://chatoms.com/chatom.json',
        qs: {
          'Normal': 1,
          'Fun': 2,
          'Philosophy': 3,
          'Out There': 4,
          'Love': 5,
          'Personal': 7
        }
      }, function (err, res, body) {
        if (err) return logger.error(err.stack || err);
        if (body) {
          var data = JSON.parse(body);
          if (data && data.text) {
            response.send(data.text);
          }
        }
      });
    }
  });

};
