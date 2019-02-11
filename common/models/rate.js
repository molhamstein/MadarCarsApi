'use strict';
const errors = require('../../server/errors');

module.exports = function (Rate) {

  /**
   *
   * @param {string} carId
   * @param {string} value
   * @param {Function(Error, number)} callback
   */

  Rate.makeRate = function (carId, tripId, value, ownerId, req, callback) {
    var code = 200;
    if (ownerId == undefined || ownerId == null)
      ownerId = req.accessToken.userId;
    Rate.app.models.trip.findById(tripId, function (err, oneTrip) {
      if (err)
        return callback(err, null);
      Rate.app.models.car.findById(carId, function (err, oneCar) {
        if (err)
          return callback(err, null);
        if (oneCar == null)
          return callback(errors.car.carNotFound());
        Rate.create({
          value: value,
          carId: carId,
          ownerId: ownerId,
          tripId: tripId
        }, function (err, data) {
          if (err)
            return callback(err, null);
          if (oneCar.numRateing == 0) {
            oneCar.numRateing = 1;
            oneCar.rate = value;
          } else {
            oneCar.numRateing++;
            oneCar.rate = (oneCar.rate + value) / 2;
          }
          oneCar.save();
          oneTrip.rateId = data.id;
          oneTrip.save();
          return callback(null, code)
        })
      })
    })
  };

  Rate.updateRate = function (id, carId, value, callback) {
    Rate.findById(id, function (err, rate) {
      if (err)
        return callback(err, null);
      var code = 200;
      Rate.app.models.car.findById(carId, function (err, oneCar) {
        if (err)
          return callback(err, null);
        if (oneCar == null)
          return callback(errors.car.carNotFound());
        if (oneCar.numRateing == 1) {
          oneCar.rate = value;
        } else {
          oneCar.rate = (oneCar.rate * 2) - rate.value;
          oneCar.rate = (oneCar.rate + value) / 2;
        }
        rate.value = value;
        rate.save();
        console.log("oneCar.rate")
        console.log(oneCar.rate)
        oneCar.save();
        return callback(null, code)
      })
    })
  };


  /**
   *
   * @param {string} carId
   * @param {object} req
   * @param {Function(Error, number)} callback
   */

  Rate.myRate = function (carId, req, callback) {
    var value;
    var ownerId = req.accessToken.userId;
    Rate.find({
      "where": {
        "carId": carId,
        "ownerId": ownerId
      }
    }, function (err, data) {
      if (err)
        return callback(err, null);
      if (data[0] == null)
        return callback(err, 0);
      return callback(err, data[0].value);

    })
  };



  /**
   *
   * @param {object} filter
   * @param {Function(Error, array)} callback
   */

  Rate.getByFilter = function (filter, callback) {
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
    if (filter != {}) {
      where = [{
        $match: filter
      }, {
        "$skip": skip
      }, {
        "$limit": limit
      }, {
        $project: {
          "_id": 0,
          "id": "$_id",
          "value": 1,
          "createdAt": 1,
          "carId": 1,
          "ownerId": 1,
          "tripId": 1,
          "trip": 1,
          "car": 1,
          "user": 1,
        }
      }]
    } else {
      where = [{
        "$limit": limit
      }, {
        "$skip": skip
      }, {
        $project: {
          "_id": 0,
          "id": "$_id",
          "value": 1,
          "createdAt": 1,
          "carId": 1,
          "ownerId": 1,
          "tripId": 1,
          "trip": 1,
          "car": 1,
          "user": 1,
        }
      }]
    }
    Rate.getDataSource().connector.connect(function (err, db) {
      console.log(where);
      var collection = db.collection('rate');
      var cursor = collection.aggregate(where)
      cursor.get(function (err, data) {
        if (err) return callback(err);
        console.log(data.length)
        return callback(null, data);
      })
    })
    // TODO
    // callback(null, result);
  };

  Rate.getEndByFilter = function (filter, callback) {
    var limit = 10;
    var where = []
    if (filter && filter['limit'] != null) {
      limit = filter['limit'];
      delete filter['limit']
    }

    Rate.count({}, function (err, count) {
      console.log(count);
      var skip = 0
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
      if (filter) {
        where = [{
          $match: filter
        }, {
          "$limit": limit
        }, {
          "$skip": skip
        }, {
          $project: {
            "id": "_id",
          }
        }]
      } else {
        where = [{
          "$limit": limit
        }, {
          "$skip": skip
        }, {
          $project: {
            "id": "_id",
          }
        }]
      }
      Rate.getDataSource().connector.connect(function (err, db) {
        console.log(where);
        var collection = db.collection('rate');
        var cursor = collection.aggregate(where)
        cursor.get(function (err, data) {
          if (err) return callback(err);
          console.log(data.length)
          return callback(null, {
            "data": data,
            "count": count
          })

        })
      })
      // Trip.find({
      //   "skip": skip,
      //   "limit": limit
      // }, function (err, data) {
      //   callback(null, {
      //     "data": data,
      //     "count": count
      //   })
      // })

    })
  };

  Rate.getEnd = function (limit, callback) {
    Rate.count({}, function (err, count) {
      console.log(count);
      var skip = 0
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

      Rate.find({
        "skip": skip,
        "limit": limit
      }, function (err, data) {
        callback(null, {
          "data": data,
          "count": count
        })
      })

    })
  };

};
