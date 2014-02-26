var _ = require('lodash');
var later = require('later');
var RSVP = require('rsvp');
var cliff = require('cliff');
var crypto = require('crypto');

module.exports = function (commander, logger) {

  commander.script({
    help: 'A command for executing other commands on schedule',
    start: start,
    stop: stop
  });

  commander.command({
    name: 'later',
    args: '[help]',
    help: 'Runs a command according to a schedule',
    action: function (event, response) {
      var match;
      if (!event.input || /^help\b/i.test(event.input)) {
        return response.help('later', [
          '<laterjs-text-expr> /<command> [args]',
          'cancel <id>',
          'show'
        ]);
      } else if (match = /^show\s*$/i.exec(event.input)) {
        show(event, response);
      } else if (match = /^cancel\s+([\da-f]+)$/i.exec(event.input)) {
        cancel(event, response, match[1].trim());
      } else if (match = /^([^\/]+)(\/[\w-]+(?:.*))/i.exec(event.input)) {
        var command = match[2].trim();
        if (command.indexOf('later') === 1) {
          return response.send('Um, no.', {color: 'red'});
        }
        add(event, response, match[1].trim(), command);
      } else {
        response.confused();
      }
    }
  });

  var jobs = {};

  function startJob(tenant, response, job) {
    return new RSVP.Promise(function (resolve, reject) {
      try {
        var schedule = later.parse.text(job.spec);
        if (schedule.error === -1) {
          job.handle = later.setInterval(function () {
            commander.execute(job.command, tenant, job.from, response.send);
          }, schedule);
          resolve(job.handle);
        } else {
          var err = new Error('Invalid schedule: "' + job.spec + '"');
          err.column = schedule.error;
          reject(err);
        }
      } catch (e) {
        reject(e);
      }
    });
  }

  function stopJob(tenant, response, id) {
    return new RSVP.Promise(function (resolve, reject) {
      var job = jobs[id];
      if (job && job.handle) {
        job.handle.clear();
        delete jobs[id];
        resolve();
      } else {
        reject();
      }
    });
  }

  function add(event, response, spec, command) {
    var seed = new Date() + '|' + spec + '|' + command;
    var id = crypto.createHash('sha1').update(seed).digest('hex').slice(0, 8);
    var job = {
      id: id,
      spec: spec,
      command: command,
      from: event.from
    };
    function fail(err) {
      if (err.column) {
        response.send('Sorry, I didn\'t understand the schedule "' + spec + '"; error at character ' + err.column);
      } else {
        logger.error(err);
        response.confused();
      }
    }
    startJob(event.tenant, response, job).then(function () {
      return event.store.set('job-' + job.id, job).then(function () {
        jobs[job.id] = job;
        response.send('Ok, I scheduled that command');
      }, fail);
    }, fail);
  }

  function cancel(event, response, id) {
    function fail(err) {
      response.confused();
    }
    if (jobs[id]) {
      return stopJob(event.tenant, response, id).then(function () {
        return event.store.del('job-' + id).then(function () {
          response.send('Ok, I canceled that command');
        }, fail);
      }, fail);
    }
    return RSVP.all([]);
  }

  function show(event, response) {
    var rows = _.values(jobs).map(function (job) {
      return [job.id, ' ', job.spec, ' ', job.command];
    }).sort(function (a, b) {
      return a[0] < b[0] ? -1 : (a[0] > b[0] ? 1 : 0);
    });
    var msg;
    if (rows.length > 0) {
      rows.unshift(['ID', ' ', 'Schedule', ' ', 'Command']);
      msg = '<pre><b>Scheduled Jobs</b>\n' + cliff.stringifyRows(rows) + '</pre>';
    } else {
      msg = 'I don\'t have any jobs scheduled right now';
    }
    response.send(msg, {format: 'html'});
  }

  function start(tenant, store, response) {
    commander.work(function () {
      store.all().then(function (all) {
        _.each(all, function (job) {
          startJob(tenant, response, job).then(function () {
            jobs[job.id] = job;
          });
        });
      });
    });
  }

  function stop(tenant, store, response) {
    commander.work(function () {
      store.all().then(function (all) {
        _.each(all, function (job) {
          stopJob(tenant, response, job.id);
        });
      });
    });
  }

};
