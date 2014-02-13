module.exports = function (commander) {

  commander.on(/^chatty$/, {format: 'html'}, function (event, response) {
    // TODO: generate this dynamically from docs in command modules
    var msg =
      '<b>Commands</b>' +
      '<pre>' +
      [
        '/chatty                              this message<br>',
        '/img       [query]                   find an image<br>',
        '/image     [query]                   find an image<br>',
        '/anim      [query]                   find an animated image<br>',
        '/animate   [query]                   find an animated image<br>',
        '/face      [query]                   find an image of a face<br>',
        '/meme      [topic]?                  show a meme by topic or popularity<br>',
        '/java                                show us how you really feel<br>',
        '/shipit                              show a squirrel pic<br>',
        '/ackbar                              it\'s a trap!<br>',
        '/trap                                it\'s a trap!<br>',
        '/mustache  [url|query]               mustachify a url or query result<br>',
        '/alot                                you like it alot?<br>',
        '/base64    [encode|decode] [input]   base64 encode or decode input<br>',
        '/youtube   [query]                   find a video on youtube',
        '/chat                                ask for something fun to chat about',
        '/roll                                roll some dice (https://github.com/troygoode/node-roll)'
      ].sort().join('') +
      '</pre>';
    response.send(msg);
  });

};
