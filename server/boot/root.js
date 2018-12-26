'use strict';

module.exports = function (server) {


  global.ERROR = function (statusCode, message, code) {
    var err = new Error(message);
    err.statusCode = statusCode;
    err.name="test"
    err.code = code || (message.replace(/ /g, '_').toUpperCase());
    // console.log(err)
    
    return err;
  }

  // Install a `/` route that returns server status
  var router = server.loopback.Router();
  router.get('/', server.loopback.status());
  server.use(router);
};
