// Port of https://github.com/github/hubot-scripts/blob/master/src/scripts/alot.coffee

module.exports = function (commander, logger) {

  commander.script({
    help: 'A spy for displaying the MAXT links'
  });

  commander.spy({
    hear: /(MAXT-[0-9][0-9][0-9][0-9][0-9])(MAXT-[0-9][0-9][0-9][0-9])|(MAXT-[0-9][0-9][0-9])/i,
    help: 'JIRA MAXT to key',
    action: action
  });

  function action(event, response) {
    console.log(event);
    response.send("event : "+ event.input);
    console.log(response);
  }
};
