var _ = require('lodash');
var request = require('request');

module.exports = function (commander, logger) {

    var postTemplate = _.template("<b><%= title %></b> <%= url %>");
    var allowNSFW = false;

    var matchers = {
        "^r\\/(top|hot|rising|controversial)?$": postFromAll,
        "^r\\/([\\w\\-]+)\\/?(top|hot|rising|controversial)?$": postsFromSubReddit
    };

    commander.script({
        help: 'Call up all sorts of reddit schenanigans'
    });

    commander.spy({
        hear: /^r\/(.*?)$/,
        help: 'Does reddity stuff',
        action: doPost
    });

    function doPost(event, response) {
        _.each(_.pairs(matchers), function(pair) {
            console.log(pair)
            var reg = new RegExp(pair[0]);
            var callback = pair[1];
            var match = reg.exec(event.input);
            console.log({input: event.input, reg: reg, match: match});
            if (match) {
                if (!event.isPrevented) {
                    callback(match.slice(1), event, response);
                }
            }
        });
    }

    function postFromAll(match, event, response) {
        event.isPrevented = true;
        doRedditRequest({
            sub: "all",
            sort: match.length ? match[0] : ""
        }, renderPosts(1, function(content) {
            response.send(content);
        }));
    }

    function postsFromSubReddit(match, event, response) {
        var sub = (match.length) ? match[0] : "all";
        var sort = (match.length > 1) ? match[1] : "";
        doRedditRequest({
            sub: sub,
            sort: sort
        }, renderPosts(1, function(content) {
            response.send(content);
        }));
    }

    function renderPosts(count, callback) {
        return function(err, posts) {
            if (err) return logger.error(err.stack || err);
            if (posts.length) {

                var html = [];

                if (!allowNSFW) {
                    posts = _.filter(posts, function(post) {
                        return !post.data.over_18;
                    });
                }

                for (var i = 0; i < count; i++) {
                    if (i < posts.length) {
                        html.push(postTemplate(posts[i].data))
                    }
                }

                callback(html.join("<hr>"));
            } else {
                callback("No posts in this subreddit. (sadpanda)");
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