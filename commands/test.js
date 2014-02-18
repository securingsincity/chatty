module.exports = function (commander, logger) {

  commander.command({
    name: 'test',
    help: 'Test webhook updates on heroku',
    action: function (event, response) {
      response.send('(success)');
    }
  });

};
