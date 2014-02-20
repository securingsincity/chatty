var _ = require('lodash');
var request = require('request');

module.exports = function (commander, logger) {

  commander.command({
    name: 'classname',
    help: 'Helpfully suggests class names',
    action: function (event, response) {
      request.get({
        url: 'http://classnamer.com/index.txt'
      }, function (err, res, body) {
        if (err) return logger.error(err.stack || err);
        if (body) {
          response.send(body.trim());
        }
      });
    }
  });

};
