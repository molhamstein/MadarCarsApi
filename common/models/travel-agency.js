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

};
