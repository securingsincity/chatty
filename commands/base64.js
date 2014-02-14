// Port of https://github.com/github/hubot-scripts/blob/master/src/scripts/base64.coffee

module.exports = function (commander, logger) {

  commander.command({
    name: 'base64',
    args: 'encode|decode <value>',
    help: 'Base64 encodes or decodes strings',
    action: function (event, response) {
      var match = /(encode|decode)\s+(.*)/.exec(event.input);
      if (match) {
        var value;
        if (match[1] === 'encode') {
          value = new Buffer(match[2]).toString('base64');
        } else {
          value = new Buffer(match[2], 'base64').toString('utf8');
        }
        response.send(value);
      }
    }
  });

};
