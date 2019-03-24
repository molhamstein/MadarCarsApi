'use strict';

module.exports = function (Firbasetoken) {
  Firbasetoken.beforeRemote('create', function (context, result, next) {
    context.req.body.userId = context.req.accessToken.userId;
    return next();
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
      if (firbacetoken[0] != null) {
        firbacetoken[0].token = token;
        firbacetoken[0].save()
        callback(null, code);
      } else {
        Firbasetoken.create({
          "deviceId": deviceId,
          "userId": req.accessToken.userId,
          "token": token
        }, function (err, data) {
          callback(null, code);
        })
      }

    })
  };

};
