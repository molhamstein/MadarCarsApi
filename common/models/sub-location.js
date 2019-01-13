'use strict';

module.exports = function (Sublocation) {
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

      sublocation.status = "deactive"
      sublocation.save()
      return callback(err, code)

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

      sublocation.status = "active"
      sublocation.save()
      return callback(err, code)

    })
  };
};
