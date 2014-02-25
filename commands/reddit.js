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

    var postFormat = _.template("<b><%= title %></b> <%= url %>")

    function getTopPostFromSubreddit(event, response) {
        var sub = event.captures[0];
        redwrap.r(sub, function(err, data, resp) {
            if (err) return logger.error(err.stack || err);
            var posts = (data.data && data.data.children && data.data.children.length) ? data.data.children : [];
            if (posts.length) {
                response.send(postFormat(posts[0].data));
            } else {
                response.send("No posts in this subreddit. (sadpanda)");
            }
        });
    }
};