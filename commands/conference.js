var request = require('request');
var phone = require('phone');

module.exports = function (commander, logger) {
  var defaultVoiceChatApiUrl = 'http://voicechatapi.com';
  var baseVoiceChatApiPath = '/api/v1/conference/';
  var currentConferenceName;
  var currentConferenceUrl;
  var currentConferenceCreateDate;

  commander.script({
    help: 'Commands for creating and managing voice conference calls',
    variables: {
      voiceChatApiUrl: {name: 'Voice Chat API URL', value: defaultVoiceChatApiUrl}
    }
  });

  commander.command({
    name: 'conference',
    args: '[help]|[start]|[call in <phonenumber>]',
    opts: {format: 'html'},
    help: 'Create and manage voice conference calls',
    action: function (event, response) {
      var match;
      if (match = /^help\b/i.exec(event.input)) {
        response.help('conference', [
          'start',
          'call in <phonenumber>',
        ]);
      } else if (match = /^start\b$/i.exec(event.input)) {
        start(event, response);
      } else if (match = /^call in\s+([\+0-9-\(\)\s]+)$/i.exec(event.input)) {
        callIn(event, response, match[1]);
      } else if (currentConferenceUrl && currentConferenceCreateDate && (new Date().getTime() - currentConferenceCreateDate) < 24*60*60*1000) {
        response.send('Current conference call: <a href="'+currentConferenceUrl+'">'+currentConferenceUrl+'</a>.<br/>Start a new conference call with "/conference start"');
      } else {
        if (currentConferenceUrl) {
            // Conference timed out
            currentConferenceUrl = null;
            currentConferenceName = null;
            currentConferenceCreateDate = null;
        }
        response.send('No conference call is active.<br/>Start a conference call with "/conference start"');
      }
    }
  });

  function start(event, response) {
    request.post(event.variables.voiceChatApiUrl+baseVoiceChatApiPath, function (err, res, body) {
      if (err) {
        response.send('Sorry, couldn\'t create a conference call. Try again later.');
        return;
      }

      var json = JSON.parse(body);
      if (json && json.conference_url) {
        currentConferenceName = json.conference_name;
        currentConferenceUrl = json.conference_url;
        currentConferenceCreateDate = new Date().getTime();
        response.send('New conference call created: <a href="'+currentConferenceUrl+'">'+currentConferenceUrl+'</a>');
      } else {
        response.send('Sorry, couldn\'t create a conference call. Try again later.');
      }
    });
  };

  function callIn(event, response, phoneNumber) {
    if (!currentConferenceName) {
        response.send('No conference call is active.<br/>Start a conference call with "/conference start"');
      } else if (event.variables.voiceChatApiUrl === defaultVoiceChatApiUrl) {
        response.send("Sorry, you can't call in regular phone numbers with the default voice chat api. Configure a custom voice chat api url to enable this feature.");
      } else {
        var formattedPhone = phone(phoneNumber);
        if (!formattedPhone) {
          response.send('Sorry, couldn\'t call in '+phoneNumber+', because that phone number doesn\'t appear to be valid.');
        } else {
          request.post({
            url: event.variables.voiceChatApiUrl+baseVoiceChatApiPath+currentConferenceName+'/',
            form: {to: formattedPhone}
          }, function (err, res, body) {
            var json = JSON.parse(body);
            console.log(json);
            if (json && json.success === true) {
              response.send(json.message);
            } else {
              response.send('Sorry, couldn\'t call in '+phoneNumber+'. '+json.message);
            }
          });
        }
      }
  };

}