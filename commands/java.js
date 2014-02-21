module.exports = function (commander, logger) {

  commander.script({
    help: 'A command and spy for illustrating how you feel about Java'
  });

  commander.command({
    name: 'java',
    help: 'Show the world how you feel about Java',
    action: action
  });

  commander.spy({
    hear: /\b((fuck(ing)?|hate)\s+java)|(java\s+sucks)\b/i,
    help: 'Illustrates how you really feel about Java',
    action: action
  });

};

function action(event, response) {
  response.random([
    'https://s3.amazonaws.com/uploads.hipchat.com/10804/132391/qOJSVtvBWOLoorv/java.jpg'
  ]);
}
