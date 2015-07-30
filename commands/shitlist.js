var config = require('../configs/shitlist');
var _ = require('lodash');

module.exports = function (commander, logger) {

  commander.script({
    help: 'A spy for displaying "fern\'s shit list"'
  });

  commander.spy({
    hear: /shit list/i,
    help: 'Replies with a random item from the shit list',
    action: action
  });

  var things = _.pluck(config['data'], 'name');

  function action(event, response) {
    response.random(things);
  }

};
