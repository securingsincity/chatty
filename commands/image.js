var request = require('request');

module.exports = function (commander) {

  commander.command({
    name: ['img', 'image'],
    args: '<query>',
    help: 'Finds an image matching the query term',
    action: function (event, response) {
      google({query: event.input}, response.send);
    }
  });

  commander.command({
    name: ['anim', 'animated'],
    args: '<query>',
    help: 'Finds an animation matching the query term',
    action: function (event, response) {
      google({query: event.input, animated: true}, response.send);
    }
  });

  commander.command({
    name: ['face'],
    args: '<query>',
    help: 'Finds a face matching the query term',
    action: function (event, response) {
      google({query: event.input, face: true}, response.send);
    }
  });

};

function google(options, next) {
  var query = options.query;
  var animated = options.animated;
  var face = options.face;
  if (typeof animated === 'function') {
    next = animated;
  }
  if (typeof faces === 'function') {
    next = faces;
  }
  var q = {v: '1.0', rsz: '8', q: query, safe: 'active'};
  if (typeof animated === 'boolean' && animated === true) {
    q.imgtype = 'animated';
  }
  if (typeof faces === 'boolean' && faces === true) {
    q.imgtype = 'face';
  }
  request.get({
    url: 'http://ajax.googleapis.com/ajax/services/search/images',
    qs: q
  }, function (err, res, body) {
    if (err) return console.error(err.stack || err);
    if (body) {
      var images = JSON.parse(body);
      if (images.responseData) {
        images = images.responseData.results;
        if (images && images.length > 0) {
          var image = images[Math.floor(Math.random() * images.length)];
          if (image && image.unescapedUrl) {
            var url = image.unescapedUrl;
            if (!/(.gif|.jpe?g|.png)$/i.test(url)) {
              url =  + '#.png';
            }
            next(url);
          }
        }
      }
    }
  });
}
