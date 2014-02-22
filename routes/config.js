var _ = require('lodash');

module.exports = function(app, addon, commander) {

  // Config page
  app.get('/config',
    addon.authenticate(),
    function (req, res) {
      res.render('config', _.extend({
        styles: [
          '/css/config.css'
        ],
        scripts: [
          '/js/config.js'
        ]
      }, req.context));
    }
  );

  app.get(
    '/script',
    addon.authenticate(),
    function (req, res) {
      function done(features) {
        res.json(features);
      }
      function fail(err) {
        res.json(500, {error: err.stack || err});
      }
      commander.getScripts(req.clientInfo).then(done, fail);
    }
  );

  app.put(
    '/script/:name',
    addon.authenticate(),
    function (req, res) {
      function done() {
        res.send(204);
      }
      function fail(err) {
        res.json(500, {error: err.stack || err});
      }
      commander.updateScript(req.clientInfo, req.param('name'), req.body).then(done, fail);
    }
  );

};
