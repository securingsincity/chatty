var _ = require('lodash');
var request = require('request');

module.exports = function (commander, logger) {

    var postTemplate = _.template("<b><%= title %></b> <%= url %>");

    commander.script({
        help: 'Call up all sorts of reddit schenanigans'
    });

    commander.spy({
        hear: /^r\/(top|hot|rising|controversial)?$/,
        help: 'Lists the top post from a subreddit',
        action: function(event, response) {
            doRedditRequest({
                sub: "all",
                sort: event.captures.length ? event.captures[0] : ""
            }, renderPosts(response, 1));
        }
    });

    commander.spy({
        hear: /^r\/([\w\-]+)\/?(top|hot|rising|controversial)?$/,
        help: 'Lists the top post from a subreddit',
        action: function(event, response) {
            var sub = (event.captures.length) ? event.captures[0] : "all";
            var sort = (event.captures.length > 1) ? event.captures[1] : "";
            doRedditRequest({
                sub: sub,
                sort: sort
            }, renderPosts(response, 1));
        }
    });

    function renderPosts(response, count) {
        return function(err, posts) {
            if (err) return logger.error(err.stack || err);
            if (posts.length) {

                var html = [];
                for (var i = 0; i < count; i++) {
                    if (i < posts.length) {
                        html.push(postTemplate(posts[i].data))
                    }
                }

                response.send(html.join("<hr>"));
            } else {
                response.send("No posts in this subreddit. (sadpanda)");
            }
        }
    }

    function doRedditRequest(params, callback) {

        request.get({
            url: getRedditUrlForParams(params),
            json: true
        }, function(err, res, json) {
            if (err) {
                return callback(err);
            }

            callback(null, (json.data && json.data.children && json.data.children.length) ? json.data.children : []);
        });
    }

    function getRedditUrlForParams(params) {
        var url = "http://www.reddit.com/";

        if (params.sub) {
            url += "r/" + params.sub;
        }

        if (params.sort) {
            url += "/" + params.sort;
        }

        url += "/.json";

        return url;
    }
};