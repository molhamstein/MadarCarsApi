'use strict';
var _ = require('lodash');

module.exports = function (Innerinvoice) {
  /**
   *
   * @param {string} tripId
   * @param {array} invoices
   * @param {Function(Error, object)} callback
   */

  Innerinvoice.add = function (tripId, invoices, callback) {
    Innerinvoice.find({
      "where": {
        "tripId": tripId
      }
    }, function (err, data) {
      if (err)
        return callback(err);
      if (data[0] == null) {
        Innerinvoice.create({
          "tripId": tripId
        }, function (err, data) {
          if (err)
            return callback(err);
          _.each(invoices, oneInvoice => {
            oneInvoice.innerId = data.id;
            console.log(invoices)
            Innerinvoice.app.models.invoice.create(invoices, function (err,invoiceData) {
              if (err)
                return callback(err);
              return callback(null, data)
            })
          })
        })
      } else {
        _.each(invoices, oneInvoice => {
          oneInvoice.innerId = data[0].id;
          console.log(invoices)
          Innerinvoice.app.models.invoice.create(invoices, function (err, invoiceData) {
            if (err)
              return callback(err);
            return callback(null, data[0])
          })
        })
      }
    })

  };


};
