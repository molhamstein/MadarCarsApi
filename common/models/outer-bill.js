'use strict';

module.exports = function (Outerbill) {
  Outerbill.validatesInclusionOf('status', { in: ['notBilled', 'billed']
  })

};
