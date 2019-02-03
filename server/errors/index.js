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