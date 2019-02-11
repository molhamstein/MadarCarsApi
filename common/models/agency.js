'use strict';

module.exports = function(Agency) {
    Agency.resetPassword = function (userId, newPassword, callback) {
        var code = 200;
        Agency.findById(userId, function (err, userData) {
          if (err)
            return callback(err, null)
          if (userData == null)
            return callback(errors.user.userNotFound());
          userData.updateAttributes({
            'password': Agency.hashPassword(newPassword),
          }, function (err) {
            if (err) {
              return callback(err, null)
            }
            return callback(null, code)
          })
        })
      };
    
};
