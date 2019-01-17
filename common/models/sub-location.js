'use strict';

module.exports = function (Sublocation) {

  Sublocation.afterRemote('create', function (context, result, next) {
    Sublocation.app.models.Location.findById(context.req.body.locationId, function (err, location) {
      if (err)
        return next(err)
      location.sublocationCount++;
      location.save()
      next()
    })
  })

  Sublocation.deactivate = function (id, callback) {
    var code = 200;
    // TODO
    Sublocation.findById(id, function (err, sublocation) {
      if (err)
        return callback(err, null);
      if (sublocation == null)
        return callback(errors.global.notFound());
      if (sublocation.status == "deactive")
        return callback(errors.global.alreadyDeactive());
      Sublocation.app.models.Location.findById(sublocation.locationId, function (err, location) {
        if (err)
          return callback(err)
        location.sublocationCount--;
        location.save()
        sublocation.status = "deactive"
        sublocation.save()
        return callback(err, code)
      })

    })
  };


  Sublocation.activate = function (id, callback) {
    var code = 200;
    // TODO
    Sublocation.findById(id, function (err, sublocation) {
      if (err)
        return callback(err, null);
      if (sublocation == null)
        return callback(errors.global.notFound());
      if (sublocation.status == "active")
        return callback(errors.global.alreadyActive());

      Sublocation.app.models.Location.findById(sublocation.locationId, function (err, location) {
        if (err)
          return callback(err)
        location.sublocationCount++;
        location.save()
        sublocation.status = "active"
        sublocation.save()
        return callback(err, code)
      })

    })
  };
};
