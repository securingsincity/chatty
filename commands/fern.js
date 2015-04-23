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
      'https://s3.amazonaws.com/uploads.hipchat.com/102551/759683/ehqDKCZFahvXAbP/ferntounge.gif',
      'http://i.giphy.com/l0O9ymOliegzAg3iU.gif',
      'https://lh3.googleusercontent.com/-xqhswG0BxwU/VTaTsB6zMlI/AAAAAAAANoQ/IN20q9pwnaQ/w1014-h1350-no/IMG_20150421_112354.jpg',
      'I\'m making a tindr for gifs - fern',
      'It\'s Britney B!#&%! - fern',
      'lego.js - fern',
      'F1 Racing? - fern',
      'styles and bugs - fern',
      'I wouldn\'t call it done per se - fern',
      'crosshit - fern',
      'ETSY!!!!!! - fern',
      'Who is f*cking with my zen - fern',
      'well you know the government... - fern',
      'f*ck WordPress - fern'
    ]);
  }

};
