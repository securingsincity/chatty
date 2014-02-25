var _ = require('lodash');
var redwrap = require('redwrap');

module.exports = function (commander, logger) {

    commander.script({
        help: 'Call up all sorts of reddit schenanigans'
    });

    commander.spy({
        hear: /^r\/([\w\-]+)/,
        help: 'Lists the top post from a subreddit',
        action: getTopPostFromSubreddit
    });

    var postFormat = _.template("<%= url %><br><b><%= title %></b>")

    function getTopPostFromSubreddit(event, response) {
        var sub = event.captures[0];
        redwrap.r(sub, function(err, data, resp) {
            if (err) return logger.error(err.stack || err);
            if (data.data.length) {
                var firstPost = data.data[0];
                response.send(postFormat(firstPost));
            } else {
                response.send("No posts in this subreddit. (sadpanda)");
            }
        });
    }
};