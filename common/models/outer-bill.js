'use strict';

module.exports = function (Outerbill) {
  Outerbill.validatesInclusionOf('status', { in: ['notBilled', 'billed']
  })
  /**
   *
   * @param {string} tripId
   * @param {Function(Error, object)} callback
   */

  Outerbill.getouterBill = function (tripId, callback) {
    var result;
    // TODO
    Outerbill.app.models.outerBill.findOne({
      "where": {
        "tripId": tripId
      }
    }, function (err, data) {
      if (err)
        return callback(err, null)
      callback(null, data);

    })
  };
};
