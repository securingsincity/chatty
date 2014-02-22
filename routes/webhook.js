var _ = require('lodash');

module.exports = function(app, addon, commander) {

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

};
