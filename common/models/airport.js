'use strict';

module.exports = function (Airport) {
  Airport.validatesInclusionOf('status', {
    in: ['active', 'deactive']
  });

  Airport.deactivate = function (id, callback) {
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


  Airport.activate = function (id, callback) {
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

};
