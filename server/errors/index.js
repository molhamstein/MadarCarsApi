const cError = require('./cError');
var g = require('strong-globalize')();

module.exports.global = {

  notFound: function () {
    return new cError(452, 'object not found', 452);
  },
  alreadyDeactive: function () {
    return new cError(453, 'object already deactive', 453);
  },
  alreadyActive: function () {
    return new cError(454, 'object already active', 454);
  }
};



module.exports.user = {

  notCompleatedSNLogin: function () {
    return new cError(450, 'not compleated sn login', 450);
  },
  userNotFound: function () {
    return new cError(459, 'user not found', 459);
  },
  phoneNumberOrUsernameIsUsed: function () {
    return new cError(451, 'phonenumber or username is used', 451);
  },
  codeNotFound: function () {
    return new cError(460, 'code not found', 460);
  }
};


module.exports.location = {

  locationNotFound: function () {
    return new cError(455, 'location not found', 455);
  }
};

module.exports.trip = {

  tripNotFound: function () {
    return new cError(458, 'trip not found', 458);
  },
  paymentInfo: function (details) {
    return new cError(463, 'payment info is wrong', 463, details);
  },
  cardNumberIsInvalid: function (details) {
    return new cError(464, 'card number is invalid', 464, details);
  },

  expireDateIsInvalid: function (details) {
    return new cError(465, 'expire date is invalid', 465, details);
  },
  cvcIsInvalid: function (details) {
    return new cError(466, 'cvc is invalid', 466, details);
  },
  domesticCards: function (details) {
    return new cError(467, 'domestic cards', 467, details);
  },
  priceInformation: function (details) {
    return new cError(468, 'price information', 468, details);
  }





};


module.exports.coupon = {

  couponIsUsed: function () {
    return new cError(461, 'coupon is used', 461);
  },
  couponIsNotValid: function () {
    return new cError(462, 'coupon is not valid', 462);
  }

};

module.exports.car = {

  carNotFound: function () {
    return new cError(456, 'car not found', 456);
  },
  carNotAvailable: function () {
    return new cError(457, 'car not available', 457);
  }

};
