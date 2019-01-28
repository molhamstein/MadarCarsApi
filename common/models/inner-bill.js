'use strict';

module.exports = function (Innerbill) {
  Innerbill.validatesInclusionOf('status', { in: ['notBilled', 'billed']
  })
  /**
   *
   * @param {string} tripId
   * @param {Function(Error, object)} callback
   */

  Innerbill.getinnerBill = function (tripId, callback) {
    var result;
    // TODO
    Innerbill.findOne({
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
