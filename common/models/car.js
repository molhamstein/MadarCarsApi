'use strict';
const numHoure = 2;

const errors = require('../../server/errors');
var _ = require('lodash');
const type = ['fromAirport', 'city', 'toAirport', 'fromAirportAndCity', 'fromAirportAndToAirport', 'cityAndToAirport', 'fromAirportAndCityAndToAirport']

module.exports = function (Car) {
  // Car.validatesInclusionOf('type', { in: ['sport', 'ceremony']
  // });

  Car.validatesInclusionOf('status', {
    in: ['active', 'deactive']
  });


  // Car.validatesInclusionOf('engineType', { in: ['manual', 'automatic']
  // });


  Car.afterRemote('create', function (context, result, next) {
    // TODO add carSublocation like in edit
    _.each(context.req.body.carMedia, oneSlide => {
      oneSlide.carId = result.id;
    })
    _.each(context.req.body.carSublocations, oneSublocation => {
      oneSublocation.carId = result.id;
    })

    _.each(context.req.body.carsAirport, oneCarsAirport => {
      oneCarsAirport.carId = result.id;
      delete oneCarsAirport.name
    })

    console.log(context.req.body.carMedia)
    Car.app.models.carMedia.create(context.req.body.carMedia, function (err, data) {
      if (err)
        return next(err);
      Car.app.models.carSublocation.create(context.req.body.carSublocations, function (err, data) {
        if (err)
          return next(err);
        Car.app.models.carsAirport.create(context.req.body.carsAirport, function (err, data) {
          if (err)
            return next(err);
          next()
        })
      })

    })
  })


  Car.observe('before save', function (context, next) {
    console.log("before save")
    if (context.where == null)
      next()
    else {
      if (context.data.carsAirport != undefined) {
        var carId = context.where.id
        Car.app.models.carsAirport.destroyAll({
          "carId": carId
        }, function (err, data) {
          if (err)
            return next(err);
          _.each(context.data.carsAirport, oneSlide => {
            oneSlide.carId = context.where.id;
            delete oneSlide.name
          })
          Car.app.models.carsAirport.create(context.data.carsAirport, function (err, data) {
            if (err)
              return next(err);
          })
        })
      }
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
            if (context.data.carSublocations != undefined) {
              var carId = context.where.id
              Car.app.models.carSublocation.destroyAll({
                "carId": carId
              }, function (err, data) {
                if (err)
                  return next(err);
                _.each(context.data.carSublocations, oneSlide => {
                  oneSlide.carId = context.where.id;
                })
                console.log("carSublocations")
                console.log(context.data.carSublocations)
                Car.app.models.carSublocation.create(context.data.carSublocations, function (err, data) {
                  if (err)
                    return next(err);
                  next()
                })
              })
            } else
              next()

          })
        })
      } else if (context.data.carSublocations != undefined) {
        var carId = context.where.id
        Car.app.models.carSublocation.destroyAll({
          "carId": carId
        }, function (err, data) {
          if (err)
            return next(err);
          _.each(context.data.carSublocations, oneSlide => {
            oneSlide.carId = context.where.id;
          })
          console.log("carSublocations")
          console.log(context.data.carSublocations)
          Car.app.models.carSublocation.create(context.data.carSublocations, function (err, data) {
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

  function calculateAge(birthday) { // birthday is a date
    var ageDifMs = Date.now() - birthday.getTime();
    var ageDate = new Date(ageDifMs); // miliseconds from epoch
    return Math.abs(ageDate.getUTCFullYear() - 1970);
  }

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

  Car.getAvailable = function (flags, dates, locationId, filter, langFilter, tripId, driverAge, driverGender, callback) {
    if (driverAge == undefined) {
      driverAge = {
        "min": 0,
        "max": 100
      }
    }
    if (filter == null) {
      var filter = {}
      filter["where"] = {}
    }
    filter["where"]["locationId"] = locationId;
    filter["where"]["status"] = "active";

    Car.find(filter, function (err, cars) {
      if (err)
        return callback(err, null)
      if (cars.length == 0)
        return callback(null, [])

      var object = fillDateOfBooking(flags, dates)
      console.log("object.where")
      console.log(JSON.stringify(object.where))
      var carIDS = []
      _.each(cars, oneCar => {
        carIDS.push(oneCar.id);
      })
      console.log(tripId);
      var mainWher = {}
      if (tripId != undefined)
        mainWher = {
          "where": {
            "and": [{
                "carId": {
                  "inq": carIDS
                },
              },
              {
                "tripId": {
                  "neq": tripId
                }
              }, {
                "or": object.where
              }
            ]
          }
        }
      else {
        mainWher = {
          "where": {
            "and": [{
              "carId": {
                "inq": carIDS
              },
            }, {
              "or": object.where
            }]
          }
        }
      }
      Car.app.models.bookingCar.find(mainWher, function (err, data) {
        if (err)
          return callback(err)
        console.log("Data");
        console.log(data);
        data.forEach(function (element) {
          cars.splice(cars.findIndex(function (i) {
            return i.id.toString() == element.carId.toString();
          }), 1);
        }, this);
        var popCarIds = [];
        if (langFilter == undefined) {
          console.log("cars")
          if (cars.length == 0)
            return callback(null, cars);
          for (let index = 0; index < cars.length; index++) {
            const element = cars[index];
            element.driver.get(function (err, driver) {
              console.log();
              var driverBirthdate = calculateAge(driver.birthdate)
              if (driverBirthdate < driverAge.min || driverBirthdate > driverAge.max || (driverGender != undefined && driver.gender != driverGender)) {
                console.log("push Out")
                popCarIds.push(element.id);
              }
              if (index == cars.length - 1) {
                console.log("popCarIds");
                console.log(popCarIds);
                var secIndex = 0;
                if (popCarIds.length != 0) {
                  popCarIds.forEach(function (element) {
                    cars.splice(cars.findIndex(function (i) {
                      return i.id == element;
                    }), 1);
                    secIndex++;
                    console.log("Daaaaaaaaaaaattttttttttttaaaaaaaaaaa")
                    console.log(cars.length);
                    if (secIndex == popCarIds.length)
                      return callback(null, cars);
                  }, this);
                } else {
                  console.log("Daaaaaaaaaaaattttttttttttaaaaaaaaaaa")
                  console.log(cars.length);
                  return callback(null, cars);
                }
              }
            })
          }
        } else {
          cars.forEach(function (oneCar, carIndex) {
            oneCar.driver.get(function (err, driver) {
              driver.driverLangs(function (err, data) {
                langFilter.forEach(function (oneLangFilter, langIndex) {
                  var index =
                    data.find(function (element) {
                      return element.landuageId == oneLangFilter;
                    });
                  var driverBirthdate = calculateAge(driver.birthdate)
                  if (index == undefined || driverBirthdate < driverAge.min || driverBirthdate > driverAge.max || (driverGender != undefined && driver.gender != driverGender)) {
                    console.log("push Out")
                    popCarIds.push(oneCar.id);
                  }
                  if (carIndex + 1 == cars.length && langIndex + 1 == langFilter.length) {
                    console.log("test");
                    console.log(popCarIds)
                    var secIndex = 0;
                    if (popCarIds.length != 0) {

                      popCarIds.forEach(function (element) {
                        cars.splice(cars.findIndex(function (i) {
                          return i.id == element;
                        }), 1);
                        secIndex++;
                        console.log("Daaaaaaaaaaaattttttttttttaaaaaaaaaaa")
                        console.log(cars.length);
                        if (secIndex == popCarIds.length)
                          return callback(null, cars);
                      }, this);
                    } else
                      return callback(null, cars);
                  }
                }, this);
              })

            })
          }, this);
        }
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
      };
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
            "first": {
              "lt": addHours(numHoure, toAirportDate)
            },
          }
        ]
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

  function addHours(h, start) {
    console.log(start.toString())
    var date = new Date(start.toString());
    date.setHours(date.getHours() + h);
    console.log(date)
    return date
  }


};
