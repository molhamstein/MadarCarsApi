'use strict';

module.exports = function (Bill) {

  Bill.beforeRemote('create', function (context, result, next) {
    var mainData = context.req.body;
    if (mainData['type'] == "outer") {
      Bill.app.models.outerBill.find({
        "where": {
          "tripId": mainData['tripId']
        }
      }, function (err, data) {
        if (err)
          return next(err, null)
        if (data[0] != null) {
          console.log("Found Outer Bill")
          context.req.body.outerBillId = data[0].id
          delete context.req.body['type'];
          delete context.req.body['tripId'];
          delete context.req.body['ownerId'];
          next();
        } else {
          console.log("Not Found Outer Bill")
          Bill.app.models.outerBill.create({
            "tripId": mainData['tripId'],
            "ownerId": mainData['ownerId']
          }, function (err, data) {
            if (err)
              return next(err, null)
            context.req.body.outerBillId = data.id
            Bill.app.models.trip.findById(mainData['tripId'], function (err, trip) {
              if (err)
                return next(err, null)
              trip.hasOuterBill = true;
              trip.save()
              delete context.req.body['type'];
              delete context.req.body['ownerId'];
              delete context.req.body['tripId'];
              next();
            })
          })
        }
      })
    } else if (date['type'] == "inner") {

    }
  })
};
