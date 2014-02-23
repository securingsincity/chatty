var request = require('request');
var crypto = require('crypto');
var cliff = require('cliff');
var _ = require('lodash');
var moment = require('moment-timezone');

module.exports = function (commander, logger) {

  commander.script({
    help: 'Commands for managing and displaying world clocks',
    variables: {
      apiKey: {name: 'Google API Key', required: true},
      dateFormat: {name: 'Date Format', value: 'ddd, h:mma z'}
    }
  });

  commander.command({
    name: 'clock',
    args: 'add|remove <address>',
    help: 'Adds or removes a clock by address',
    opts: {format: 'html'},
    action: function (event, response) {
      var match = /(add|remove)\s+(.+)/.exec(event.input);
      if (match) {
        var verb = match[1];
        var address = match[2];
        if (verb === 'add') {
          request.get({
            url: 'https://maps.googleapis.com/maps/api/geocode/json',
            qs: {
              key: event.variables.apiKey,
              address: address,
              sensor: false
            },
            json: true
          }, function (err, res, json) {
            if (err || res.statusCode !== 200 || !json || json.status !== 'OK') {
              if (err) {
                logger.error(err.stack || err);
              } else if (res.statusCode !== 200) {
                logger.error('Unexpected response code from google geocode api:', res.statusCode);
              } else {
                logger.error('Unexpected geocode response body:', json);
              }
              return res.send('Oops, something went wrong while adding a clock for ' + address);
            }
            if (!json.results || json.results.length === 0) {
              return res.send('There were no results for that address; please try again');
            }
            var geocode = json.results[0];
            var loc = geocode.geometry.location;
            var timestamp = Math.floor(Date.now()/1000).toString();
            request.get({
              url: 'https://maps.googleapis.com/maps/api/timezone/json',
              qs: {
                key: event.variables.apiKey,
                location: loc.lat + ',' + loc.lng,
                timestamp: timestamp,
                sensor: false
              },
              json: true
            }, function (err, res, json) {
              if (err || res.statusCode !== 200 || !json || json.status !== 'OK') {
                if (err) {
                  logger.error(err.stack || err);
                } else if (res.statusCode !== 200) {
                  logger.error('Unexpected response code from google timezone api:', res.statusCode);
                } else {
                  logger.error('Unexpected timezone response body:', json);
                }
                return response.send('Oops, something went wrong while adding a clock for ' + address);
              }
              var timezone = json.timeZoneId;
              var fullAddress = geocode.formatted_address;
              event.store.set(key(fullAddress), {address: fullAddress, timezone: timezone}).then(function () {
                response.send('Ok, I added a clock for ' + fullAddress);
              });
            });
          });
        } else {
          event.store.del(key(address)).then(function () {
            response.send('Ok, I removed the clock for ' + address);
          });
        }
      } else {
        response.send('Sorry, I didn\'t understand that');
      }
    }
  });

  commander.command({
    name: 'clocks',
    help: 'Displays the current time for all known clocks',
    opts: {format: 'html'},
    action: function (event, response) {
      event.store.all().then(function (all) {
        var entries = _.map(all, function (v) {
          return [moment().tz(v.timezone), ' ', v.address];
        }).sort(function (a, b) {
          var az = a[0].zone();
          var bz = b[0].zone();
          return az > bz ? -1 : (az < bz ? 1 : 0);
        }).map(function (v) {
          return [v[0].format(event.variables.dateFormat), v[1], v[2]];
        });
        if (entries.length > 0) {
          var msg = cliff.stringifyRows(entries);
          response.send('<pre>' + msg + '</pre>');
        } else {
          response.send('I haven\'t been given any clocks to display yet');
        }
      });
    }
  });

  function key(address) {
    return crypto.createHash('sha1').update(address).digest('hex');
  }

};
