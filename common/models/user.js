'use strict';
var g = require('strong-globalize')();
var debug = require('debug')('loopback:user');
const errors = require('../../server/errors');

module.exports = function (User) {


  User.validatesInclusionOf('status', { in: ['active', 'deactive','pending']
  });


  
  User.login = function (credentials, include, fn) {
    var self = this;
    if (typeof include === 'function') {
      fn = include;
      include = undefined;
    }

    fn = fn || utils.createPromiseCallback();

    include = (include || '');
    if (Array.isArray(include)) {
      include = include.map(function (val) {
        return val.toLowerCase();
      });
    } else {
      include = include.toLowerCase();
    }


    var query = {
      phoneNumber: credentials.phoneNumber
    }

    if (!query.phoneNumber) {
      var err2 = new Error(g.f('{{phoneNumber}} is required'));
      err2.statusCode = 400;
      err2.code = 'PHONENUMBER_REQUIRED';
      fn(err2);
      return fn.promise;
    }

    self.findOne({
      where: query
    }, function (err, user) {
      console.log(query, err, user);
      var defaultError = new Error(g.f('login failed'));
      defaultError.statusCode = 401;
      defaultError.code = 'LOGIN_FAILED';

      function tokenHandler(err, token) {
        if (err) return fn(err);
        if (Array.isArray(include) ? include.indexOf('user') !== -1 : include === 'user') {
          // NOTE(bajtos) We can't set token.user here:
          //  1. token.user already exists, it's a function injected by
          //     "AccessToken belongsTo User" relation
          //  2. ModelBaseClass.toJSON() ignores own properties, thus
          //     the value won't be included in the HTTP response
          // See also loopback#161 and loopback#162
          token.__data.user = user;
        }
        fn(err, token);
      }

      if (err) {
        debug('An error is reported from User.findOne: %j', err);
        fn(defaultError);
      } else if (user) {
        user.hasPassword(credentials.password, function (err, isMatch) {
          if (err) {
            debug('An error is reported from User.hasPassword: %j', err);
            fn(defaultError);
          } else if (isMatch) {

            if (user.createAccessToken.length === 2) {
              user.createAccessToken(credentials.ttl, tokenHandler);
            } else {
              user.createAccessToken(credentials.ttl, credentials, tokenHandler);
            }

          } else {
            debug('The password is invalid for user %s', query.email || query.username);
            fn(defaultError);
          }
        });
      } else {
        debug('No matching record is found for user %s', query.email || query.username);
        fn(defaultError);
      }
    });
    return fn.promise;
  }

  /**
   *
   * @param {Function(Error, object)} callback
   */

  User.facebookLogin = function (req, callback) {
    var result;
    var data = req.body;
    snLogin(data, 'facebook', function (err, user) {
      if (err)
        return callback(err, null);
      callback(err, user);
    })
  };

  /**
   *
   * @param {object} req
   * @param {Function(Error, object)} callback
   */

  User.googleLogin = function (req, callback) {
    var result;
    var data = req.body;
    snLogin(data, 'google', function (err, user) {
      if (err)
        return callback(err, null);
      callback(err, user);
    })
  };

  var snLogin = function (data, type, callback) {
    var socialId = data.socialId;
    var token = data.token;
    var username = data.username;
    var phoneNumber = data.phoneNumber;
    var ISOCode = data.ISOCode;
    User.findOne({
      where: {
        socialId: socialId,
        typeLogIn: type
      }
    }, function (err, oneUser) {
      if (err)
        return callback(err, null);
      if (oneUser == null && (phoneNumber == null || phoneNumber == undefined)) {
        return callback(errors.user.notCompleatedSNLogin());
      }
      if (oneUser == null) {
        User.findOne({
          where: {
            or: [{
              phoneNumber: phoneNumber
            }, {
              username: username
            }]
          }
        }, function (err, userByPhoneNumber) {
          if (userByPhoneNumber) {
            return callback(errors.user.phoneNumberOrUsernameIsUsed());
          }
          User.create({
            socialId: socialId,
            status: "active",
            username: username,
            phoneNumber: phoneNumber,
            ISOCode: ISOCode,
            password: "123",
            typeLogIn: type
          }, function (err, newUser) {
            if (err)
              return callback(err)
            User.app.models.AccessToken.create({
              ttl: 31536000000,
              userId: newUser.id
            }, function (err, newToken) {
              User.app.models.AccessToken.findOne({
                include: {
                  relation: 'user',
                  scope: {
                    include: {
                      relation: 'country'
                    }
                  }
                },
                where: {
                  userId: newUser.id
                }
              }, function (err, token) {
                if (err)
                  return callback(err, null);
                var result = token;
                return callback(null, result);
              });
            })

          })
        })
      } else {
        User.app.models.AccessToken.findOne({
          include: {
            relation: 'user',
            scope: {
              include: {
                relation: 'country'
              }
            }
          },
          where: {
            userId: oneUser.id
          }
        }, function (err, token) {
          if (err)
            return callback(err, null);
          var result = token;
          if (result == null) {
            User.app.models.AccessToken.create({
              ttl: 31536000000,
              userId: oneUser.id
            }, function (err, newToken) {
              User.app.models.AccessToken.findOne({
                include: {
                  relation: 'user',
                  scope: {
                    include: {
                      relation: 'country'
                    }
                  }
                },
                where: {
                  userId: oneUser.id
                }
              }, function (err, token) {
                if (err)
                  return callback(err, null);
                result = token;
                return callback(null, result);
              })
            })
          } else {
            return callback(null, result);
          }
        })
      }
    })
  };


  /**
   *
   * @param {object} query
   * @param {Function(Error, object)} callback
   */

  User.me = function (context, callback) {
    var result;
    console.log(context.req.accessToken);
    User.findById(context.req.accessToken.userId, function (err, user) {
      if (err)
        return callback(err, null);
      return callback(null, user)
    })
    // TODO
  };


    User.deactivate = function (id, callback) {
    var code = 200;
    // TODO
    User.findById(id, function (err, user) {
      if (err)
        return callback(err, null);
      if (user == null)
        return callback(errors.global.notFound());
      if (user.status == "deactive")
        return callback(errors.global.alreadyDeactive());

      user.status = "deactive"
      user.save()
      return callback(err, code)

    })
  };


  User.activate = function (id, callback) {
    var code = 200;
    // TODO
    User.findById(id, function (err, user) {
      if (err)
        return callback(err, null);
      if (user == null)
        return callback(errors.global.notFound());
      if (user.status == "active")
        return callback(errors.global.alreadyActive());

      user.status = "active"
      user.save()
      return callback(err, code)

    })
  };

};
