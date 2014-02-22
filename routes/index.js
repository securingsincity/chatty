var http = require('request');
var paths = require('path');
var _ = require('lodash');
var pjson = require('../package.json');

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
