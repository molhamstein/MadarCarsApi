'use strict';

const ejs = require('ejs');
const path = require('path');

const configPath = process.env.NODE_ENV === undefined ?
  '../../server/config.json' :
  `../../server/config.${process.env.NODE_ENV}.json`;
const config = require(configPath);

module.exports = function (Adminnotification) {
  /**
   *
   * @param {Function(Error, number)} callback
   */

  Adminnotification.validatesInclusionOf('type', {
    in: ['help']
  });

  function userNeedHelp(user) {

    Adminnotification.app.models.admin.find({
      "where": {
        "isSuperAdmin": true
      }
    }, function (err, admins) {
      if (err) {
        console.log(err);
        return
      } else {
        admins.forEach(element => {
          console.log(element.email)
          let url = `${config.domain}` + '/portal/#/edit-user/' + user.id;
          ejs.renderFile(path.resolve(__dirname + "../../../server/views/user-need-help-template.ejs"), {
            url: url
          }, function (err, html) {
            if (err) return console.log('> error sending password reset email', err);
            console.log(html);
            Adminnotification.app.models.Email.send({
              to: element.email,
              from: 'jawlatcom.info@gmail.com',
              subject: 'User need help',
              html: html
            }, function (err) {
              if (err) return console.log('> error sending password reset email', err);
            });
          });
        });
      }
    })

  }


  Adminnotification.needHelp = function (context, callback) {
    var code = 200;
    Adminnotification.create({
      "userId": context.req.accessToken.userId,
      "type": "help"
    }, function (err, data) {
      if (err)
        return callback(err)
      Adminnotification.app.models.user.findById(context.req.accessToken.userId, function (err, user) {
        if (err) {
          console.log(err)
          return callback(null, code)
        }
        userNeedHelp(user)
        return callback(null, code)
      })
    })
  };
};
