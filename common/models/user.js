'use strict';
var g = require('strong-globalize')();
var debug = require('debug')('loopback:user');
const errors = require('../../server/errors');
const accountSid = 'AC6df6d08ede1a1f034d74c7ab40f53f96';
const authToken = '12d6af0846ccee6eb0869aae00527289';
var twilio = require('twilio');
var client = new twilio(accountSid, authToken);

module.exports = function (User) {


  User.validatesInclusionOf('status', { in: ['active', 'deactive', 'pending']
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
    var name = data.name;
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
            }]
          }
        }, function (err, userByPhoneNumber) {
          if (userByPhoneNumber) {
            return callback(errors.user.phoneNumberOrUsernameIsUsed());
          }
          User.create({
            socialId: socialId,
            status: "active",
            name: name,
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

  User.beforeRemote('create', function (context, result, next) {
    User.find({
      "where": {
        "phoneNumber": context.req.body.phoneNumber
      }
    }, function (err, users) {
      if (err)
        return next(err)
      if (users.length != 0)
        return next(errors.user.phoneNumberOrUsernameIsUsed());

      if (context.req.body.url != undefined) {
        User.app.models.Media.create({
          "thumb": context.req.body.url,
          "url": context.req.body.url
        }, function (err, media) {
          if (err)
            return next(err)
          context.req.body.mediaId = media.id;
          // sendSMS(context.req.body.phoneNumber, function () {})
          next();

        })
      } else {
        // sendSMS(context.req.body.phoneNumber, function () {})
        if (context.req.body.mediaId == undefined)
          context.req.body.mediaId = "5c51a99cfa7f1b54df4e285b"
        next();

      }
    })
  })

  User.afterRemote('create', function (ctx, result, next) {
    // sendSMS(ctx.req.body.phoneNumber, function () {})
    next()
  })


  /**
   *
   * @param {string} from
   * @param {string} to
   * @param {Function(Error)} callback
   */

  User.sendMsg = function (from, to, callback) {
    sendSMS(from, to, function () {})
    callback(null);
  };

  function sendSMS(from, to, callback) {
    // client.messages.create({
    //     body: 'Hello from Node',
    //     to: to, // +1 720 636 9085 Text this number
    //     from: from // from: '+963 957 465 876' // From a valid Twilio number
    //   })
    //   .then((message) => console.log(message.sid))
    //   .catch(function (reason) {
    //     // rejection
    //     console.log(reason)
    //   });
    // callback();
    // var sinchAuth = require('sinch-auth');
    // var sinchSms = require('sinch-messaging');
    // var auth = sinchAuth("fba316e8-69a8-4c11-ae17-b18ad1e16234", "ivqHSHS/fEOEOnPcJVPPNg==");
    // sinchSms.sendMessage("+963933074900", "Hello world!");
  // sinchMessaging.sendMessage = function (phoneNumber, message) {
	// var auth = sinchAuth();
  //   var options = {
  //       method: 'POST',
  //       url : "https://messagingApi.sinch.com/v1/sms/" + phoneNumber,
  //       headers : {
  //           "Content-Type" : "application/json",
  //           "Authorization" : auth
  //       },
  //       body: "{"Message":"" + message + ""}"
  //   };
  }


  /**
   *
   * @param {string} deviceId
   * @param {Function(Error, number)} callback
   */

  User.logOut = function (deviceId, context, callback) {
    var code = 200;
    var userId = context.req.accessToken.userId
    User.findById(userId, function (err, user) {
      if (err)
        return callback(err, null);
      User.app.models.Firbasetoken.destroyAll({
        "deviceId": deviceId,
        "userId": userId
      }, function (err, data) {
        if (err)
          return callback(err, null);
        user.logOut();
        callback(null, code);
      })
      // return callback(null, user)
    })

    // TODO
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

  /**
   *
   * @param {number} limit
   * @param {Function(Error, array)} callback
   */

  User.getEnd = function (limit, callback) {
    User.count({}, function (err, count) {
      console.log(count);
      var skip = 0
      if (limit < count) {
        var mod = count % limit;
        var div = parseInt(count / limit);
        console.log("mod");
        console.log(count / limit);
        if (mod == 0)
          skip = count - limit
        else
          skip = (div * limit);
      }

      User.find({
        "skip": skip,
        "limit": limit
      }, function (err, data) {
        callback(null, {
          "data": data,
          "count": count
        })
      })

    })
  };

  /**
   *
   * @param {object} data
   * @param {Function(Error, number)} callback
   */

  User.resetPassword = function (userId, newPassword, callback) {
    var code = 200;
    User.findById(userId, function (err, userData) {
      if (err)
        return callback(err, null)
      if (userData == null)
        return callback(errors.user.userNotFound());
      userData.updateAttributes({
        'password': User.hashPassword(newPassword),
      }, function (err) {
        if (err) {
          return callback(err, null)
        }
        return callback(null, code)
      })
    })
  };


  User.setFirebaseToken = function (token, req, callback) {
    var code = 200;

    console.log("req.accessToken.userId");
    console.log(req.accessToken.userId);
    console.log("token")
    console.log(token)
    User.findById(req.accessToken.userId, function (err, user) {
      user.fireBaseToken = token;
      user.save()
      callback(null, code);
    })
  };

};
