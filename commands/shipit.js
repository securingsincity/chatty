module.exports = function (commander, logger) {

  commander.on(/shipit/, function (event, response) {
    // TODO
    logger.info('--- shipit!', event);
  });

};
