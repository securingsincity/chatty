// Ported from https://github.com/github/hubot-scripts/blob/master/src/scripts/brewerydb.coffee

var _ = require('lodash');
var request = require('request');

module.exports = function (commander, logger) {

  commander.script({
    help: 'A command for searching beers',
    variables: {
      apiKey: {name: 'Brewery DB API Key', required: true}
    }
  });

  commander.command({
    name: 'beer',
    args: '[<query>]',
    opts: {format: 'html'},
    help: 'Searches for beer',
    action: function (event, response) {
      var match = /^(latest|random|\d+)(?:\s|$)/.exec(event.input);
      var arg = match && match[1];
      var url = 'http://api.brewerydb.com/v2/search';
      if (!event.input) {
        return response.send('Please tell me something about the beer to search for');
      }
      request.get({
        url: url,
        json: true,
        qs: {
          type: 'beer',
          withBreweries: 'Y',
          key: event.variables.apiKey,
          q: event.input
        }
      }, function (err, res, json) {
        if (err) return logger.error(err.stack || err);
        if (res.statusCode !== 200) {
          return response.send('Oh-oh, too many beer searches have been made today');
        }
        if (json && json.data && json.data.length > 0) {
          var beers = json.data;
          var beer = beers[0];
          var msg = '';
          if (beers.length > 1) msg += '<i>Showing the first of ' + json.totalResults + ' matching beers</i><br>'
          msg += '<b>' + beer.name + '</b>'
          if (beer.style) msg += ', ' + beer.style.name;
          if (beer.breweries) msg += ' (' + beer.breweries[0].name + ')';
          if (beer.abv) msg += '<br><i>ABV</i>: ' + beer.abv + '%';
          if (beer.ibu) msg += '<br><i>IBU</i>: ' + beer.ibu;
          if (beer.description) msg += '<br>' + beer.description;
          if (beer.labels && beer.labels.medium) msg += '<br><img src="' + beer.labels.medium + '">';
          response.send(msg);
        } else {
          response.send('Sorry, no beers found');
        }
      });
    }
  });

};
