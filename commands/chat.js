var request = require('request');

module.exports = function (commander) {

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
        if (err) return console.error(err.stack || err);
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
