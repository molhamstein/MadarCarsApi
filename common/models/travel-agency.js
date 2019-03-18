'use strict';

module.exports = function (Travelagency) {

  Travelagency.resetPassword = function (userId, newPassword, callback) {
    var code = 200;
    Travelagency.findById(userId, function (err, userData) {
      if (err)
        return callback(err, null)
      if (userData == null)
        return callback(errors.user.userNotFound());
      userData.updateAttributes({
        'password': Travelagency.hashPassword(newPassword),
      }, function (err) {
        if (err) {
          return callback(err, null)
        }
        return callback(null, code)
      })
    })
  };

  Travelagency.me = function (context, callback) {
    var userId = context.req.accessToken.userId
    Travelagency.findById(userId, function (err, data) {
      if (err)
        return callback(err)
      return callback(err, data)
    })
  };

};
