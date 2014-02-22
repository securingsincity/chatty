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
    function(req, res) {
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
  addon.on('installed', function(clientKey, clientInfo, req){
    hipchat.sendMessage(clientInfo, req.body.roomId, 'The ' + addon.descriptor.name + ' add-on has been installed in this room');
  });

  // Clean up clients when uninstalled
  addon.on('uninstalled', function(id){
    addon.settings.client.keys(id + ':*', function(err, rep){
      rep.forEach(function(k){
        addon.logger.info('Removing key:', k);
        addon.settings.client.del(k);
      });
    });
  });

};
