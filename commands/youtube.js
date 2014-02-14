var request = require('request');
var _ = require('lodash');

module.exports = function (commander) {

  commander.command({
    name: 'youtube',
    help: 'Finds a video matching the query term',
    action: function (event, response) {
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
            var video = videos[_.random(videos.length - 1)];
            video.link.forEach(function (link) {
              if (link.rel === 'alternate' & link.type === 'text/html') {
                response.send(link.href);
              }
            });
          }
        }
      });
    }
  });

};
