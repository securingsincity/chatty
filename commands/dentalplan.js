// Port of https://github.com/github/hubot-scripts/blob/master/src/scripts/alot.coffee

module.exports = function(commander, logger) {

  commander.script({
    help: 'A spy for displaying "dental plan"'
  });

  commander.spy({
    hear: /dental plan/i,
    help: 'Replies with a random lisa needs braces',
    action: action
  });

  function action(event, response) {
    response.random([
      'lisa needs braces',
      'http://i.imgur.com/DNXzNCy.jpg',
      'https://thesoniashow.files.wordpress.com/2012/12/britishsmiles.png?w=390&h=321',
      'http://i.imgur.com/lHDBaWu.gif'
    ]);
  }

};
