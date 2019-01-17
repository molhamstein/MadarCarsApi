'use strict';
const errors = require('../../server/errors');
const numHoure = 2;
var _ = require('lodash');

const type = ['fromAirport', 'city', 'toAirport', 'fromAirportAndCity', 'fromAirportAndToAirport', 'cityAndToAirport', 'fromAirportAndCityAndToAirport']
module.exports = function (Trip) {
  Trip.validatesInclusionOf('type', { in: ['city', 'fromAirport', 'toAirport', 'cityAndToAirport', 'fromAirportAndCity', 'fromAirportAndToAirport', 'fromAirportAndCityAndToAirport']
  });

  Trip.validatesInclusionOf('status', { in: ['pending', 'approved', 'active', 'deactive', 'finished']
  });

  Trip.beforeRemote('create', function (context, result, next) {
    var data = context.req.body;

    if (context.req.body.ownerId == null)
      context.req.body.ownerId = context.req.accessToken.userId;

    var bookingDate = fillDateOfBooking(data)
    data.type = bookingDate.type;

    cheackLocation(data.locationId, function (err) {
      if (err)
        return next(err)
      cheackCar(data.carId, data.type, bookingDate.where, function (err) {
        if (err)
          return next(err)
        console.log("Done");
        next();

      })
    })
  })
  Trip.afterRemote('create', function (ctx, result, next) {
    var bookingData = prepareCarBooking(result);
    console.log(bookingData);
    Trip.app.models.bookingCar.create(bookingData, function (err, data) {
      if (err)
        return next(err);
      result.tripSublocations
      _.each(ctx.req.body.tripSublocations, oneSublocation => {
        oneSublocation.tripId = result.id;
      })
      console.log(ctx.req.body.tripSublocations)
      Trip.app.models.tripSublocation.create(ctx.req.body.tripSublocations, function (err, data) {
        if (err)
          return next(err);
        next();
      })

    })
  })



  function prepareCarBooking(data) {
    var fromAirportDate = data.fromAirportDate;
    var toAirportDate = data.toAirportDate;
    var startInCityDate = data.startInCityDate;
    var endInCityDate = data.endInCityDate;
    var bookingData = [];
    if (data.type == type[1]) {
      bookingData = [{
        "start": startInCityDate,
        "end": endInCityDate,
        "carId": data.carId,
        "tripId": data.id
      }]
      return bookingData;
    } else if (data.type == type[2]) {
      bookingData = [{
        "start": toAirportDate,
        "end": addHours(numHoure, toAirportDate),
        "carId": data.carId,
        "tripId": data.id
      }]
      return bookingData;
    } else if (data.type == type[5]) {
      bookingData = [{
        "start": startInCityDate,
        "end": addHours(numHoure, toAirportDate),
        "carId": data.carId,
        "tripId": data.id
      }]
      return bookingData;
    } else if (data.type == type[0]) {
      bookingData = [{
        "start": fromAirportDate,
        "end": addHours(numHoure, fromAirportDate),
        "carId": data.carId,
        "tripId": data.id
      }]
      return bookingData;
    } else if (data.type == type[3]) {
      bookingData = [{
        "start": fromAirportDate,
        "end": endInCityDate,
        "carId": data.carId,
        "tripId": data.id
      }]
      return bookingData;
    } else if (data.type == type[4]) {
      bookingData = [{
        "start": fromAirportDate,
        "end": addHours(numHoure, fromAirportDate),
        "carId": data.carId,
        "tripId": data.id
      }, {
        "start": toAirportDate,
        "end": addHours(numHoure, toAirportDate),
        "carId": data.carId,
        "tripId": data.id
      }]
      return bookingData;
    } else if (data.type == type[6]) {
      bookingData = [{
        "start": fromAirportDate,
        "end": addHours(numHoure, toAirportDate),
        "carId": data.carId,
        "tripId": data.id
      }]
      return bookingData;
    }
  }


  function fillDateOfBooking(data) {
    var fromAirport = data.fromAirport;
    var toAirport = data.toAirport;
    var inCity = data.inCity;
    var fromAirportDate = data.fromAirportDate;
    var toAirportDate = data.toAirportDate;
    var startInCityDate = data.startInCityDate;
    var endInCityDate = data.endInCityDate;
    var object = {};
    var whereObject = [];
    if (!fromAirport && !toAirport && inCity) {
      console.log("inCity");
      whereObject[0] = {
        "and": [{
            "end": {
              "gt": startInCityDate
            }
          },
          {
            "start": {
              "lt": endInCityDate
            }
          }
        ]
      }
      object.where = whereObject;
      object.type = type[1];
      return object;
    } else if (!fromAirport && toAirport && !inCity) {
      console.log("toAirport");
      object.firstDateOfBooking = toAirportDate;
      object.secondDateOfBooking = addHours(numHoure, toAirportDate)
      whereObject[0] = {
        "and": [{
            "end": {
              "gt": toAirportDate
            }
          },
          {
            "start": {
              "lt": addHours(numHoure, toAirportDate)
            }
          }
        ],
      }
      object.where = whereObject;
      object.type = type[2];
      return object;
    } else if (!fromAirport && toAirport && inCity) {
      console.log("inCity && toAirport");
      object.firstDateOfBooking = startInCityDate;
      object.secondDateOfBooking = addHours(numHoure, toAirportDate);
      object.type = type[5];
      whereObject[0] = {
        "and": [{
            "end": {
              "gt": startInCityDate
            }
          },
          {
            "start": {
              "lt": addHours(numHoure, toAirportDate)
            }
          }
        ]
      }
      object.where = whereObject;

      return object;
    } else if (fromAirport && !toAirport && !inCity) {
      console.log("fromAirport");
      object.firstDateOfBooking = fromAirportDate;
      object.secondDateOfBooking = addHours(numHoure, fromAirportDate);
      object.type = type[0];
      whereObject[0] = {
        "and": [{
            "end": {
              "gt": fromAirportDate
            }
          },
          {
            "start": {
              "lt": addHours(numHoure, fromAirportDate)
            }
          }
        ]
      }
      object.where = whereObject;

      return object;
    } else if (fromAirport && !toAirport && inCity) {
      console.log("fromAirport && inCity");
      object.firstDateOfBooking = fromAirportDate;
      object.secondDateOfBooking = endInCityDate
      object.type = type[3];
      whereObject[0] = {
        "and": [{
            "end": {
              "gt": fromAirportDate
            }
          },
          {
            "start": {
              "lt": endInCityDate
            }
          }
        ]
      }
      object.where = whereObject;

      return object;
    } else if (fromAirport && toAirport && !inCity) {
      console.log("fromAirport && toAirport");
      object.firstDateOfBooking = fromAirportDate;
      object.secondDateOfBooking = toAirportDate
      object.type = type[4];
      whereObject[0] = {
        "and": [{
            "end": {
              "gt": fromAirportDate
            }
          },
          {
            "start": {
              "lt": addHours(numHoure, fromAirportDate)
            }
          }
        ]
      }
      whereObject[1] = {
        "and": [{
            "end": {
              "gt": toAirportDate
            }
          },
          {
            "start": {
              "lt": addHours(numHoure, toAirportDate)
            }
          }
        ]
      }
      object.where = whereObject;

      return object;
    } else if (fromAirport && toAirport && inCity) {
      console.log("fromAirport && inCity && toAirport");
      object.firstDateOfBooking = fromAirportDate;
      object.secondDateOfBooking = addHours(numHoure, toAirportDate);
      object.type = type[6];
      whereObject[0] = {
        "and": [{
            "end": {
              "gt": fromAirportDate
            }
          },
          {
            "start": {
              "lt": addHours(numHoure, toAirportDate)
            }
          }
        ]
      }
      return object;
    }
  }

  function cheackCar(carId, type, where, callback) {
    Trip.app.models.car.findById(carId, function (err, oneCar) {
      if (err)
        return callback(err)
      if (oneCar == null || oneCar.status == "deactive")
        return callback(errors.car.carNotFound());
      console.log("where");
      console.log(JSON.stringify(where));
      Trip.app.models.bookingCar.find({
        "where": {
          "and": [{
              "carId": carId
            },
            {
              "or": where
            }
          ]
        }
      }, function (err, data) {
        if (err)
          return callback(err)
        if (data[0] != null)
          return callback(errors.car.carNotAvailable())
        callback(null);

      })
    })
  }


  function cheackLocation(locationId, callback) {
    Trip.app.models.location.findById(locationId, function (err, oneLocation) {
      if (err)
        return callback(err)
      if (oneLocation == null || oneLocation.status == "deactive")
        return callback(errors.location.locationNotFound());

      return callback(null)
    })
  }

  function addHours(h, start) {
    console.log(start.toString())
    var date = new Date(start.toString());
    date.setHours(date.getHours() + h);
    console.log(date)
    return date
  }

  /**
   *
   * @param {object} req
   * @param {Function(Error, array)} callback
   */

  Trip.getMyTrip = function (req, callback) {
    Trip.find({
      where: {
        "ownerId": req.accessToken.userId
      }
    }, function (err, data) {
      if (err)
        return callback(err, null);
      callback(null, data);
    })
  };

  /**
   *
   * @param {string} id
   * @param {string} newStatus
   * @param {Function(Error, object)} callback
   */

  Trip.changeStatus = function (id, newStatus, callback) {
    var result;
    // TODO
    Trip.find({
        "where": {
          "id": id
        }
      },
      function (err, trip) {
        if (err)
          return callback(err)
        console.log("trip")
        console.log(trip)
        if (trip[0] == null)
          return callback(errors.trip.tripNotFound());
        trip[0].status = newStatus;
        trip[0].save();
        callback(null, trip[0]);
      })
  };

  /**
   *
   * @param {string} id
   * @param {string} newStatus
   * @param {Function(Error, object)} callback
   */

  Trip.changemyTripStatus = function (id, newStatus, callback) {
    var result;
    // TODO
    Trip.find({
        "where": {
          "id": id
        }
      },
      function (err, trip) {
        if (err)
          return callback(err)
        console.log("trip")
        console.log(trip)
        if (trip[0] == null || trip[0].status == "deactive")
          return callback(errors.trip.tripNotFound());
        trip[0].status = newStatus;
        trip[0].save();
        callback(null, trip[0]);
      })
  };

};
