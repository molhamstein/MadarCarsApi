'use strict';
const errors = require('../../server/errors');

module.exports = function (Rate) {

  /**
   *
   * @param {string} carId
   * @param {string} value
   * @param {Function(Error, number)} callback
   */

  Rate.makeRate = function (carId, tripId, value, req, callback) {
    var code = 200;
    var ownerId = req.accessToken.userId;
    Rate.app.models.car.findById(carId, function (err, oneCar) {
      if (err)
        return callback(err, null);
      if (oneCar == null)
        return callback(errors.car.carNotFound());
      Rate.create({
        value: value,
        carId: carId,
        ownerId: ownerId,
        tripId: tripId
      }, function (err, data) {
        if (err)
          return callback(err, null);
        if (oneCar.numRateing == 0) {
          oneCar.numRateing = 1;
          oneCar.rate = value;
        } else {
          oneCar.numRateing++;
          oneCar.rate = (oneCar.rate + value) / 2;
        }
        oneCar.save();
        return callback(null, code)
      })
    })
  };

  /**
   *
   * @param {string} carId
   * @param {object} req
   * @param {Function(Error, number)} callback
   */

  Rate.myRate = function (carId, req, callback) {
    var value;
    var ownerId = req.accessToken.userId;
    Rate.find({
      "where": {
        "carId": carId,
        "ownerId": ownerId
      }
    }, function (err, data) {
      if (err)
        return callback(err, null);
      if (data[0] == null)
        return callback(err, 0);
      return callback(err, data[0].value);

    })
  };

};
