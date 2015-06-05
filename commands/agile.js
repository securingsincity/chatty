module.exports = function (commander, logger) {

  commander.script({
    help: 'A spy for mentions of agile'
  });

  commander.spy({
    hear: /\b(burn(down)|(burn down)(\s+chart)?)|(agile)|(scrum(\b|master))\b/i,
    help: 'How much do you like Agile?',
    action: action
  });

};

function action(event, response) {
  response.random([
    'http://i.imgur.com/Afte2jH.jpg',
    'http://i.imgur.com/ikmbePy.jpg',
    'http://i.imgur.com/0XuBYL1.jpg',
    'http://i.imgur.com/c71QjN6.jpg',
    'http://i.imgur.com/6ECFv6l.jpg',
    'http://i.imgur.com/ZrmnqE5.jpg',
    'http://i.imgur.com/L48LXmx.jpg',
    'http://i.imgur.com/OGSWkbQ.jpg',
    'http://i.imgur.com/Z1Evfk3.gif'
  ]);
}
