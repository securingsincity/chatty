var _ = require('lodash');
var crypto = require('crypto');
var request = require('request');

module.exports = function (commander, logger) {

    var postTemplate = _.template("<%= title %> <%= url %>");
    var allowNSFW = false;

    var matchers = {
        "^r\\/(top|hot|rising|controversial)?\\/?(hour|day|week|month|year|all)?$": postFromAll,
        "^r\\/([\\w\\-]+)\\/?(top|hot|rising|controversial)?\\/?(hour|day|week|month|year|all)?$": postsFromSubReddit,
        "^r\\/(hipchattest)?$": hipchatTest
    };

    commander.script({
        help: 'Call up all sorts of reddit schenanigans'
    });

    commander.spy({
        hear: /^r\/(.*?)$/,
        help: 'Does reddity stuff',
        action: onRedditMessage
    });

    function expireArticle(event, key) {
        if (noRepeats == true) {
            var hash = crypto.createHash('md5').update(key).digest('hex');
            event.store.set("r/"+key);
        }
    }

    function isFreshArticle(event, key) {
        if (noRepeats == false) {
            var hash = crypto.createHash('md5').update(key).digest('hex');
            event.store.get("r/"+key).then(function (value) {
                if (value) {
                    return false;
                }
            });
        }
        return true;
    }

    function onRedditMessage(event, response) {
        _.each(_.pairs(matchers), function(pair) {
            var reg = new RegExp(pair[0]);
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
        doRedditRequest(params, renderPosts(1, callback));
    }

    function postsFromSubReddit(matches, event, callback) {
        var params = getParamsForMatches(matches);
        doRedditRequest(params, renderPosts(1, callback));
    }

    function hipchatTest(match, event, response) {
        var msg = 'john <strong>test</strong>';
        response.send(msg);
        response.send('https://s3.amazonaws.com/uploads.hipchat.com/10804/132391/qOJSVtvBWOLoorv/java.jpg');
 //       response.random([ 'https://s3.amazonaws.com/uploads.hipchat.com/10804/132391/qOJSVtvBWOLoorv/java.jpg' ]);
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

                var i = 0;
                var j = 0;
                while (count > 1 && j < count && i < posts.length) {
                    if (isFreshArticle(posts[i].data)) {
                        html.push(postTemplate(posts[i].data));
                        expireArticle(posts[i].data)
                        j++;
                    }
                    i++;
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

        if (matches.length >= 1 && matches[1] != undefined) {
            params.sort = matches[1];
        }

        if (matches.length >= 2 && matches[2] != undefined) {
            params.duration = matches[2];
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
