var request = require('request');

exports.popular = function (next) {
  request.get({
    url: 'http://version1.api.memegenerator.net/Instances_Select_ByPopular',
    qs: {pageSize: 10}
  }, function (err, res, body) {
    if (err) return console.error(err.stack || err);
    if (body) {
      var data = JSON.parse(body);
      if (data && data.success && data.result.length > 0) {
        next(data.result[Math.floor(Math.random() * data.result.length)].instanceImageUrl);
      }
    }
  });
}
