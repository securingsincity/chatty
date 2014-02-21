// Ported from https://github.com/github/hubot-scripts/blob/master/src/scripts/xkcd.coffee

var _ = require('lodash');
var request = require('request');

module.exports = function (commander, logger) {

  commander.command({
    name: 'xkcd',
    args: '[latest|random|<id>]',
    help: 'Fetches an xkcd comic',
    action: function (event, response) {
      var match = /^(latest|random|\d+)(?:\s|$)/.exec(event.input);
      var arg = match && match[1];
      var url = 'http://xkcd.com/';
      if (!event.input || arg === 'latest' || arg === 'random') {
        url += 'info.0.json';
      } else if (arg) {
        url += arg + '/info.0.json';
      }
      request.get({
        url: url,
        json: true
      }, function (err, res, json) {
        if (err) return logger.error(err.stack || err);
        if (res.statusCode === 404) {
          return response.send('Comic not found');
        }
        if (json && json.img) {
          if (arg === 'random') {
            var max = json.num;
            var num = Math.floor((Math.random() * max) + 1);
            event.input = num.toString();
            commander.pipe('xkcd', event, function (msg) {
              response.send(msg);
            });
          } else {
            var msg = '"' + json.title + '"  ' + json.img;
            response.send(msg);
          }
        } else {
          response.send('Sorry, I didn\'t understand that');
        }
      });
    }
  });

};
