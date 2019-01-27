'use strict';

module.exports = function (Usernotification) {
  Usernotification.validatesInclusionOf('type', { in: ['rate']
  });

};
