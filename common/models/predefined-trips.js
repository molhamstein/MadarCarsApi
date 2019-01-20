'use strict';
var _ = require('lodash');

module.exports = function (Predefinedtrips) {


  Predefinedtrips.validatesInclusionOf('status', { in: ['active', 'deactive']
  });



  Predefinedtrips.afterRemote('create', function (context, result, next) {
    if (context.req.body.predefinedTripsMedias != undefined) {
      _.each(context.req.body.predefinedTripsMedias, oneSlide => {
        oneSlide.predefinedTripId = result.id;
      })
      console.log(context.req.body.predefinedTripsMedias)
      Predefinedtrips.app.models.predefinedTripsMedia.create(context.req.body.predefinedTripsMedias, function (err, data) {
        if (err)
          return next(err);
        if (context.req.body.predefinedTripsSublocations != undefined) {
          _.each(context.req.body.predefinedTripsSublocations, oneSlide => {
            oneSlide.predefinedTripId = result.id;
          })
          console.log(context.req.body.predefinedTripsSublocations)
          Predefinedtrips.app.models.predefinedTripsSublocation.create(context.req.body.predefinedTripsSublocations, function (err, data) {
            if (err)
              return next(err);
            return next()
          })
        } else
          return next()
      })
    } else if (context.req.body.predefinedTripsSublocations != undefined) {
      _.each(context.req.body.predefinedTripsSublocations, oneSlide => {
        oneSlide.predefinedTripId = result.id;
      })
      console.log(context.req.body.predefinedTripsSublocations)
      Predefinedtrips.app.models.predefinedTripsSublocation.create(context.req.body.predefinedTripsSublocations, function (err, data) {
        if (err)
          return next(err);
        return next()
      })
    } else {
      return next()
    }
  })



  Predefinedtrips.observe('before save', function (context, next) {
    console.log("before save")
    if (context.where == null)
      next()
    else {
      var predefinedTripId = context.where.id

      if (context.data.predefinedTripsMedias != undefined && context.data.predefinedTripsMedias[0] != null) {
        Predefinedtrips.app.models.predefinedTripsMedia.destroyAll({
          "predefinedTripId": predefinedTripId
        }, function (err, data) {
          if (err)
            return next(err);
          console.log("predefinedTripsMedia")
          console.log(context.data.predefinedTripsMedias)
          _.each(context.data.predefinedTripsMedias, oneSlide => {

            oneSlide.predefinedTripId = context.where.id;
          })
          console.log(context.data.predefinedTripsMedias)
          Predefinedtrips.app.models.predefinedTripsMedia.create(context.data.predefinedTripsMedias, function (err, data) {
            if (err)
              return next(err);
            console.log("Hiiiiiiiiiiii");
            if (context.data.predefinedTripsSublocations != undefined) {
              Predefinedtrips.app.models.predefinedTripsSublocation.destroyAll({
                "predefinedTripId": predefinedTripId
              }, function (err, data) {
                if (err)
                  return next(err);
                _.each(context.data.predefinedTripsSublocations, oneSlide => {
                  oneSlide.predefinedTripId = predefinedTripId;
                })
                console.log("predefinedTripsSublocations")
                console.log(context.data.predefinedTripsSublocations)
                Predefinedtrips.app.models.predefinedTripsSubpredefinedtrip.create(context.data.predefinedTripsSublocations, function (err, data) {
                  if (err)
                    return next(err);
                  return next()
                })
              })
            } else
              return next()

          })
        })
      }
      if (context.data.predefinedTripsSublocations != undefined && context.data.predefinedTripsSublocations[0] != null) {
        Predefinedtrips.app.models.predefinedTripsSublocation.destroyAll({
          "predefinedTripId": predefinedTripId
        }, function (err, data) {
          if (err)
            return next(err);
          _.each(context.data.predefinedTripsSublocations, oneSlide => {
            oneSlide.predefinedTripId = predefinedTripId;
          })
          console.log("predefinedTripsSublocations")
          console.log(context.data.predefinedTripsSublocations)
          Predefinedtrips.app.models.predefinedTripsSublocation.create(context.data.predefinedTripsSublocations, function (err, data) {
            if (err)
              return next(err);
            return next()
          })
        })
      } else
        return next()
    }

  })

  Predefinedtrips.deactivate = function (id, callback) {
    var code = 200;
    // TODO
    Predefinedtrips.findById(id, function (err, predefinedtrip) {
      if (err)
        return callback(err, null);
      if (predefinedtrip == null)
        return callback(errors.global.notFound());
      if (predefinedtrip.status == "deactive")
        return callback(errors.global.alreadyDeactive());

      predefinedtrip.status = "deactive"
      predefinedtrip.save()
      return callback(err, code)

    })
  };


  Predefinedtrips.activate = function (id, callback) {
    var code = 200;
    // TODO
    Predefinedtrips.findById(id, function (err, predefinedtrip) {
      if (err)
        return callback(err, null);
      if (predefinedtrip == null)
        return callback(errors.global.notFound());
      if (predefinedtrip.status == "active")
        return callback(errors.global.alreadyActive());

      predefinedtrip.status = "active"
      predefinedtrip.save()
      return callback(err, code)

    })
  };


};
