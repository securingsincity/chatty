// Ported from https://github.com/github/hubot-scripts/blob/master/src/scripts/snow.coffee

var _ = require('lodash');
var request = require('request');
var xml2js = require('xml2js');
var cliff = require('cliff');

module.exports = function (commander, logger) {

  commander.script({
    help: 'A command for generating snow reports'
  });

  commander.command({
    name: 'snow',
    args: '[help]',
    help: 'Generates snow reports',
    action: function (event, response) {
      if (!event.input || event.input === 'help') {
        return response.send('<pre>' + [
          'Usage:',
          '  /snow in <state>',
          '  /snow at <resort>, <state>'
        ].join('<br>') + '</pre>', {format: 'html'});
      }
      var match = /^(?:(?:(in)\s+(\w+))|(?:(at)\s+([^,]+)\s*,\s+(\w+)))\b/.exec(event.input);
      if (!match) {
        return response.send('Sorry, I didn\'t understand that');
      }
      if (match[1] === 'in') {
        snowReport(response, match[2]);
      } else if (match[3] === 'at') {
        snowReport(response, match[5], match[4]);
      } else {
        response.send('Sorry, I didn\'t understand that');
      }
    }
  });

  var states = {
    'ak': 'alaska',
    'az': 'arizona',
    'ca': 'california',
    'co': 'colorado',
    'ct': 'connecticut',
    'id': 'idaho',
    'il': 'illinois',
    'in': 'indiana',
    'ia': 'iowa',
    'me': 'maine',
    'md': 'maryland',
    'ma': 'massachusetts',
    'mi': 'michigan',
    'mn': 'minnesota',
    'mo': 'missouri',
    'mt': 'montana',
    'nv': 'nevada',
    'nh': 'new-hampshire',
    'nj': 'new-jersey',
    'nm': 'new-mexico',
    'ny': 'new-york',
    'nc': 'north-carolina',
    'oh': 'ohio',
    'or': 'oregon',
    'pa': 'pennsylvania',
    'sd': 'south-dakota',
    'tn': 'tennessee',
    'ut': 'utah',
    'vt': 'vermont',
    'va': 'virginia',
    'wa': 'washington',
    'wv': 'west-virginia',
    'wi': 'wisconsin',
    'wy': 'wyoming'
  };

  function snowReport(response, state, resort) {
    var state = state.toLowerCase();
    var stateFull = states[state];
    if (!stateFull && _.contains(_.values(states), state)) {
      stateFull = state;
    }
    if (!stateFull) {
      return response.send('Sorry, ' + state + ' isn\'t a legitimate state, or there are no resorts there')
    }
    doSnowReport(response, 'http://www.onthesnow.com/' + stateFull + '/snow-rss.html', resort);
  }

  function doSnowReport(response, url, resort) {
    request.get({
      url: url
    }, function (err, res, xml) {
      if (err) {
        logger.error(err.stack || err);
        response.send('I don\'t feel like doing that right now');
      }
      if (res.statusCode === 301) {
        return doSnowReport(response, res.headers.location, resort);
      }
      if (res.statusCode === 404) {
        return response.send('Sorry, I couldn\'t find that location');
      }
      var parser = new xml2js.Parser();
      parser.parseString(xml, function (err, json) {
        if (err) {
          logger.error(err.stack || err);
          return response.send('I don\'t feel like doing that right now');
        }
        if (!json || !json.rss || !json.rss.channel || !json.rss.channel[0] || !json.rss.channel[0].item || json.rss.channel[0].item.length === 0) {
          return response.send('Sorry, I couldn\'t find any information about that');
        }
        var rows = _.map(json.rss.channel[0].item, function (area) {
          function get(key) { return (area[key] || [])[0]; }
          var title = get('ots:resort_name');
          if (!resort || new RegExp('\\b' + resort + '\\b', 'i').test(title)) {
            var status = get('ots:open_staus');
            var base = get('ots:base_depth') + ' ' + get('ots:base_depth_metric');
            var snowfall = get('ots:snowfall_48hr') + ' ' + get('ots:snowfall_48hr_metric');
            var condition = get('ots:surface_condition');
            return [title, ' ', status, ' ', base, ' ', snowfall, ' ', condition];
          }
          return [];
        }).filter(function (row) { return row.length > 0; });
        if (rows.length === 0) {
          return response.send('Sorry, no resorts match that name');
        }
        rows.unshift(['Resort', ' ', 'Status', ' ', 'Base Depth', ' ', 'Past 48hr', ' ', 'Condition']);
        response.send('<pre>' + cliff.stringifyRows(rows) + '</pre>', {format: 'html'});
      });
    });
  }

};
