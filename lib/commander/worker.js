var later = require('later');

function Worker() {
}

Worker.prototype.work = function (task) {
  // TODO: running tasks on the web server/primary web dyno is dumb, but works for now
  var dyno = process.env.DYNO;
  if (!dyno || dyno === 'web.1') {
    task();
  }
};

Worker.prototype.setTimeout = function (spec, task) {
  return this._schedule(spec, task, function (schedule) {
    return later.setTimeout(task, schedule);
  });
};

Worker.prototype.setInterval = function (spec, task) {
  return this._schedule(spec, task, function (schedule) {
    return later.setInterval(task, schedule);
  });
};

Worker.prototype._schedule = function (spec, task, executor) {
  var parsed = later.parse.text(spec);
  executor(later.schedule(parsed));
};

exports.create = function () {
  return new Worker();
};
