// Port of https://github.com/github/hubot-scripts/blob/master/src/scripts/poem.coffee

var request = require('request');
var jsdom = require('jsdom');
var _ = require('lodash');

module.exports = function (commander, logger) {

  commander.script({
    help: 'A command to create "poems" from the collective yearning of humanity'
  });

  commander.command({
    name: 'poem',
    args: '[<lines>] <about>',
    opts: {format: 'html'},
    help: 'Creates a "poem" from Google Suggest',
    action: function (event, response) {
      var match = /(?:(\d)\s+)?(.+)/.exec(event.input);
      if (match) {
        var lines = match[1] || 3;
        var about = match[2];
        request.get({
          url: 'https://clients1.google.com/complete/search',
          qs: {output: 'toolbar', hl: 'en', q: about}
        }, function (err, res, body) {
          if (err) return logger.error(err.stack || err);
          if (body) {
            try {
              var suggestions = [];
              _.forEach(jsdom.jsdom(body).getElementsByTagName('suggestion'), function (suggestion) {
                var suggestion = suggestion.getAttribute('data');
                if (suggestion && !/lyrics/.test(suggestion)) {
                  suggestions.push(suggestion);
                }
              });
              response.send(suggestions.slice(0, lines).join('<br>'));
            } catch (e) {
              logger.error(e);
              response.send('I don\'t feel like writing poems today');
            }
          }
        });
      }
    }
  });

};
