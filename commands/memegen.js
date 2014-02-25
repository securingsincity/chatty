// Ported from https://github.com/github/hubot-scripts/blob/master/src/scripts/meme_captain.coffee

var _ = require('lodash');
var request = require('request');

module.exports = function (commander, logger) {

  commander.script({
    help: 'A command for generating memes'
  });

  commander.command({
    name: ['mgen', 'memegen'],
    args: '[help]',
    help: 'Generates memes with memecaptain.com',
    action: function (event, response) {
      var match;
      if (!event.input || (match = /^help\b/i.exec(event.input))) {
        return response.help('memegen', [
          'y u no <text>',
          'aliens guy <text>',
          'brace yourself <text>',
          '<text> all the <things>',
          'I don\'t always <something> but when I do <text>',
          '<text> too damn <high>',
          'not sure if <something> or <something-else>',
          'yo dawg <text> so <text>',
          'all your <text> are belong to <text>',
          'one does not simply <text>',
          'if you <text> gonna have a bad time',
          'if <text>, <word-that-can-start-a-question> <text>?',
          '<word-that-can-start-a-question> the hell <text>',
          'success when <text> then <text>',
          'fwp when <text> then <text>',
          'bad luck when <text> then <text>',
          'scumbag <text> then <text>',
          'what if i told you <text>',
          'i hate <text>',
          '<text> so i got that going for me',
          '<img-url> | <top-text> | <bottom-text>'
        ]);
      }
      if (match = /^(Y U NO) (.*)/i.exec(event.input)) {
        return generate(response, 'http://memecaptain.com/y_u_no.jpg', match[1], match[2]);
      }
      if (match = /^aliens guy (.+)/i.exec(event.input)) {
        return generate(response, 'http://memecaptain.com/aliens.jpg', '', match[1]);
      }
      if (match = /^((?:prepare|brace) (?:yourself|yourselves)) (.+)/i.exec(event.input)) {
        return generate(response, 'http://i.imgur.com/cOnPlV7.jpg', match[1], match[2]);
      }
      if (match = /^(.*) (all the .*)/i.exec(event.input)) {
        return generate(response, 'http://memecaptain.com/all_the_things.jpg', match[1], match[2]);
      }
      if (match = /^(i don'?t (?:always|normally) .*) (but when i do,? .*)/i.exec(event.input)) {
        return generate(response, 'http://memecaptain.com/most_interesting.jpg', match[1], match[2]);
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
      if (match = /^((?:how|what|when|where|who|why) the (?:hell|fuck|shit|crap)) (.*)/i.exec(event.input)) {
        return generate(response, 'http://memecaptain.com/src_images/z8IPtw', match[1], match[2]);
      }
      if (match = /^(?:success|nailed it) when (.*) then (.*)/i.exec(event.input)) {
        return generate(response, 'http://memecaptain.com/success_kid.jpg', match[1], match[2]);
      }
      if (match = /^(?:fwp|cry) when (.*) then (.*)/i.exec(event.input)) {
        return generate(response, 'http://v1.memecaptain.com/first_world_problems.jpg', match[1], match[2]);
      }
      if (match = /^bad luck when (.*) then (.*)/i.exec(event.input)) {
        return generate(response, 'http://v1.memecaptain.com/bad_luck_brian.jpg', match[1], match[2]);
      }
      if (match = /^scumbag(?: steve) (.*) then (.*)/i.exec(event.input)) {
        return generate(response, 'http://v1.memecaptain.com/scumbag_steve.jpg', match[1], match[2]);
      }
      if (match = /^(what if i told you) (.+)/i.exec(event.input)) {
        return generate(response, 'http://memecaptain.com/src_images/fWle1w', match[1], match[2]);
      }
      if (match = /^(i hate) (.+)/i.exec(event.input)) {
        return generate(response, 'http://memecaptain.com/src_images/_k6JVg', match[1], match[2]);
      }
      if (match = /^(.+),? (so i got that going for me(?:,? which is nice)?)/i.exec(event.input)) {
        var text2 = match[2];
        if (!/\bwhich is nice$/.test(text2)) {
          text2 += ', which is nice'
        }
        return generate(response, 'http://memecaptain.com/src_images/h9ct5g', match[1], text2);
      }
      if (match = /^(https?:\/\/[^|\s]+\.(?:jpg|jpeg|gif|png)[^|\s]*)\s*\|\s*([^|]*)\s*\|\s*([^|]*)/i.exec(event.input)) {
        return generate(response, match[1], match[2], match[3]);
      }
      return response.send('Sorry, I didn\'t understand that');
    }
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
        return response.send('Meme Captain doesn\'t feel like doing that right now');
      }
      if (json && json.imageUrl) {
        return response.send(json.imageUrl);
      } else {
        return response.send('Sorry, I couldn\'t generate that meme');
      }
    });
  }

};
