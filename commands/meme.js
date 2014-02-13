var request = require('request');
var _ = require('lodash');

module.exports = function (commander) {

  commander.on('meme', function (event, response) {
    request.get({
      url: 'http://version1.api.memegenerator.net/Instances_Select_ByPopular',
      qs: {pageSize: 10}
    }, function (err, res, body) {
      if (err) return console.error(err.stack || err);
      if (body) {
        var data = JSON.parse(body);
        if (data && data.success && data.result.length > 0) {
          var url = data.result[_.random(data.result.length)].instanceImageUrl;
          response.send(url);
        }
      }
    });
  });

};
