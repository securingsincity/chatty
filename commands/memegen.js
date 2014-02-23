// Ported from https://github.com/github/hubot-scripts/blob/master/src/scripts/meme_captain.coffee

var _ = require('lodash');
var request = require('request');

module.exports = function (commander, logger) {

  commander.script({
    help: 'A command for generating memes'
  });

  function generate(response, url, text1, text2) {
    text1 = (text1 || '').trim();
    text2 = (text2 || '').trim();
    request.get({
      url: 'http://memecaptain.com/g',
      json: true,
      qs: {
        u: url,
        t1: text1,
        t2: text2
      }
    }, function (err, res, json) {
      if (err) {
        logger.error(err.stack || err);
        return response.send('I don\'t feel like doing that right now');
      }
      if (res.statusCode === 301) {
        return generate(response, res.headers.location, text1, text2);
      }
      if (res.statusCode > 301){
        return response.send('Meme Capatain doesn\'t feel like doing that right now');
      }
      if (json && json.imageUrl) {
        return response.send(json.imageUrl);
      } else {
        return response.send('Sorry, I couldn\'t generate that meme');
      }
    });
  };

  commander.command({
    name: ['memegen', 'mgen'],
    args: 'help',
    help: 'Generates memes with memecaptain.com',
    action: function (event, response) {
      if (!event.input) {
        return response.send('I need more information; try "/memegen help"');
      }
      var match;
      if (match = /^help\b/.exec(event.input)) {
        return response.send([
          '/memegen y u no <text>',
          '/memegen aliens guy <text>',
          '/memegen brace yourself <text>',
          '/memegen <text> all the <things>',
          '/memegen I don\'t always <something> but when I do <text>',
          '/memegen success when <text> then <text>',
          '/memegen <text> too damn <high>',
          '/memegen not sure if <something> or <something-else>',
          '/memegen yo dawg <text> so <text>',
          '/memegen all your <text> are belong to <text>',
          '/memegen one does not simply <text>',
          '/memegen if you <text> gonna have a bad time',
          '/memegen if <text>, <word-that-can-start-a-question> <text>?'
        ].join('<br>'), {format: 'html'});
      }
      if (match = /^(Y U NO) (.*)/i.exec(event.input)) {
        return generate(response, 'http://memecaptain.com/y_u_no.jpg', match[1], match[2]);
      }
      if (match = /^aliens guy (.+)/i.exec(event.input)) {
        return generate(response, 'http://memecaptain.com/aliens.jpg', '', match[1]);
      }
      if (match = /^(brace yourself) (.+)/i.exec(event.input)) {
        return generate(response, 'http://i.imgur.com/cOnPlV7.jpg', match[1], match[2]);
      }
      if (match = /^(.*) (all the .*)/i.exec(event.input)) {
        return generate(response, 'http://memecaptain.com/all_the_things.jpg', match[1], match[2]);
      }
      if (match = /^(i don'?t always .*) (but when i do,? .*)/i.exec(event.input)) {
        return generate(response, 'http://memecaptain.com/most_interesting.jpg', match[1], match[2]);
      }
      if (match = /^success when (.*) then (.*)/i.exec(event.input)) {
        return generate(response, 'http://memecaptain.com/success_kid.jpg', match[1], match[2]);
      }
      if (match = /^(.*) (\w+\stoo damn .*)/i.exec(event.input)) {
        return generate(response, 'http://memecaptain.com/too_damn_high.jpg', match[1], match[2]);
      }
      if (match = /^(not sure if .*) (or .*)/i.exec(event.input)) {
        return generate(response, 'http://memecaptain.com/fry.png', match[1], match[2]);
      }
      if (match = /^(yo dawg .*) (so .*)/i.exec(event.input)) {
        return generate(response, 'http://memecaptain.com/xzibit.jpg', match[1], match[2]);
      }
      if (match = /^(all your .*) (are belong to .*)/i.exec(event.input)) {
        return generate(response, 'http://i.imgur.com/gzPiQ8R.jpg', match[1], match[2]);
      }
      if (match = /^(one does not simply) (.*)/i.exec(event.input)) {
        return generate(response, 'http://memecaptain.com/boromir.jpg', match[1], match[2]);
      }
      if (match = /^(if you .*\s)(.* gonna have a bad time)/i.exec(event.input)) {
        return generate(response, 'http://memecaptain.com/bad_time.jpg', match[1], match[2]);
      }
      if (match = /^(if .*), ((?:are|can|do|does|how|is|may|might|should|then|what|when|where|which|who|why|will|won't|would) .*)/i.exec(event.input)) {
        return generate(response, 'http://memecaptain.com/philosoraptor.jpg', match[1], match[2]);
      }
      // if (match = /^/i.exec(event.input)) {
      //   return generate(response, '', match[1], match[2]);
      // }
      return response.send('Sorry, I didn\'t understand that');
    }
  });

};
