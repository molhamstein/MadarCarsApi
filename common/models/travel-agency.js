'use strict';
const path = require('path');
const ejs = require('ejs');


module.exports = function (Travelagency) {


  Travelagency.validatesInclusionOf('type', {
    in: ['fixed', 'percentage']
  });
  Travelagency.adminResetPassword = function (userId, newPassword, callback) {
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


  Travelagency.on('resetPasswordRequest', function (info) {
    console.log("Reeeeeeeeeset");
    let url = `https://agents.jawlatcom.com/?access_token=${info.accessToken.id}&user_id=${info.user.id}`;

    ejs.renderFile(path.resolve(__dirname + "../../../server/views/reset-password-template.ejs"), {
      url: url
    }, function (err, html) {
      if (err) return console.log('> error sending password reset email', err);
      Travelagency.app.models.Email.send({
        to: info.email,
        from: 'jawlatcom.info@gmail.com',
        subject: 'Password reset',
        html: html
      }, function (err) {
        if (err) return console.log('> error sending password reset email', err);
      });
    });
  });
};
