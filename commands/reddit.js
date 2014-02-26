var _ = require('lodash');
var request = require('request');
var util = require('util');

module.exports = function (commander, logger) {

    var postTemplate = _.template("<%= title %> <%= url %>");

    var watchMatcher = /^watch\sr\/([\w\-]+)\/?(top|hot|controversial)?\/?(hour|day|week|month|year|all)?\s?([0-9]*)$/;

    var matchers = {
        "(new|rising)$": postFromAll,
        "(top|hot|controversial)?\\/?(hour|day|week|month|year|all)?$": postFromAll,
        "([\\w\\-]+)\\/?(new|rising)?$": postsFromSubReddit,
        "([\\w\\-]+)\\/(top|hot|controversial)?\\/?(hour|day|week|month|year|all)?$": postsFromSubReddit
    };

    commander.script({
        help: 'Call up all sorts of reddit shenanigans',
        variables: {
            nsfwEnabled: {name: 'Enable adult themed (NSFW) content? (Yes/No)', value: "No"}
        }
    });

    commander.spy({
        hear: /^r\/(.*?)$/,
        help: 'Displays the top post from reddit r/[subreddit][/filter][/duration] i.e. r/gifs/top/month',
        action: onSpyMessage
    });

    commander.command({
        name: "r",
        args: "",
        help: "Displays the top post from reddit /r/[subreddit][/filter][/duration] i.e. /r/gifs/top/month",
        action: onCommandMessage
    });

    function onCommandMessage(event, response) {

        var match;
        if (match = watchMatcher.exec(event.input)) {
            var matches = match.slice(1);
            postsFromSubReddit(matches, event, function(content) {
                response.send(content);
            })
        } else {
            _.each(_.pairs(matchers), function(pair) {
                var reg = new RegExp("^" + pair[0]);
                var callback = pair[1];
                var match = reg.exec(event.input);
                if (match) {
                    if (!event.isPrevented) {
                        var matches = match.slice(1);
                        callback(matches, event, function(content) {
                            response.send(content);
                        });
                    }
                }
            });
        }
    }

    function onSpyMessage(event, response) {
        _.each(_.pairs(matchers), function(pair) {
            var reg = new RegExp("^r\\/" + pair[0]);
            var callback = pair[1];
            var match = reg.exec(event.message);
            if (match) {
                if (!event.isPrevented) {
                    var matches = match.slice(1);
                    callback(matches, event, function(content) {
                        response.send(content);
                    });
                }
            }
        });
    }

    function postFromAll(matches, event, callback) {
        event.isPrevented = true;
        matches.unshift("all");
        var params = getParamsForMatches(matches);
        doRedditRequest(params, renderPosts(params, event, 1, callback));
    }

    function postsFromSubReddit(matches, event, callback) {
        var params = getParamsForMatches(matches);
        doRedditRequest(params, renderPosts(params, event, 1, callback));
    }

    function renderPosts(params, event, count, callback) {
        return function(err, posts) {
            if (err) return logger.error(err.stack || err);
            if (posts.length) {

                var html = [];

                if (event.variables.nsfwEnabled.toLowerCase() !== "yes") {
                    posts = _.filter(posts, function (post) {
                        return !post.data.over_18;
                    });
                }

                posts = _.filter(posts, function(post) {
                    return !post.data.stickied;
                });

                if (params.minUpvote) {
                    posts = _.filter(posts, function(post) {
                        return post.data.ups >= params.minUpvote;
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

    function getParamsForMatches(matches) {
        var params = {
            sub: "all"
        };

        if (matches[0] != undefined) {
            params.sub = matches[0];
        }

        if (matches[1] != undefined) {
            params.sort = matches[1];
        }

        if (matches[2] != undefined) {
            params.duration = matches[2];
        }

        if (matches[3] != undefined) {
            params.minUpvote = parseInt(matches[3]);
        }

        return params;
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

        if (params.duration) {
            url += "?t=" + params.duration;
        }

        return url;
    }
};
