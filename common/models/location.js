'use strict';
var _ = require('lodash');
const errors = require('../../server/errors');

module.exports = function (Location) {

  Location.validatesInclusionOf('status', {
    in: ['active', 'deactive']
  });

  Location.afterRemote('create', function (context, result, next) {
    _.each(context.req.body.slideMedia, oneSlide => {
      oneSlide.locationId = result.id;
    })

    console.log(context.req.body.slideMedia)
    Location.app.models.locationMedia.create(context.req.body.slideMedia, function (err, data) {
      if (err)
        return next(err);
      context.req.body.slideMedia = null
      next()
    })
  })



  Location.observe('before save', function (context, next) {
    console.log("before save")
    if (context.where == null)
      next()
    else {
      if (context.data.slideMedia != undefined) {
        console.log("context.data.slideMedia")
        console.log(context.data.slideMedia)
        var locationId = context.where.id
        console.log(locationId)
        Location.app.models.locationMedia.destroyAll({
          "locationId": locationId
        }, function (err, data) {
          if (err)
            return next(err);
          _.each(context.data.slideMedia, oneSlide => {
            oneSlide.locationId = context.where.id;
          })
          console.log(context.data.slideMedia)
          Location.app.models.locationMedia.create(context.data.slideMedia, function (err, data) {
            if (err)
              return next(err);
            next()
          })
        })
      } else
        next()
    }
  })



  Location.deactivate = function (id, callback) {
    var code = 200;
    // TODO
    Location.findById(id, function (err, location) {
      if (err)
        return callback(err, null);
      if (location == null)
        return callback(errors.global.notFound());
      if (location.status == "deactive")
        return callback(errors.global.alreadyDeactive());

      location.status = "deactive"
      location.save()
      return callback(err, code)

    })
  };


  Location.activate = function (id, callback) {
    var code = 200;
    // TODO
    Location.findById(id, function (err, location) {
      if (err)
        return callback(err, null);
      if (location == null)
        return callback(errors.global.notFound());
      if (location.status == "active")
        return callback(errors.global.alreadyActive());

      location.status = "active"
      location.save()
      return callback(err, code)

    })
  };

  Location.homeStatus = function (callback) {
    Location.count({
      "status": "active"
    }, function (err, countLocation) {
      if (err)
        callback(err);
      Location.app.models.car.count({
        "status": "active"
      }, function (err, countCars) {
        if (err)
          callback(err);
        Location.app.models.trip.count({}, function (err, countTrip) {
          if (err)
            callback(err);
          Location.app.models.driver.count({
            "status": "active"
          }, function (err, countDriver) {
            if (err)
              callback(err);
            callback(err, {
              "cars": countCars,
              "locations": countLocation,
              "trips": countTrip,
              "drivers": countDriver
            });
          })
        })

      })
    })
  }

};
