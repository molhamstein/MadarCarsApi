'use strict';
const configPath = process.env.NODE_ENV === undefined ? '../../server/config.json' : `../../server/config.${process.env.NODE_ENV}.json`;
const config = require(configPath);
const path = require('path');
const ejs = require('ejs');

module.exports = function (Admin) {

  Admin.validatesInclusionOf('status', { in: ['active', 'deactive']
  });


  Admin.afterRemote('create', function (ctx, result, next) {
    Admin.app.models.Role.find({
      "where": {
        "name": "admin"
      }
    }, function (err, roles) {
      if (err)
        return next(err)
      Admin.app.models.RoleMapping.create({
        "principalType": "USER",
        "roleId": roles[0].id,
        "principalId": result.id
      }, function (err, data) {
        if (err)
          return next(err)
        next()
      })
    })
  })

  Admin.on('resetPasswordRequest', function (info) {
    let url = config.domain + `resetPassword?access_token=${info.accessToken.id}&user_id=${info.user.id}`;

    ejs.renderFile(path.resolve(__dirname + "../../../server/views/reset-password-template.ejs"), {
      url: url
    }, function (err, html) {
      if (err) return console.log('> error sending password reset email', err);
      Admin.app.models.Email.send({
        to: info.email,
        from: 'vobbleapp@gmail.com',
        subject: 'Password reset',
        html: html
      }, function (err) {
        if (err) return console.log('> error sending password reset email', err);
      });
    });
  });

  Admin.resetPassword = function (userId, newPassword, callback) {
    var code = 200;
    Admin.findById(userId, function (err, userData) {
      if (err)
        return callback(err, null)
      if (userData == null)
        return callback(errors.user.userNotFound());
        userData.updateAttributes({
        'password': Admin.hashPassword(newPassword),
      }, function (err) {
        if (err) {
          return callback(err, null)
        }
        return callback(null, code)
      })
    })
  };


};
