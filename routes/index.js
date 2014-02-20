var http = require('request');
var paths = require('path');

module.exports = function (app, addon) {

  var hipchat = require('../lib/hipchat')(addon);
  var commands = paths.join(__dirname, '..', 'commands');
  var commander = require('../lib/commander')(addon, hipchat, commands);
  var config = require('./config')(app, addon, commander);

  // Root route. This route will serve the `addon.json` unless a homepage URL is
  // specified in `addon.json`.
  app.get('/',
    function(req, res) {
      // Use content-type negotiation to choose the best way to respond
      res.format({
        // If the request content-type is text-html, it will decide which to serve up
        'text/html': function () {
          res.redirect(addon.descriptor.links.homepage);
        },
        // This logic is here to make sure that the `addon.json` is always
        // served up when requested by the host
        'application/xml': function () {
          res.redirect('/atlassian-connect.json');
        }
      });
    }
  );

  app.post('/webhook',
    addon.authenticate(),
    function (req, res) {
      // The commander tries to handle room_message webhooks formatted as slash-commands
      if (commander.handleWebhook(req)) {
        res.send(204);
      } else {
        // Add your own webhook handlers here instead of responding with an error, as needed
        res.send(400);
      }
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
