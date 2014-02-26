var http = require('request');
var paths = require('path');
var _ = require('lodash');

module.exports = function (app, addon) {

  var hipchat = require('../lib/hipchat')(addon);
  var commands = paths.join(__dirname, '..', 'commands');
  var commander = require('../lib/commander')(addon, hipchat, commands);

  require('./help')(app, addon, commander);
  require('./config')(app, addon, commander);
  require('./webhook')(app, addon, commander);

  // Root route. This route will serve the `addon.json` unless a homepage URL is
  // specified in `addon.json`.
  app.get('/',
    function (req, res) {
      // Use content-type negotiation to choose the best way to respond
      res.format({
        // If the request accepts text-html, serve a help page
        'text/html': function () {
          // TODO: Remove the redirect and uncomment the help redirect when HC-3266 is fixed
          res.redirect('/atlassian-connect.json');
          // res.redirect('/help');
        },
        // If the request accepts application/json, serve the add-on descriptor
        'application/json': function () {
          res.redirect('/atlassian-connect.json');
        }
      });
    }
  );

  // Notify the room that the add-on was installed
  addon.on('installed', function (clientKey, clientInfo, req) {
    var data = req.body;
    commander.onInstalled(clientInfo).then(function () {
      addon.logger.info('Tenant installed:', clientInfo);
      hipchat.sendMessage(clientInfo, req.body.roomId, 'The ' + addon.descriptor.name + ' add-on has been installed in this room');
    });
  });

  // Clean up clients when uninstalled
  addon.on('uninstalled', function (clientKey) {
    addon.settings.get(clientKey, function (err, result) {
      if (err) return self.logger.error(err.stack);
      if (result) {
        var clientInfo = JSON.parse(result);
        commander.onUninstalled(clientInfo).then(function () {
          addon.settings.client.keys(clientKey + ':*', function (err, rep) {
            rep.forEach(function (k) {
              addon.settings.client.del(k);
            });
          });
          addon.logger.info('Tenant uninstalled:', clientInfo);
        });
      }
    });
  });

};
