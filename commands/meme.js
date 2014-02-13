var request = require('request');
var _ = require('lodash');

module.exports = function (commander) {

  commander.command({
    name: 'meme',
    args: '[<query>]',
    help: 'Shows a meme, either randomly or using the query term',
    action: function (event, response) {
      var action = 'Instances_Select_By' + (event.input ? 'Topic' : 'Popular');
      var q = {pageIndex: 0, pageSize: 10};
      if (event.input) {
        q.word = event.input;
        q.languageCode = 'en';
      }
      request.get({
        url: 'http://version1.api.memegenerator.net/' + action,
        qs: q
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
    }
  });

};
