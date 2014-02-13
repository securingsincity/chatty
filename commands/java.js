module.exports = function (commander) {

  commander.command({
    name: 'java',
    help: 'Java: you know you love it',
    action: action
  });

  commander.spy({
    hear: /\b((fuck(ing)?|hate)\s+java)|(java\s+sucks)\b/i,
    action: action
  });

};

function action(event, response) {
  response.random([
    'https://s3.amazonaws.com/uploads.hipchat.com/10804/132391/qOJSVtvBWOLoorv/java.jpg'
  ]);
}
