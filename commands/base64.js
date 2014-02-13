module.exports = function (commander) {

  commander.on(/^base64$/, function (event, response) {
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
  });

};
