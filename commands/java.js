module.exports = function (commander) {

  commander.on(/java/, function (event, response) {
    response.random([
      'https://s3.amazonaws.com/uploads.hipchat.com/10804/132391/qOJSVtvBWOLoorv/java.jpg'
    ]);
  });

};
