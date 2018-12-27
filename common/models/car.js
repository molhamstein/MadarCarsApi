'use strict';
const errors = require('../../server/errors');
var _ = require('lodash');
const type = ['fromAirport', 'city', 'toAirport', 'fromAirportAndCity', 'fromAirportAndToAirport', 'cityAndToAirport', 'fromAirportAndCityAndToAirport']

module.exports = function (Car) {
  Car.validatesInclusionOf('type', { in: ['sport', 'ceremony']
  });

  Car.validatesInclusionOf('status', { in: ['active', 'deactive']
  });


  Car.validatesInclusionOf('EngineType', { in: ['manual', 'automatic']
  });


  Car.afterRemote('create', function (context, result, next) {
    // TODO add carSublocation like in edit
    _.each(context.req.body.carMedia, oneSlide => {
      oneSlide.carId = result.id;
    })
    console.log(context.req.body.carMedia)
    Car.app.models.carMedia.create(context.req.body.carMedia, function (err, data) {
      if (err)
        return next(err);
      next()
    })
  })


  Car.observe('before save', function (context, next) {
    console.log("before save")
    if (context.where == null)
      next()
    else {
      if (context.data.carMedia != undefined) {
        var carId = context.where.id
        Car.app.models.carMedia.destroyAll({
          "carId": carId
        }, function (err, data) {
          if (err)
            return next(err);
          _.each(context.data.carMedia, oneSlide => {
            oneSlide.carId = context.where.id;
          })
          console.log("carMedia")
          console.log(context.data.carMedia)
          Car.app.models.carMedia.create(context.data.carMedia, function (err, data) {
            if (err)
              return next(err);
            if (context.data.carSublocation != undefined) {
              var carId = context.where.id
              Car.app.models.carSublocation.destroyAll({
                "carId": carId
              }, function (err, data) {
                if (err)
                  return next(err);
                _.each(context.data.carSublocation, oneSlide => {
                  oneSlide.carId = context.where.id;
                })
                console.log("carSublocation")
                console.log(context.data.carSublocation)
                Car.app.models.carSublocation.create(context.data.carSublocation, function (err, data) {
                  if (err)
                    return next(err);
                  next()
                })
              })
            } else
              next()

          })
        })
      } else if (context.data.carSublocation != undefined) {
        var carId = context.where.id
        Car.app.models.carSublocation.destroyAll({
          "carId": carId
        }, function (err, data) {
          if (err)
            return next(err);
          _.each(context.data.carSublocation, oneSlide => {
            oneSlide.carId = context.where.id;
          })
          console.log("carSublocation")
          console.log(context.data.carSublocation)
          Car.app.models.carSublocation.create(context.data.carSublocation, function (err, data) {
            if (err)
              return next(err);
            next()
          })
        })
      } else
        next()
    }

  })


  /**
   *
   * @param {string} id
   * @param {Function(Error, number)} callback
   */

  Car.deactivate = function (id, callback) {
    var code = 200;
    // TODO
    Car.findById(id, function (err, car) {
      if (err)
        return callback(err, null);
      if (car == null)
        return callback(errors.global.notFound());
      if (car.status == "deactive")
        return callback(errors.global.alreadyDeactive());

      car.status = "deactive"
      car.save()
      return callback(err, code)

    })
  };


  Car.activate = function (id, callback) {
    var code = 200;
    // TODO
    Car.findById(id, function (err, car) {
      if (err)
        return callback(err, null);
      if (car == null)
        return callback(errors.global.notFound());
      if (car.status == "active")
        return callback(errors.global.alreadyActive());

      car.status = "active"
      car.save()
      return callback(err, code)

    })
  };

  /**
   *
   * @param {object} flags
   * @param {object} dates
   * @param {object} filter
   * @param {string} locationId
   * @param {Function(Error, array)} callback
   */

  Car.getAvailable = function (flags, dates, locationId, filter, langFilter, callback) {

    if (filter == null) {
      var filter = {}
      filter["where"] = {}
    }
    filter["where"]["locationId"] = locationId;
    filter["where"]["status"] = "active";

    Car.find(filter, function (err, cars) {
      if (err)
        return callback(err, null)
      var object = fillDateOfBooking(flags, dates)
      // console.log(object.where)
      var carIDS = []
      _.each(cars, oneCar => {
        carIDS.push(oneCar.id);
      })
      Car.app.models.bookingCar.find({
        "where": {
          "and": [{
            "carId": {
              "inq": carIDS
            }
          }, {
            "or": object.where
          }]
        }
      }, function (err, data) {
        if (err)
          return callback(err)
        data.forEach(function (element) {
          cars.splice(cars.findIndex(function (i) {
            return i.id == element.carId;
          }), 1);
        }, this);
        var popCarIds = [];

        cars.forEach(function (oneCar, carIndex) {
          oneCar.driver.get(function (err, driver) {
            driver.driverLangs(function (err, data) {
              langFilter.forEach(function (oneLangFilter, langIndex) {
                var index =
                  data.find(function (element) {
                    return element.landuageId == oneLangFilter;
                  });
                if (index == undefined) {
                  console.log("push Out")
                  popCarIds.push(oneCar.id);
                }
                if (carIndex + 1 == cars.length && langIndex + 1 == langFilter.length) {
                  console.log("test");
                  console.log(popCarIds)
                  popCarIds.forEach(function (element) {
                    cars.splice(cars.findIndex(function (i) {
                      return i.id == element;
                    }), 1);
                  }, this);
                  return callback(null, cars);
                }
              }, this);
            })

          })
        }, this);
      })

    })
  };


  function fillDateOfBooking(flags, dates) {
    var fromAirport = flags.fromAirport;
    var toAirport = flags.toAirport;
    var inCity = flags.inCity;
    var fromAirportDate = dates.fromAirportDate;
    var toAirportDate = dates.toAirportDate;
    var startInCityDate = dates.startInCityDate;
    var endInCityDate = dates.endInCityDate;
    var object = {};
    var whereObject = [];
    if (!fromAirport && !toAirport && inCity) {
      console.log("inCity");
      whereObject[0] = {
        "end": {
          "gt": startInCityDate
        },
        "start": {
          "lt": endInCityDate
        }
      }
      object.where = whereObject;
      object.type = type[1];
      return object;
    } else if (!fromAirport && toAirport && !inCity) {
      console.log("toAirport");
      object.firstDateOfBooking = toAirportDate;
      object.secondDateOfBooking = addHours(numHoure, toAirportDate)
      whereObject['where']["or"].push({
        "end": {
          "gt": toAirportDate
        },
        "first": {
          "lt": addHours(numHoure, toAirportDate)
        },
      })
      object.where = whereObject;
      object.type = type[2];
      return object;
    } else if (!fromAirport && toAirport && inCity) {
      console.log("inCity && toAirport");
      object.firstDateOfBooking = startInCityDate;
      object.secondDateOfBooking = addHours(numHoure, toAirportDate);
      object.type = type[5];
      whereObject[0] = {
        "end": {
          "gt": startInCityDate
        },
        "start": {
          "lt": addHours(numHoure, toAirportDate)
        }
      }
      object.where = whereObject;

      return object;
    } else if (fromAirport && !toAirport && !inCity) {
      console.log("fromAirport");
      object.firstDateOfBooking = fromAirportDate;
      object.secondDateOfBooking = addHours(numHoure, fromAirportDate);
      object.type = type[0];
      whereObject[0] = {
        "end": {
          "gt": fromAirportDate
        },
        "start": {
          "lt": addHours(numHoure, fromAirportDate)
        }
      }
      object.where = whereObject;

      return object;
    } else if (fromAirport && !toAirport && inCity) {
      console.log("fromAirport && inCity");
      object.firstDateOfBooking = fromAirportDate;
      object.secondDateOfBooking = endInCityDate
      object.type = type[3];
      whereObject[0] = {
        "end": {
          "gt": fromAirportDate
        },
        "start": {
          "lt": endInCityDate
        }
      }
      object.where = whereObject;

      return object;
    } else if (fromAirport && toAirport && !inCity) {
      console.log("fromAirport && toAirport");
      object.firstDateOfBooking = fromAirportDate;
      object.secondDateOfBooking = toAirportDate
      object.type = type[4];
      whereObject[0] = {
        "end": {
          "gt": fromAirportDate
        },
        "start": {
          "lt": addHours(numHoure, fromAirportDate)
        }
      }
      whereObject[1] = {
        "end": {
          "gt": toAirportDate
        },
        "start": {
          "lt": addHours(numHoure, toAirportDate)
        }
      }
      object.where = whereObject;

      return object;
    } else if (fromAirport && toAirport && inCity) {
      console.log("fromAirport && inCity && toAirport");
      object.firstDateOfBooking = fromAirportDate;
      object.secondDateOfBooking = addHours(numHoure, toAirportDate);
      object.type = type[6];
      whereObject[0] = {
        "end": {
          "gt": fromAirportDate
        },
        "start": {
          "lt": addHours(numHoure, toAirportDate)
        }
      }
      return object;
    }
  }

};
