module.exports = function (commander) {

  commander.on('chatty', {format: 'html'}, function (event, response) {
    // TODO: generate this dynamically from docs on command modules
    response.send(
        '<b>Chatty commands</b>'
      + '<pre>'
      + '/chatty              this message<br>'
      + '/img       [query]   find an image<br>'
      + '/image     [query]   find an image<br>'
      + '/anim      [query]   find an animated image<br>'
      + '/animated  [query]   find an animated image<br>'
      + '/face      [query]   find an image of a face<br>'
      + '/meme                show a popular meme<br>'
      + '</pre>'
    );
  });

};
