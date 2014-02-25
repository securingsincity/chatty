module.exports = function (commander, logger) {

  commander.script({
    help: 'A spy for illustrating how you feel about Java'
  });

  commander.spy({
    hear: /\b((fuck(ing)?|hate)\s+java)|(java\s+sucks)\b/i,
    help: 'How you really feel about Java',
    action: action
  });

};

function action(event, response) {
  response.random([
    'https://s3.amazonaws.com/uploads.hipchat.com/10804/132391/qOJSVtvBWOLoorv/java.jpg'
  ]);
}
