var _ = require('lodash');
var pjson = require('../package.json');

module.exports = function(app, addon, commander) {

  app.get('/help',
    function (req, res) {
      commander.help({escapeHtml: true}).then(function (help) {
        res.render('help', _.extend({
          fonts: [
            'https://fonts.googleapis.com/css?family=Russo+One'
          ],
          styles: [
            '/css/help.css'
          ],
          scripts: [
          ],
          title: 'Chatty',
          help: help,
          version: pjson.version
        }, req.context));
      });
    }
  );

};
