'use strict';
var _ = require('lodash');

module.exports = function(Outerinvoice) {
  /**
   *
   * @param {string} tripId
   * @param {array} invoices
   * @param {Function(Error, object)} callback
   */

  Outerinvoice.add = function (tripId, invoices, callback) {
    Outerinvoice.find({
      "where": {
        "tripId": tripId
      }
    }, function (err, data) {
      if (err)
        return callback(err);
      if (data[0] == null) {
        Outerinvoice.create({
          "tripId": tripId
        }, function (err, data) {
          if (err)
            return callback(err);
          _.each(invoices, oneInvoice => {
            oneInvoice.outerId = data.id;
            console.log(invoices)
            Outerinvoice.app.models.invoice.create(invoices, function (err,invoiceData) {
              if (err)
                return callback(err);
              return callback(null, data)
            })
          })
        })
      } else {
        _.each(invoices, oneInvoice => {
          oneInvoice.outerId = data[0].id;
          console.log(invoices)
          Outerinvoice.app.models.invoice.create(invoices, function (err, invoiceData) {
            if (err)
              return callback(err);
            return callback(null, data[0])
          })
        })
      }
    })

  };


};
