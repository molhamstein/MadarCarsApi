'use strict';
const errors = require('../../server/errors');

module.exports = function (Coupon) {

  Coupon.validatesInclusionOf('status', {
    in: ['active', 'used', 'deactive']
  });

  Coupon.validatesInclusionOf('type', {
    in: ['fixed', 'percentage']
  });


  Coupon.beforeRemote('create', function (context, result, next) {
    console.log(context.req.body.code)
    Coupon.find({
      "where": {
        "code": context.req.body.code
      }
    }, function (err, data) {
      if (err)
        return next(err)
      if (data.length > 0)
        return next(errors.coupon.couponIsUsed());
      next()
    })
  })

  /**
   *
   * @param {string} id
   * @param {Function(Error, object)} callback
   */

  Coupon.checkCoupon = function (code, callback) {
    var filter = {
      "where": {
        "status": "active",
        "code": code,
        "from": {
          lt: new Date()
        },
        "to": {
          gt: new Date()
        }
      }
    }
    Coupon.find(filter, function (err, data) {
      if (err)
        return callback(null, result);
      if (data.length == 0)
        return callback(errors.coupon.couponIsNotValid());
      callback(null, data[0]);

    })
  };

};
