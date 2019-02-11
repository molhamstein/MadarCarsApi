'use strict';
const errors = require('../../server/errors');

module.exports = function (Bookingcar) {
  Bookingcar.validatesInclusionOf('type', {
    in: ['trip', 'vacation']
  })
  /**
   *
   * @param {date} start
   * @param {date} end
   * @param {date} carId
   * @param {Function(Error, object)} callback
   */

  Bookingcar.addVacation = function (start, end, carId, callback) {
    var result;
    cheackCar(carId, start, end, function (err) {
      if (err)
        return callback(err)
      Bookingcar.create({
        start: start,
        end: end,
        carId: carId,
        type: "vacation"
      }, function (err, data) {
        if (err)
          return callback(err)
        callback(null, result);
      })
    })
    // TODO
  };


  function cheackCar(carId, start, end, callback) {
    Bookingcar.app.models.car.findById(carId, function (err, oneCar) {
      if (err)
        return callback(err)
      if (oneCar == null || oneCar.status == "deactive")
        return callback(errors.car.carNotFound());
      var mainWher = {}
      mainWher = {
        "where": {
          "and": [{
              "carId": carId
            }, {
              "end": {
                "gt": start
              }
            },
            {
              "start": {
                "lt": end
              }
            }
          ]
        }
      }
      Bookingcar.app.models.bookingCar.find(mainWher, function (err, data) {
        if (err)
          return callback(err)
        if (data[0] != null)
          return callback(errors.car.carNotAvailable())
        callback(null);

      })
    })
  }

};
