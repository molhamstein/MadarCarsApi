'use strict';

module.exports = function (Firbasetoken) {
  Firbasetoken.beforeRemote('create', function (context, result, next) {
    context.req.body.ownerId = context.req.accessToken.userId;
    next();
  })


  Firbasetoken.updateFirebaseToken = function (token, deviceId, req, callback) {
    var code = 200;
    Firbasetoken.find({
      "where": {
        "deviceId": deviceId,
        "userId": req.accessToken.userId
      }
    }, function (err, firbacetoken) {
      if (err)
        return callback(err, null);
      firbacetoken[0].token = token;
      firbacetoken[0].save()
      callback(null, code);
    })
  };

};
