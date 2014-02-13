var request = require('request');
var _ = require('lodash');

module.exports = function (commander) {

  commander.on(/^youtube$/, function (event, response) {
    request.get({
      url: 'http://gdata.youtube.com/feeds/api/videos',
      qs: {
        'orderBy': 'relevance',
        'max-results': 10,
        'alt': 'json',
        'q': event.input
      }
    }, function (err, res, body) {
      if (err) return console.error(err.stack || err);
      if (body) {
        var data = JSON.parse(body);
        var videos = data.feed.entry;
        if (videos) {
          var video = videos[_.random(videos.length)];
          video.link.forEach(function (link) {
            if (link.rel === 'alternate' & link.type === 'text/html') {
              response.send(link.href);
            }
          });
        }
      }
    });
  });

};
