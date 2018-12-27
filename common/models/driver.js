'use strict';
var g = require('strong-globalize')();
var debug = require('debug')('loopback:user');
var _ = require('lodash');

module.exports = function (Driver) {
  Driver.validatesInclusionOf('status', { in: ['active', 'deactive']
  });

  Driver.validatesInclusionOf('gender', { in: ['male', 'female']
  });

  Driver.login = function (credentials, include, fn) {
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

  Driver.afterRemote('create', function (context, result, next) {
    _.each(context.req.body.languages, oneLang => {
      oneLang.driverId = result.id;
    })
    console.log(context.req.body.languages)
    Driver.app.models.driverLang.create(context.req.body.languages, function (err, data) {
      if (err)
        return next(err);
      next()
    })
  })

  Driver.observe('before save', function (context, next) {
    console.log("before save")
    if (context.where == null)
      next()
    else {
      if (context.data.languages != undefined) {
        var driverId = context.where.id
        Driver.app.models.driverLang.destroyAll({
          "driverId": driverId
        }, function (err, data) {
          if (err)
            return next(err);
          _.each(context.data.languages, oneLang => {
            oneLang.driverId = driverId;
          })
          console.log("languages")
          console.log(context.data.languages)
          Driver.app.models.driverLang.create(context.data.languages, function (err, data) {
            if (err)
              return next(err);
            next()
          })
        })
      } else
        next()
    }

  })


};
