// Port of https://github.com/github/hubot-scripts/blob/master/src/scripts/alot.coffee

module.exports = function (commander, logger) {

  commander.script({
    help: 'A spy for displaying "fern"'
  });

  commander.spy({
    hear: /fern/i,
    help: 'Replies with a random fernism',
    action: action
  });

  function action(event, response) {
    response.random([
      'saucelabs? i fu**ing hate those guys - fern',
      'crosshit - fern',
      'ETSY!!!!!! - fern',
      'Who is f*cking with my zen - fern',
      'well you know the government... - fern'
    ]);
  }

};
