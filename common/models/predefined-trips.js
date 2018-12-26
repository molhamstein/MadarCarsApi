'use strict';
var _ = require('lodash');

module.exports = function (Predefinedtrips) {


  Predefinedtrips.validatesInclusionOf('status', { in: ['active', 'deactive']
  });



  Predefinedtrips.afterRemote('create', function (context, result, next) {
    if (context.req.body.predefinedTripsMedia != undefined) {
      _.each(context.req.body.predefinedTripsMedia, oneSlide => {
        oneSlide.predefinedTripId = result.id;
      })
      console.log(context.req.body.predefinedTripsMedia)
      Predefinedtrips.app.models.predefinedTripsMedia.create(context.req.body.predefinedTripsMedia, function (err, data) {
        if (err)
          return next(err);
        if (context.req.body.predefinedTripsSubpredefinedtrips != undefined) {
          _.each(context.req.body.predefinedTripsSubpredefinedtrips, oneSlide => {
            oneSlide.predefinedTripId = result.id;
          })
          console.log(context.req.body.predefinedTripsSubpredefinedtrips)
          Predefinedtrips.app.models.predefinedTripsSubpredefinedtrip.create(context.req.body.predefinedTripsSubpredefinedtrips, function (err, data) {
            if (err)
              return next(err);
            return next()
          })
        } else
          return next()
      })
    } else if (context.req.body.predefinedTripsSubpredefinedtrips != undefined) {
      _.each(context.req.body.predefinedTripsSubpredefinedtrips, oneSlide => {
        oneSlide.predefinedTripId = result.id;
      })
      console.log(context.req.body.predefinedTripsSubpredefinedtrips)
      Predefinedtrips.app.models.predefinedTripsSubpredefinedtrip.create(context.req.body.predefinedTripsSubpredefinedtrips, function (err, data) {
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

      if (context.data.predefinedTripsMedia != undefined) {
        Predefinedtrips.app.models.predefinedTripsMedia.destroyAll({
          "predefinedTripId": predefinedTripId
        }, function (err, data) {
          if (err)
            return next(err);
          _.each(context.data.predefinedTripsMedia, oneSlide => {
            oneSlide.predefinedTripId = context.where.id;
          })
          console.log(context.data.predefinedTripsMedia)
          Predefinedtrips.app.models.predefinedTripsMedia.create(context.data.predefinedTripsMedia, function (err, data) {
            if (err)
              return next(err);
            if (context.data.predefinedTripsSubpredefinedtrips != undefined) {
              Predefinedtrips.app.models.predefinedTripsSubpredefinedtrip.destroyAll({
                "predefinedTripId": predefinedTripId
              }, function (err, data) {
                if (err)
                  return next(err);
                _.each(context.data.predefinedTripsSubpredefinedtrips, oneSlide => {
                  oneSlide.predefinedTripId = predefinedTripId;
                })
                console.log("predefinedTripsSubpredefinedtrips")
                console.log(context.data.predefinedTripsSubpredefinedtrips)
                Predefinedtrips.app.models.predefinedTripsSubpredefinedtrip.create(context.data.predefinedTripsSubpredefinedtrips, function (err, data) {
                  if (err)
                    return next(err);
                  next()
                })
              })
            } else
              next()

          })
        })
      }
      if (context.data.predefinedTripsSubpredefinedtrips != undefined) {
        Predefinedtrips.app.models.predefinedTripsSubpredefinedtrip.destroyAll({
          "predefinedTripId": predefinedTripId
        }, function (err, data) {
          if (err)
            return next(err);
          _.each(context.data.predefinedTripsSubpredefinedtrips, oneSlide => {
            oneSlide.predefinedTripId = predefinedTripId;
          })
          console.log("predefinedTripsSubpredefinedtrips")
          console.log(context.data.predefinedTripsSubpredefinedtrips)
          Predefinedtrips.app.models.predefinedTripsSubpredefinedtrip.create(context.data.predefinedTripsSubpredefinedtrips, function (err, data) {
            if (err)
              return next(err);
            next()
          })
        })
      } else
        next()
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
