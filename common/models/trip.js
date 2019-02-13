'use strict';
const errors = require('../../server/errors');
const numHoure = 2;
var _ = require('lodash');

const type = ['fromAirport', 'city', 'toAirport', 'fromAirportAndCity', 'fromAirportAndToAirport', 'cityAndToAirport', 'fromAirportAndCityAndToAirport']
module.exports = function (Trip) {
  Trip.validatesInclusionOf('type', {
    in: ['city', 'fromAirport', 'toAirport', 'cityAndToAirport', 'fromAirportAndCity', 'fromAirportAndToAirport', 'fromAirportAndCityAndToAirport']
  });

  Trip.validatesInclusionOf('status', {
    in: ['pending', 'approved', 'active', 'deactive', 'finished']
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
      cheackCar(data.carId, data.type, bookingDate.where, null, function (err) {
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
      _.each(ctx.req.body.tripSublocations, oneSublocation => {
        oneSublocation.tripId = result.id;
      })
      console.log(ctx.req.body.tripSublocations)
      if (ctx.req.body.tripSublocations)
        Trip.app.models.tripSublocation.create(ctx.req.body.tripSublocations, function (err, data) {
          if (err)
            return next(err);
          next();
        })
      else {
        next()
      }

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
      object.where = whereObject;
      return object;
    }
  }

  function cheackCar(carId, type, where, tripId, callback) {
    Trip.app.models.car.findById(carId, function (err, oneCar) {
      if (err)
        return callback(err)
      if (oneCar == null || oneCar.status == "deactive")
        return callback(errors.car.carNotFound());
      console.log("where");
      console.log(JSON.stringify(where));
      var mainWher = {}
      if (tripId != null)
        mainWher = {
          "where": {
            "and": [{
                "carId": carId
              },
              {
                "tripId": {
                  "neq": tripId
                }
              },
              {
                "or": where
              }
            ]
          }
        }
      else {
        mainWher = {
          "where": {
            "and": [{
                "carId": carId
              },
              {
                "or": where
              }
            ]
          }
        }
      }
      Trip.app.models.bookingCar.find(mainWher, function (err, data) {
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
        if (trip[0] == null)
          return callback(errors.trip.tripNotFound());
        trip[0].status = newStatus;
        trip[0].save();
        if (newStatus != 'finished') {
          callback(null, trip[0]);
        } else {
          console.log("send notification");
          Trip.app.models.userNotification.sendRateNotification(trip[0].ownerId, trip[0].id, trip[0].carId, function (err) {
            if (err)
              console.log(err)
            callback(null, trip[0]);
          })
        }
      })
  };


  Trip.getEnd = function (filter, callback) {
    var limit = 10;
    var where = []
    if (filter && filter['limit'] != null) {
      limit = filter['limit'];
      delete filter['limit']
    }

    if (filter != {} && filter != undefined) {
      where = [{
          $project: {
            "_id": 0,
            "id": "$_id",
            "createdAt": 1,
            "value": 1,
            "carId": 1,
            "ownerId": 1,
            "locationId": 1,
            "driverId": 1,
            "status": 1,
            "type": 1,
            "cost": 1,
            "pricePerDay": 1,
            "priceOneWay": 1,
            "priceTowWay": 1,
            "daysInCity": 1,
            "fromAirportDate": 1,
            "fromAirport": 1,
            "toAirportDate": 1,
            "toAirport": 1,
            "startInCityDate": 1,
            "endInCityDate": 1,
            "inCity": 1,
            "hasOuterBill": 1,
            "hasInnerBill": 1,
            "rateId": 1

          }
        }, {
          $lookup: {
            from: "car",
            localField: "carId",
            foreignField: "_id",
            as: "car"
          }
        }, {
          $lookup: {
            from: "driver",
            localField: "driverId",
            foreignField: "_id",
            as: "driver"
          }
        }, {
          $lookup: {
            from: "location",
            localField: "locationId",
            foreignField: "_id",
            as: "location"
          }
        },
        {
          $lookup: {
            from: "user",
            localField: "ownerId",
            foreignField: "_id",
            as: "owner"
          }
        },
        {
          $lookup: {
            from: "rate",
            localField: "rateId",
            foreignField: "_id",
            as: "rate"
          }
        },
        {
          $unwind: "$owner"
        },
        {
          $unwind: "$car"
        },
        {
          $unwind: "$location"
        },
        {
          $unwind: "$driver"
        },
        {
          $unwind: "$rate"
        },
        {
          $match: filter
        }
      ]
    } else {
      where = [{
          $project: {
            "_id": 0,
            "id": "$_id",
            "createdAt": 1,
            "value": 1,
            "carId": 1,
            "ownerId": 1,
            "locationId": 1,
            "driverId": 1,
            "status": 1,
            "type": 1,
            "cost": 1,
            "pricePerDay": 1,
            "priceOneWay": 1,
            "priceTowWay": 1,
            "daysInCity": 1,
            "fromAirportDate": 1,
            "fromAirport": 1,
            "toAirportDate": 1,
            "toAirport": 1,
            "startInCityDate": 1,
            "endInCityDate": 1,
            "inCity": 1,
            "hasOuterBill": 1,
            "hasInnerBill": 1,
            "rateId": 1

          }
        }, {
          $lookup: {
            from: "car",
            localField: "carId",
            foreignField: "_id",
            as: "car"
          }
        }, {
          $lookup: {
            from: "driver",
            localField: "driverId",
            foreignField: "_id",
            as: "driver"
          }
        }, {
          $lookup: {
            from: "location",
            localField: "locationId",
            foreignField: "_id",
            as: "location"
          }
        },
        {
          $lookup: {
            from: "user",
            localField: "ownerId",
            foreignField: "_id",
            as: "owner"
          }
        },
        {
          $lookup: {
            from: "rate",
            localField: "rateId",
            foreignField: "_id",
            as: "rate"
          }
        },
        {
          $unwind: "$owner"
        },
        {
          $unwind: "$car"
        },
        {
          $unwind: "$location"
        },
        {
          $unwind: "$driver"
        }
      ]
    }
    Trip.getDataSource().connector.connect(function (err, db) {
      console.log(where);
      var collection = db.collection('trip');
      var cursor = collection.aggregate(where)
      cursor.get(function (err, data) {
        if (err) return callback(err);
        var skip = 0
        var count = data.length
        if (limit < count) {
          var mod = count % limit;
          var div = parseInt(count / limit);
          console.log("mod");
          console.log(count / limit);
          if (mod == 0)
            skip = count - limit
          else
            skip = (div * limit);
        }

        console.log(data.length)
        return callback(null, {
          "data": data.slice(skip, data.length),
          "count": count
        })
      })
    })

    // Trip.count({}, function (err, count) {
    //   console.log(count);
    //   var skip = 0
    //   if (limit < count) {
    //     var mod = count % limit;
    //     var div = parseInt(count / limit);
    //     console.log("mod");
    //     console.log(count / limit);
    //     if (mod == 0)
    //       skip = count - limit
    //     else
    //       skip = (div * limit);
    //   }


    // Trip.find({
    //   "skip": skip,
    //   "limit": limit
    // }, function (err, data) {
    //   callback(null, {
    //     "data": data,
    //     "count": count
    //   })
    // })

    // })
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

  /**
   *
   * @param {object} data
   * @param {string} id
   * @param {Function(Error, object)} callback
   */

  Trip.editMethod = function (data, id, context, callback) {
    var data;
    Trip.findById(id, function (err, TripData) {
      if (err)
        return callback(err)

      if (data.ownerId == null)
        data.ownerId = context.req.accessToken.userId;

      var bookingDate = fillDateOfBooking(data)
      data.type = bookingDate.type;
      // userData.updateAttributes({

      cheackLocation(data.locationId, function (err) {
        if (err)
          return callback(err)
        cheackCar(data.carId, data.type, bookingDate.where, id, function (err) {
          if (err)
            return callback(err)
          deleteCarBooking(id, function (err) {
            if (err)
              return callback(err)

            deleteTripSubLocation(id, function (err) {
              if (err)
                return callback(err)
              console.log("Done")
              var newData = preperData(data);
              TripData.updateAttributes(newData, function (err, newTripData) {
                if (err)
                  return callback(err)
                var bookingData = prepareCarBooking(newTripData);
                Trip.app.models.bookingCar.create(bookingData, function (err, data) {
                  if (err)
                    return callback(err);

                  _.each(data.tripSublocations, oneSublocation => {
                    oneSublocation.tripId = newTripData.id;
                  })
                  console.log(data.tripSublocations)
                  if (data.tripSublocations)
                    Trip.app.models.tripSublocation.create(data.tripSublocations, function (err, data) {
                      if (err)
                        return callback(err);
                      callback(null, newTripData);
                    })
                  else {
                    callback(null, newTripData)
                  }

                })
              })
            })

          })
        })
      })
    })
  };

  function preperData(data) {
    var Data = {};
    Data['locationId'] = data['locationId'];
    Data['ownerId'] = data['ownerId'];
    Data['fromAirport'] = data['fromAirport'];
    Data['toAirport'] = data['toAirport'];
    Data['inCity'] = data['inCity'];
    Data['toAirportDate'] = data['toAirportDate'];
    Data['startInCityDate'] = data['startInCityDate'];
    Data['endInCityDate'] = data['endInCityDate'];
    Data['fromAirportDate'] = data['fromAirportDate'];
    Data['driverId'] = data['driverId'];
    Data['pricePerDay'] = data['pricePerDay'];
    Data['priceOneWay'] = data['priceOneWay'];
    Data['priceTowWay'] = data['priceTowWay'];
    Data['carId'] = data['carId'];
    Data['cost'] = data['cost'];
    Data['daysInCity'] = data['daysInCity'];
    Data['type'] = data['type'];
    return Data;
  }

  function deleteCarBooking(tripId, callback) {
    Trip.app.models.bookingCar.destroyAll({
      "tripId": tripId
    }, function (err, data) {
      if (err)
        return callback(err)
      callback(null)
    })
  }

  function deleteTripSubLocation(tripId, callback) {
    Trip.app.models.tripSublocation.destroyAll({
      "tripId": tripId
    }, function (err, data) {
      if (err)
        return callback(err)
      callback(null)
    })
  }

  Trip.getTripByFilter = function (filter, callback) {
    var limit = 10;
    var skip = 0;
    var where = []
    if (filter && filter['limit'] != null) {
      limit = filter['limit'];
      delete filter['limit']
    }
    if (filter && filter['skip'] != null) {
      skip = filter['skip'];
      delete filter['skip']

    }
    console.log("filter.length")
    console.log(filter)
    if (filter != {} && filter != undefined) {
      where = [{
          $project: {
            "_id": 0,
            "id": "$_id",
            "createdAt": 1,
            "value": 1,
            "carId": 1,
            "ownerId": 1,
            "locationId": 1,
            "driverId": 1,
            "status": 1,
            "type": 1,
            "cost": 1,
            "pricePerDay": 1,
            "priceOneWay": 1,
            "priceTowWay": 1,
            "daysInCity": 1,
            "fromAirportDate": 1,
            "fromAirport": 1,
            "toAirportDate": 1,
            "toAirport": 1,
            "startInCityDate": 1,
            "endInCityDate": 1,
            "inCity": 1,
            "hasOuterBill": 1,
            "hasInnerBill": 1,
            "rateId": 1
          }
        }, {
          $lookup: {
            from: "car",
            localField: "carId",
            foreignField: "_id",
            as: "car"
          }
        }, {
          $lookup: {
            from: "driver",
            localField: "driverId",
            foreignField: "_id",
            as: "driver"
          }
        }, {
          $lookup: {
            from: "location",
            localField: "locationId",
            foreignField: "_id",
            as: "location"
          }
        },
        {
          $lookup: {
            from: "user",
            localField: "ownerId",
            foreignField: "_id",
            as: "owner"
          }
        },
        {
          $lookup: {
            from: "rate",
            localField: "rateId",
            foreignField: "_id",
            as: "rate"
          }
        },
        {
          $unwind: "$owner"
        },
        {
          $unwind: "$car"
        },
        {
          $unwind: "$location"
        },
        {
          $unwind: "$driver"
        },
        // {
        //   $unwind: "$rate"
        // },
        {
          "$unwind": {
            path: "$rate",
            preserveNullAndEmptyArrays: true
          }
        }, {
          $match: filter
        }, {
          "$skip": skip
        }, {
          "$limit": limit
        }
      ]
    } else {
      where = [{
          "$limit": limit
        }, {
          "$skip": skip
        }, {
          $project: {
            "_id": 0,
            "id": "$_id",
            "createdAt": 1,
            "value": 1,
            "carId": 1,
            "ownerId": 1,
            "locationId": 1,
            "driverId": 1,
            "status": 1,
            "type": 1,
            "cost": 1,
            "pricePerDay": 1,
            "priceOneWay": 1,
            "priceTowWay": 1,
            "daysInCity": 1,
            "fromAirportDate": 1,
            "fromAirport": 1,
            "toAirportDate": 1,
            "toAirport": 1,
            "startInCityDate": 1,
            "endInCityDate": 1,
            "inCity": 1,
            "hasOuterBill": 1,
            "hasInnerBill": 1,
            "rateId": 1

          }
        }, {
          $lookup: {
            from: "car",
            localField: "carId",
            foreignField: "_id",
            as: "car"
          }
        }, {
          $lookup: {
            from: "driver",
            localField: "driverId",
            foreignField: "_id",
            as: "driver"
          }
        }, {
          $lookup: {
            from: "location",
            localField: "locationId",
            foreignField: "_id",
            as: "location"
          }
        },
        {
          $lookup: {
            from: "user",
            localField: "ownerId",
            foreignField: "_id",
            as: "owner"
          }
        },
        {
          $lookup: {
            from: "rate",
            localField: "rateId",
            foreignField: "_id",
            as: "rate"
          }
        },
        {
          $unwind: "$owner"
        },
        {
          $unwind: "$car"
        },
        {
          $unwind: "$location"
        },
        {
          $unwind: "$driver"
        }
      ]
    }
    Trip.getDataSource().connector.connect(function (err, db) {
      console.log(where);
      var collection = db.collection('trip');
      var cursor = collection.aggregate(where)
      cursor.get(function (err, data) {
        if (err) return callback(err);
        console.log(data.length)
        return callback(null, data);
      })
    })
  };



};
