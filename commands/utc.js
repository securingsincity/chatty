var _ = require('lodash');
var moment = require('moment-timezone');

module.exports = function (commander, logger) {

  commander.script({
    help: 'A command to print the current time in UTC',
    variables: {
      dateFormat: {name: 'Date Format', value: 'ddd, h:mma z'}
    }
  });

  commander.command({
    name: 'utc',
    help: 'Prints the current time in UTC',
    action: function (event, response) {
      response.send(moment.utc().format(event.variables.dateFormat));
    }
  });

};
