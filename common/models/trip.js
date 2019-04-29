'use strict';
const errors = require('../../server/errors');
const numHoure = 2;
var _ = require('lodash');
var Iyzipay = require('iyzipay');

var iyzipay = new Iyzipay({
  apiKey: 'sandbox-cevnCuu0d2gZ5X8oYHQtNvHf77eVUdGU',
  secretKey: 'sandbox-VKspPC8b3ReCcqR85oyUoZGmIFOIVg1M',
  uri: 'https://sandbox-api.iyzipay.com'
});
const type = ['fromAirport', 'city', 'toAirport', 'fromAirportAndCity', 'fromAirportAndToAirport', 'cityAndToAirport', 'fromAirportAndCityAndToAirport']
module.exports = function (Trip) {

  Trip.addPayment = function (tripId, price, cardHolderName, cardNumber, expireMonth, expireYear, cvc, context, callback) {
    var userId = context.req.accessToken.userId
    Trip.app.models.user.findById(userId, function (err, user) {
      if (err)
        return callback(err)
      var request = {
        locale: Iyzipay.LOCALE.TR,
        conversationId: '123456789',
        price: price,
        paidPrice: price,
        currency: Iyzipay.CURRENCY.USD,
        installment: '1',
        basketId: 'B67832',
        paymentChannel: Iyzipay.PAYMENT_CHANNEL.WEB,
        paymentGroup: Iyzipay.PAYMENT_GROUP.PRODUCT,
        paymentCard: {
          cardHolderName: cardHolderName,
          cardNumber: cardNumber,
          expireMonth: expireMonth,
          expireYear: expireYear,
          cvc: cvc,
          registerCard: '0'
        },
        buyer: {
          id: userId.toString(),
          name: user.username,
          surname: user.username,
          gsmNumber: user.phoneNumber,
          email: 'admin@admin.com',
          identityNumber: '123456789',
          lastLoginDate: '',
          registrationDate: '',
          registrationAddress: 'no',
          ip: '',
          city: 'no',
          country: 'no',
          zipCode: 'no'
        },
        billingAddress: {
          contactName: 'no',
          city: 'no',
          country: 'no',
          address: 'no',
        },
        basketItems: [{
          id: 'BI101',
          name: 'Binocular',
          category1: 'Collectibles',
          category2: 'Accessories',
          price: price,
          itemType: Iyzipay.BASKET_ITEM_TYPE.VIRTUAL
        }]
      };


      Trip.findById(tripId, function (err, trip) {
        if (err)
          return callback(err)
        var request = {
          locale: Iyzipay.LOCALE.TR,
          conversationId: tripId.toString(),
          price: price,
          paidPrice: price,
          currency: Iyzipay.CURRENCY.USD,
          installment: '1',
          basketId: 'B67832',
          paymentChannel: Iyzipay.PAYMENT_CHANNEL.WEB,
          paymentGroup: Iyzipay.PAYMENT_GROUP.PRODUCT,
          paymentCard: {
            cardHolderName: cardHolderName,
            cardNumber: cardNumber,
            expireMonth: expireMonth,
            expireYear: expireYear,
            cvc: cvc,
            registerCard: '0'
          },
          buyer: {
            id: userId.toString(),
            name: user.username,
            surname: user.username,
            gsmNumber: user.phoneNumber,
            email: 'admin@admin.com',
            identityNumber: '123456789',
            lastLoginDate: '',
            registrationDate: '',
            registrationAddress: 'no',
            ip: '',
            city: 'no',
            country: 'no',
            zipCode: 'no'
          },
          billingAddress: {
            contactName: 'no',
            city: 'no',
            country: 'no',
            address: 'no',
          },
          basketItems: [{
            id: 'BI101',
            name: 'Binocular',
            category1: 'Collectibles',
            category2: 'Accessories',
            price: price,
            itemType: Iyzipay.BASKET_ITEM_TYPE.VIRTUAL
          }]
        };
        console.log(request);
        iyzipay.payment.create(request, function (err, result) {
          if (err)
            return callback(err)
          if (result.status != 'success')
            return callback(null, result);
          Trip.app.models.payments.create({
            "price": price,
            "tripId": tripId,
            "userId": userId
          }, function (err, payment) {
            if (err)
              return callback(err)
            return callback(null, payment);
          })
        });

      })
    })
  }

  function addPaymentTrip(tripId, cost, data, userId, callback) {
    Trip.app.models.user.findById(userId, function (err, user) {
      if (err)
        return callback(err)
      // var request = {
      //   locale: Iyzipay.LOCALE.TR,
      //   conversationId: '123456789',
      //   price: cost,
      //   paidPrice: cost,
      //   currency: Iyzipay.CURRENCY.USD,
      //   installment: '1',
      //   basketId: 'B67832',
      //   paymentChannel: Iyzipay.PAYMENT_CHANNEL.WEB,
      //   paymentGroup: Iyzipay.PAYMENT_GROUP.PRODUCT,
      //   paymentCard: {
      //     cardHolderName: data.cardHolderName,
      //     cardNumber: data.cardNumber,
      //     expireMonth: data.expireMonth,
      //     expireYear: data.expireYear,
      //     cvc: data.cvc,
      //     registerCard: '0'
      //   },
      //   buyer: {
      //     id: userId.toString(),
      //     name: user.username,
      //     surname: user.username,
      //     gsmNumber: user.phoneNumber,
      //     email: 'admin@admin.com',
      //     identityNumber: '123456789',
      //     lastLoginDate: '',
      //     registrationDate: '',
      //     registrationAddress: 'no',
      //     ip: '',
      //     city: 'no',
      //     country: 'no',
      //     zipCode: 'no'
      //   },
      //   billingAddress: {
      //     contactName: 'no',
      //     city: 'no',
      //     country: 'no',
      //     address: 'no',
      //   },
      //   basketItems: [{
      //     id: 'BI101',
      //     name: 'Binocular',
      //     category1: 'Collectibles',
      //     category2: 'Accessories',
      //     price: price,
      //     itemType: Iyzipay.BASKET_ITEM_TYPE.VIRTUAL
      //   }]
      // };


      Trip.findById(tripId, function (err, trip) {
        if (err)
          return callback(err)
        var request = {
          locale: Iyzipay.LOCALE.TR,
          conversationId: tripId.toString(),
          price: cost,
          paidPrice: cost,
          currency: Iyzipay.CURRENCY.USD,
          installment: '1',
          basketId: 'B67832',
          paymentChannel: Iyzipay.PAYMENT_CHANNEL.WEB,
          paymentGroup: Iyzipay.PAYMENT_GROUP.PRODUCT,
          paymentCard: {
            cardHolderName: data.cardHolderName,
            cardNumber: data.cardNumber,
            expireMonth: data.expireMonth,
            expireYear: data.expireYear,
            cvc: data.cvc,
            registerCard: '0'
          },
          buyer: {
            id: userId.toString(),
            name: user.username,
            surname: user.username,
            gsmNumber: user.phoneNumber,
            email: 'admin@admin.com',
            identityNumber: '123456789',
            lastLoginDate: '',
            registrationDate: '',
            registrationAddress: 'no',
            ip: '',
            city: 'no',
            country: 'no',
            zipCode: 'no'
          },
          billingAddress: {
            contactName: 'no',
            city: 'no',
            country: 'no',
            address: 'no',
          },
          basketItems: [{
            id: 'BI101',
            name: 'Binocular',
            category1: 'Collectibles',
            category2: 'Accessories',
            price: cost,
            itemType: Iyzipay.BASKET_ITEM_TYPE.VIRTUAL
          }]
        };
        console.log(request);
        iyzipay.payment.create(request, function (err, result) {
          if (err)
            return callback(err)
          if (result.status != 'success')
            return callback(errors.trip.paymentInfo())
          Trip.app.models.payments.create({
            "price": cost,
            "tripId": tripId,
            "userId": userId
          }, function (err, payment) {
            if (err)
              return callback(err)
            return callback(null, payment);
          })
        });

      })
    })
  }

  var request = {
    locale: Iyzipay.LOCALE.TR,
    conversationId: '123456789',
    price: '1.2',
    paidPrice: '1.2',
    currency: Iyzipay.CURRENCY.USD,
    installment: '1',
    basketId: 'B67832',
    paymentChannel: Iyzipay.PAYMENT_CHANNEL.WEB,
    paymentGroup: Iyzipay.PAYMENT_GROUP.PRODUCT,
    paymentCard: {
      cardHolderName: 'John Doe',
      cardNumber: '4054180000000007',
      expireMonth: '12',
      expireYear: '2030',
      cvc: '123',
      registerCard: '0'
    },
    buyer: {
      id: 'BY789',
      name: 'John',
      surname: 'Doe',
      gsmNumber: '+905350000000',
      email: 'email@email.com',
      identityNumber: '74300864791',
      lastLoginDate: '2015-10-05 12:43:35',
      registrationDate: '2013-04-21 15:12:09',
      registrationAddress: 'Nidakule Göztepe, Merdivenköy Mah. Bora Sok. No:1',
      ip: '85.34.78.112',
      city: 'Istanbul',
      country: 'Turkey',
      zipCode: '34732'
    },
    shippingAddress: {
      contactName: 'Jane Doe',
      city: 'Istanbul',
      country: 'Turkey',
      address: 'Nidakule Göztepe, Merdivenköy Mah. Bora Sok. No:1',
    },
    billingAddress: {
      contactName: 'Jane Doe',
      city: 'Istanbul',
      country: 'Turkey',
      address: 'Nidakule Göztepe, Merdivenköy Mah. Bora Sok. No:1',
    },
    basketItems: [{
      id: 'BI101',
      name: 'Binocular',
      category1: 'Collectibles',
      category2: 'Accessories',
      itemType: Iyzipay.BASKET_ITEM_TYPE.PHYSICAL,
      price: '1.2'
    }]
  };




  Trip.validatesInclusionOf('type', {
    in: ['city', 'fromAirport', 'toAirport', 'cityAndToAirport', 'fromAirportAndCity', 'fromAirportAndToAirport', 'fromAirportAndCityAndToAirport']
  });

  Trip.validatesInclusionOf('status', {
    in: ['pending', 'approved', 'active', 'deactive', 'finished']
  });

  Trip.beforeRemote('create', function (context, result, next) {
    var data = context.req.body;
    var withPayment = false
    if (context.req.body.ownerId == null)
      context.req.body.ownerId = context.req.accessToken.userId;
    if (context.req.body.withPayment == true) {
      context.req.tempBody = {}
      context.req.tempBody.withPayment = true;
      context.req.tempBody.paymentData = context.req.body.paymentData;
      delete context.req.body.paymentData;
      delete context.req.body.withPayment;
      context.req.body.isCompletedPayment = false
    }
    var bookingDate = fillDateOfBooking(data)
    context.req.body.startDate = bookingDate.start;
    context.req.body.endDate = bookingDate.end;

    data.type = bookingDate.type;

    cheackLocation(data.locationId, function (err) {
      if (err)
        return next(err)
      cheackCar(data.carId, data.type, bookingDate.where, null, function (err) {
        if (err)
          return next(err)
        context.req.body.costBeforCoupon = context.req.body.cost
        if (data['couponId'] == undefined)
          next();
        else {
          Trip.app.models.coupon.find({
            "where": {
              "id": data['couponId'],
              "status": "active",
              "from": {
                lt: new Date()
              },
              "to": {
                gt: new Date()
              }
            }
          }, function (err, oneCoupon) {
            if (err)
              return next(err)
            if (oneCoupon.length == 0)
              return next(errors.coupon.couponIsNotValid());
            oneCoupon[0].numberOfUsed++;
            if (oneCoupon[0].numberOfUsed == oneCoupon[0].numberOfUses)
              oneCoupon[0].status = "used"
            oneCoupon[0].save()
            var newCost = 0;
            if (oneCoupon[0].type == "fixed")
              newCost = context.req.body.costBeforCoupon - oneCoupon[0].value;
            else if (oneCoupon[0].type == "percentage")
              newCost = context.req.body.costBeforCoupon - (context.req.body.costBeforCoupon * oneCoupon[0].value / 100)
            context.req.body.cost = newCost;
            context.req.body.travelAgencyId = oneCoupon[0].travelAgencyId;
            Trip.app.models.travelAgency.findById(context.req.body.travelAgencyId, function (err, travelAgencyData) {
              if (err)
                return next()
              if (travelAgencyData == null)
                return next()
              context.req.body.travelAgencyDiscountType = travelAgencyData.type;
              context.req.body.travelAgencyDiscountValue = travelAgencyData.value;
              next()
            })
          })
        }
      })
    })
  })
  Trip.afterRemote('create', function (ctx, result, next) {
    console.log("ctx.req.tempBody");
    console.log(ctx.req.tempBody);
    var bookingData = prepareCarBooking(result);
    Trip.app.models.bookingCar.create(bookingData, function (err, data) {
      if (err)
        return next(err);
      _.each(ctx.req.body.tripSublocations, oneSublocation => {
        oneSublocation.tripId = result.id;
      })
      if (ctx.req.body.tripSublocations)
        Trip.app.models.tripSublocation.create(ctx.req.body.tripSublocations, function (err, data) {
          if (err)
            return next(err);
          if (ctx.req.tempBody) {
            addPaymentTrip(result.id, result.cost, ctx.req.tempBody.paymentData, result.ownerId, function (err, data) {
              if (err)
                return next(err);
              else {
                result.isCompletedPayment = true;
                result.save();
                return next();
              }
            })
          } else
            return next();
        })
      else {
        if (ctx.req.tempBody) {
          addPaymentTrip(result.id, result.cost, ctx.req.tempBody.paymentData, result.ownerId, function (err, data) {
            if (err)
              return next(err);
            else {
              result.isCompletedPayment = true;
              result.save();
              return next();
            }
          })
        } else
          return next();
      }

    })
  })



  function prepareCarBooking(data) {
    var fromAirportDate = data.fromAirportDate;
    var toAirportDate = data.toAirportDate;
    var startInCityDate = data.startInCityDate;
    var endInCityDate = data.endInCityDate;
    var bookingData = [];
    if (data.type == type[1]) {
      bookingData = [{
        "start": startInCityDate,
        "end": endInCityDate,
        "carId": data.carId,
        "tripId": data.id
      }]
      return bookingData;
    } else if (data.type == type[2]) {
      bookingData = [{
        "start": toAirportDate,
        "end": addHours(numHoure, toAirportDate),
        "carId": data.carId,
        "tripId": data.id
      }]
      return bookingData;
    } else if (data.type == type[5]) {
      bookingData = [{
        "start": startInCityDate,
        "end": addHours(numHoure, toAirportDate),
        "carId": data.carId,
        "tripId": data.id
      }]
      return bookingData;
    } else if (data.type == type[0]) {
      bookingData = [{
        "start": fromAirportDate,
        "end": addHours(numHoure, fromAirportDate),
        "carId": data.carId,
        "tripId": data.id
      }]
      return bookingData;
    } else if (data.type == type[3]) {
      bookingData = [{
        "start": fromAirportDate,
        "end": endInCityDate,
        "carId": data.carId,
        "tripId": data.id
      }]
      return bookingData;
    } else if (data.type == type[4]) {
      bookingData = [{
        "start": fromAirportDate,
        "end": addHours(numHoure, fromAirportDate),
        "carId": data.carId,
        "tripId": data.id
      }, {
        "start": toAirportDate,
        "end": addHours(numHoure, toAirportDate),
        "carId": data.carId,
        "tripId": data.id
      }]
      return bookingData;
    } else if (data.type == type[6]) {
      bookingData = [{
        "start": fromAirportDate,
        "end": addHours(numHoure, toAirportDate),
        "carId": data.carId,
        "tripId": data.id
      }]
      return bookingData;
    }
  }


  function fillDateOfBooking(data) {
    var fromAirport = data.fromAirport;
    var toAirport = data.toAirport;
    var inCity = data.inCity;
    var fromAirportDate = data.fromAirportDate;
    var toAirportDate = data.toAirportDate;
    var startInCityDate = data.startInCityDate;
    var endInCityDate = data.endInCityDate;
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
      }
      object.where = whereObject;
      object.type = type[1];
      object.start = startInCityDate
      object.end = endInCityDate
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
            "start": {
              "lt": addHours(numHoure, toAirportDate)
            }
          }
        ],
      }
      object.where = whereObject;
      object.type = type[2];
      object.start = toAirportDate
      object.end = addHours(numHoure, toAirportDate)
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
      object.start = startInCityDate
      object.end = addHours(numHoure, toAirportDate)

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
      object.start = fromAirportDate
      object.end = addHours(numHoure, fromAirportDate)
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
      object.start = fromAirportDate
      object.end = addHours(numHoure, endInCityDate)

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
      object.start = fromAirportDate
      object.end = addHours(numHoure, toAirportDate)

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
      object.start = fromAirportDate
      object.end = addHours(numHoure, toAirportDate)
      object.where = whereObject;
      return object;
    }
  }

  function cheackCar(carId, type, where, tripId, callback) {
    Trip.app.models.car.findById(carId, function (err, oneCar) {
      if (err)
        return callback(err)
      if (oneCar == null || oneCar.status == "deactive")
        return callback(errors.car.carNotFound());
      console.log("where");
      console.log(JSON.stringify(where));
      var mainWher = {}
      if (tripId != null)
        mainWher = {
          "where": {
            "and": [{
                "carId": carId
              },
              {
                "tripId": {
                  "neq": tripId
                }
              },
              {
                "or": where
              }
            ]
          }
        }
      else {
        mainWher = {
          "where": {
            "and": [{
                "carId": carId
              },
              {
                "or": where
              }
            ]
          }
        }
      }
      Trip.app.models.bookingCar.find(mainWher, function (err, data) {
        if (err)
          return callback(err)
        if (data[0] != null)
          return callback(errors.car.carNotAvailable())
        callback(null);

      })
    })
  }


  function cheackLocation(locationId, callback) {
    Trip.app.models.location.findById(locationId, function (err, oneLocation) {
      if (err)
        return callback(err)
      if (oneLocation == null || oneLocation.status == "deactive")
        return callback(errors.location.locationNotFound());

      return callback(null)
    })
  }

  function addHours(h, start) {
    console.log(start.toString())
    var date = new Date(start.toString());
    date.setHours(date.getHours() + h);
    console.log(date)
    return date
  }

  /**
   *
   * @param {object} req
   * @param {Function(Error, array)} callback
   */

  Trip.getMyTrip = function (req, callback) {
    Trip.find({
      where: {
        "ownerId": req.accessToken.userId
      }
    }, function (err, data) {
      if (err)
        return callback(err, null);
      callback(null, data);
    })
  };

  /**
   *
   * @param {string} id
   * @param {string} newStatus
   * @param {Function(Error, object)} callback
   */

  Trip.changeStatus = function (id, newStatus, callback) {
    var result;
    // TODO
    Trip.find({
        "where": {
          "id": id
        }
      },
      function (err, trip) {
        if (err)
          return callback(err)
        if (trip[0] == null)
          return callback(errors.trip.tripNotFound());
        trip[0].status = newStatus;
        trip[0].save();
        if (newStatus != 'finished') {
          callback(null, trip[0]);
        } else {
          console.log("send notification");
          Trip.app.models.userNotification.sendRateNotification(trip[0].ownerId, trip[0].id, trip[0].carId, function (err) {
            if (err)
              console.log(err)
            callback(null, trip[0]);
          })
        }
      })
  };


  Trip.solvedTrip = function (next) {
    Trip.find({}, function (err, data) {
      data.forEach(element => {
        console.log(element.type)
        if (element.type == type[1]) {
          element.startDate = element.startInCityDate
          element.endDate = element.endInCityDate
          element.save();
        } else if (element.type == type[2]) {
          element.startDate = element.toAirportDate
          element.endDate = addHours(numHoure, element.toAirportDate)
          element.save();
        } else if (element.type == type[5]) {
          element.startDate = element.startInCityDate
          element.endDate = addHours(numHoure, element.toAirportDate)
          element.save();
        } else if (element.type == type[0]) {
          element.startDate = element.fromAirportDate
          element.endDate = addHours(numHoure, element.fromAirportDate)
          element.save();
        } else if (element.type == type[3]) {
          element.startDate = element.fromAirportDate
          element.endDate = addHours(numHoure, element.endInCityDate)
          element.save();
        } else if (element.type == type[4]) {
          element.startDate = element.fromAirportDate
          element.endDate = addHours(numHoure, element.toAirportDate)
          element.save();
        } else if (element.type == type[6]) {
          element.startDate = element.fromAirportDate
          element.endDate = addHours(numHoure, element.toAirportDate)
          element.save();
        }
      });
    })
  }


  Trip.getEndByFilter = function (filter, callback) {
    var limit = 10;
    var sortKey = "createdAt"
    var where = []
    if (filter && filter['limit'] != null) {
      limit = filter['limit'];
      delete filter['limit']
    }
    if (filter && filter['sort'] != null) {
      sortKey = filter['sort']
      delete filter['sort']
    }

    var sortObject = "{\"" + sortKey + "\": -1}"
    console.log("sortObject")
    console.log(JSON.parse(sortObject))

    if (filter != {} && filter != undefined) {
      for (let index = 0; index < filter["$and"].length; index++) {
        const element = filter["$and"][index];
        if (element["endDate"] != null) {
          filter["$and"][index]["endDate"]["$gt"] = new Date(element["endDate"]["$gt"]);
        }
        if (element["startDate"] != null) {
          filter["$and"][index]["startDate"]["$lt"] = new Date(element["startDate"]["$lt"]);
        }
      }
      where = [{
          $project: {
            "_id": 0,
            "id": "$_id",
            "createdAt": 1,
            "value": 1,
            "carId": 1,
            "ownerId": 1,
            "locationId": 1,
            "driverId": 1,
            "status": 1,
            "type": 1,
            "cost": 1,
            "pricePerDay": 1,
            "priceOneWay": 1,
            "priceTowWay": 1,
            "daysInCity": 1,
            "fromAirportDate": 1,
            "fromAirport": 1,
            "toAirportDate": 1,
            "toAirport": 1,
            "startInCityDate": 1,
            "endInCityDate": 1,
            "inCity": 1,
            "hasOuterBill": 1,
            "hasInnerBill": 1,
            "rateId": 1,
            "endDate": 1,
            "startDate": 1
          }
        }, {
          $lookup: {
            from: "car",
            localField: "carId",
            foreignField: "_id",
            as: "car"
          }
        }, {
          $lookup: {
            from: "driver",
            localField: "driverId",
            foreignField: "_id",
            as: "driver"
          }
        }, {
          $lookup: {
            from: "location",
            localField: "locationId",
            foreignField: "_id",
            as: "location"
          }
        },
        {
          $lookup: {
            from: "user",
            localField: "ownerId",
            foreignField: "_id",
            as: "owner"
          }
        },
        {
          $lookup: {
            from: "rate",
            localField: "rateId",
            foreignField: "_id",
            as: "rate"
          }
        },
        {
          $unwind: "$owner"
        },
        {
          $unwind: "$car"
        },
        {
          $unwind: "$location"
        },
        {
          $unwind: "$driver"
        },
        {
          "$unwind": {
            path: "$rate",
            preserveNullAndEmptyArrays: true
          }
        },
        {
          $match: filter
        },
        {
          $sort: JSON.parse(sortObject)
        }
      ]
    } else {
      where = [{
          $project: {
            "_id": 0,
            "id": "$_id",
            "createdAt": 1,
            "value": 1,
            "carId": 1,
            "ownerId": 1,
            "locationId": 1,
            "driverId": 1,
            "status": 1,
            "type": 1,
            "cost": 1,
            "pricePerDay": 1,
            "priceOneWay": 1,
            "priceTowWay": 1,
            "daysInCity": 1,
            "fromAirportDate": 1,
            "fromAirport": 1,
            "toAirportDate": 1,
            "toAirport": 1,
            "startInCityDate": 1,
            "endInCityDate": 1,
            "inCity": 1,
            "hasOuterBill": 1,
            "hasInnerBill": 1,
            "rateId": 1

          }
        }, {
          $lookup: {
            from: "car",
            localField: "carId",
            foreignField: "_id",
            as: "car"
          }
        }, {
          $lookup: {
            from: "driver",
            localField: "driverId",
            foreignField: "_id",
            as: "driver"
          }
        }, {
          $lookup: {
            from: "location",
            localField: "locationId",
            foreignField: "_id",
            as: "location"
          }
        },
        {
          $lookup: {
            from: "user",
            localField: "ownerId",
            foreignField: "_id",
            as: "owner"
          }
        },
        {
          $lookup: {
            from: "rate",
            localField: "rateId",
            foreignField: "_id",
            as: "rate"
          }
        },
        {
          $unwind: "$owner"
        },
        {
          $unwind: "$car"
        },
        {
          $unwind: "$location"
        },
        {
          $unwind: "$driver"
        },
        {
          "$unwind": {
            path: "$rate",
            preserveNullAndEmptyArrays: true
          }
        }
      ]
    }
    Trip.getDataSource().connector.connect(function (err, db) {
      var collection = db.collection('trip');
      var cursor = collection.aggregate(where)
      cursor.get(function (err, data) {
        if (err) return callback(err);
        console.log("data.length");
        console.log(data.length);
        var skip = 0
        var count = data.length
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

        console.log(data.length)
        return callback(null, {
          "data": data.slice(skip, data.length),
          "count": count
        })
      })
    })

    // Trip.count({}, function (err, count) {
    //   console.log(count);
    //   var skip = 0
    //   if (limit < count) {
    //     var mod = count % limit;
    //     var div = parseInt(count / limit);
    //     console.log("mod");
    //     console.log(count / limit);
    //     if (mod == 0)
    //       skip = count - limit
    //     else
    //       skip = (div * limit);
    //   }


    // Trip.find({
    //   "skip": skip,
    //   "limit": limit
    // }, function (err, data) {
    //   callback(null, {
    //     "data": data,
    //     "count": count
    //   })
    // })

    // })
  };


  /**
   *
   * @param {string} id
   * @param {string} newStatus
   * @param {Function(Error, object)} callback
   */

  Trip.changemyTripStatus = function (id, newStatus, callback) {
    var result;
    // TODO
    Trip.find({
        "where": {
          "id": id
        }
      },
      function (err, trip) {
        if (err)
          return callback(err)
        console.log("trip")
        console.log(trip)
        if (trip[0] == null || trip[0].status == "deactive")
          return callback(errors.trip.tripNotFound());
        trip[0].status = newStatus;
        trip[0].save();
        callback(null, trip[0]);
      })
  };

  /**
   *
   * @param {object} data
   * @param {string} id
   * @param {Function(Error, object)} callback
   */

  Trip.editMethod = function (data, id, context, callback) {
    var data;
    Trip.findById(id, function (err, TripData) {
      if (err)
        return callback(err)

      if (data.ownerId == null)
        data.ownerId = context.req.accessToken.userId;

      var bookingDate = fillDateOfBooking(data)
      data.type = bookingDate.type;
      data.startDate = bookingDate.start;
      data.endDate = bookingDate.end;

      // userData.updateAttributes({

      cheackLocation(data.locationId, function (err) {
        if (err)
          return callback(err)
        cheackCar(data.carId, data.type, bookingDate.where, id, function (err) {
          if (err)
            return callback(err)
          deleteCarBooking(id, function (err) {
            if (err)
              return callback(err)

            deleteTripSubLocation(id, function (err) {
              if (err)
                return callback(err)
              console.log("Done")
              var newData = preperData(data);
              TripData.updateAttributes(newData, function (err, newTripData) {
                if (err)
                  return callback(err)
                var bookingData = prepareCarBooking(newTripData);
                Trip.app.models.bookingCar.create(bookingData, function (err, data) {
                  if (err)
                    return callback(err);

                  _.each(data.tripSublocations, oneSublocation => {
                    oneSublocation.tripId = newTripData.id;
                  })
                  console.log(data.tripSublocations)
                  if (data.tripSublocations)
                    Trip.app.models.tripSublocation.create(data.tripSublocations, function (err, data) {
                      if (err)
                        return callback(err);
                      callback(null, newTripData);
                    })
                  else {
                    callback(null, newTripData)
                  }

                })
              })
            })

          })
        })
      })
    })
  };

  function preperData(data) {
    var Data = {};
    Data['locationId'] = data['locationId'];
    Data['ownerId'] = data['ownerId'];
    Data['fromAirport'] = data['fromAirport'];
    Data['toAirport'] = data['toAirport'];
    Data['inCity'] = data['inCity'];
    Data['toAirportDate'] = data['toAirportDate'];
    Data['startInCityDate'] = data['startInCityDate'];
    Data['endInCityDate'] = data['endInCityDate'];
    Data['fromAirportDate'] = data['fromAirportDate'];
    Data['driverId'] = data['driverId'];
    Data['pricePerDay'] = data['pricePerDay'];
    Data['priceOneWay'] = data['priceOneWay'];
    Data['priceTowWay'] = data['priceTowWay'];
    Data['carId'] = data['carId'];
    Data['costBeforCoupon'] = data['costBeforCoupon'];
    Data['cost'] = data['cost'];
    Data['daysInCity'] = data['daysInCity'];
    Data['type'] = data['type'];
    return Data;
  }

  function deleteCarBooking(tripId, callback) {
    Trip.app.models.bookingCar.destroyAll({
      "tripId": tripId
    }, function (err, data) {
      if (err)
        return callback(err)
      callback(null)
    })
  }

  function deleteTripSubLocation(tripId, callback) {
    Trip.app.models.tripSublocation.destroyAll({
      "tripId": tripId
    }, function (err, data) {
      if (err)
        return callback(err)
      callback(null)
    })
  }


  function getData(filter, isCount, cb) {
    var limit = 10;
    var skip = 0;
    var sortKey = "createdAt"
    var where = []
    if (filter && filter['limit'] != null) {
      limit = filter['limit'];
      delete filter['limit']
    }
    if (filter && filter['skip'] != null) {
      skip = filter['skip'];
      delete filter['skip']
    }
    if (filter && filter['sort'] != null) {
      sortKey = filter['sort']
      delete filter['sort']
    }

    var sortObject = "{\"" + sortKey + "\": -1}"
    console.log("sortObject")
    console.log(JSON.parse(sortObject))
    if (filter != {} && filter != undefined) {
      for (let index = 0; index < filter["$and"].length; index++) {
        const element = filter["$and"][index];
        if (element["endDate"] != null) {
          console.log(element["endDate"]["$gt"])
          filter["$and"][index]["endDate"]["$gt"] = new Date(element["endDate"]["$gt"]);
        }
        if (element["startDate"] != null) {
          console.log(element["startDate"]["$lt"])
          filter["$and"][index]["startDate"]["$lt"] = new Date(element["startDate"]["$lt"]);
        }
      }
      if (isCount == false) {
        where = [{
            $project: {
              "_id": 0,
              "id": "$_id",
              "createdAt": 1,
              "value": 1,
              "carId": 1,
              "ownerId": 1,
              "locationId": 1,
              "driverId": 1,
              "status": 1,
              "type": 1,
              "cost": 1,
              "pricePerDay": 1,
              "priceOneWay": 1,
              "priceTowWay": 1,
              "daysInCity": 1,
              "fromAirportDate": 1,
              "fromAirport": 1,
              "toAirportDate": 1,
              "toAirport": 1,
              "startInCityDate": 1,
              "endInCityDate": 1,
              "inCity": 1,
              "hasOuterBill": 1,
              "hasInnerBill": 1,
              "endDate": 1,
              "startDate": 1,
              "rateId": 1,
              "couponId": 1,
              "travelAgencyId": 1,
              "travelAgencyDiscountValue": 1,
              "travelAgencyDiscountType": 1
            }
          }, {
            $lookup: {
              from: "coupon",
              localField: "couponId",
              foreignField: "_id",
              as: "coupon"
            }
          }, {
            $lookup: {
              from: "travelAgency",
              localField: "travelAgencyId",
              foreignField: "_id",
              as: "travelAgency"
            }
          }, {
            $lookup: {
              from: "car",
              localField: "carId",
              foreignField: "_id",
              as: "car"
            }
          }, {
            $lookup: {
              from: "driver",
              localField: "driverId",
              foreignField: "_id",
              as: "driver"
            }
          }, {
            $lookup: {
              from: "location",
              localField: "locationId",
              foreignField: "_id",
              as: "location"
            }
          },
          {
            $lookup: {
              from: "user",
              localField: "ownerId",
              foreignField: "_id",
              as: "owner"
            }
          },
          {
            $lookup: {
              from: "rate",
              localField: "rateId",
              foreignField: "_id",
              as: "rate"
            }
          },
          {
            $unwind: "$owner"
          },
          {
            $unwind: "$car"
          },
          {
            $unwind: "$location"
          },
          {
            $unwind: "$driver"
          },
          {
            "$unwind": {
              path: "$travelAgency",
              preserveNullAndEmptyArrays: true
            }
          },
          {
            "$unwind": {
              path: "$coupon",
              preserveNullAndEmptyArrays: true
            }
          },
          {
            "$unwind": {
              path: "$rate",
              preserveNullAndEmptyArrays: true
            }
          }, {
            $match: filter
          },
          {
            $sort: JSON.parse(sortObject)
          },
          {
            "$skip": skip
          }, {
            "$limit": limit
          }
        ]
        console.log(where);
      } else
        where = [{
            $project: {
              "_id": 0,
              "id": "$_id",
              "createdAt": 1,
              "value": 1,
              "carId": 1,
              "ownerId": 1,
              "locationId": 1,
              "driverId": 1,
              "status": 1,
              "type": 1,
              "cost": 1,
              "pricePerDay": 1,
              "priceOneWay": 1,
              "priceTowWay": 1,
              "daysInCity": 1,
              "fromAirportDate": 1,
              "fromAirport": 1,
              "toAirportDate": 1,
              "toAirport": 1,
              "startInCityDate": 1,
              "endInCityDate": 1,
              "inCity": 1,
              "hasOuterBill": 1,
              "hasInnerBill": 1,
              "endDate": 1,
              "startDate": 1,
              "rateId": 1,
            }
          }, {
            $lookup: {
              from: "car",
              localField: "carId",
              foreignField: "_id",
              as: "car"
            }
          }, {
            $lookup: {
              from: "driver",
              localField: "driverId",
              foreignField: "_id",
              as: "driver"
            }
          }, {
            $lookup: {
              from: "location",
              localField: "locationId",
              foreignField: "_id",
              as: "location"
            }
          },
          {
            $lookup: {
              from: "user",
              localField: "ownerId",
              foreignField: "_id",
              as: "owner"
            }
          },
          {
            $lookup: {
              from: "rate",
              localField: "rateId",
              foreignField: "_id",
              as: "rate"
            }
          },
          {
            $unwind: "$owner"
          },
          {
            $unwind: "$car"
          },
          {
            $unwind: "$location"
          },
          {
            $unwind: "$driver"
          },
          {
            "$unwind": {
              path: "$rate",
              preserveNullAndEmptyArrays: true
            }
          }, {
            $match: filter
          },
          {
            $count: "count"
          }
        ]
    }
    Trip.getDataSource().connector.connect(function (err, db) {
      var collection = db.collection('trip');
      var cursor = collection.aggregate(where)
      cursor.get(function (err, data) {
        if (err) return cb(err);
        return cb(null, data);
      })
    })
  }

  Trip.getTripByFilter = function (filter, callback) {
    getData(filter, false, function (err, data) {
      if (err)
        return callback(err, null)
      getData(filter, true, function (err, count) {
        if (err)
          return callback(err, null)
        callback(err, {
          "data": data,
          "count": count[0] != null ? count[0].count : 0
        });
      })
    })
  };


  /**
   *
   * @param {string} tripId
   * @param {string} couponId
   * @param {Function(Error, number)} callback
   */

  Trip.editTripCoupon = function (tripId, couponId, callback) {
    var code = 200;
    Trip.findById(tripId, function (err, trip) {
      if (err)
        return callback(err)
      var mainCouponId = trip.couponId;
      console.log(trip);
      console.log("mainCouponId");
      console.log(mainCouponId);
      console.log("couponId");
      console.log(couponId);
      if (mainCouponId == couponId) {
        console.log("no thing")
        return callback();
      } else if (mainCouponId == undefined && couponId != undefined) {
        console.log("new Coupon")
        Trip.app.models.coupon.find({
          "where": {
            "id": couponId,
            "status": "active",
            "from": {
              lt: new Date()
            },
            "to": {
              gt: new Date()
            }
          },
        }, function (err, oneCoupon) {
          if (err)
            return callback(err)
          if (oneCoupon.length == 0)
            return callback(errors.coupon.couponIsNotValid());
          oneCoupon[0].numberOfUsed++;
          if (oneCoupon[0].numberOfUsed == oneCoupon[0].numberOfUses)
            oneCoupon[0].status = "used"
          oneCoupon[0].save()
          var newCost = 0;
          if (oneCoupon[0].type == "fixed")
            newCost = trip.costBeforCoupon - oneCoupon[0].value;
          else if (oneCoupon[0].type == "percentage")
            newCost = trip.costBeforCoupon - (trip.costBeforCoupon * oneCoupon[0].value / 100)
          trip.updateAttributes({
            "cost": newCost,
            "travelAgencyId": oneCoupon[0].travelAgencyId,
            "couponId": couponId
          })
          return callback()
        })

      } else if (mainCouponId != undefined && couponId == undefined) {
        console.log("delete Coupon")
        Trip.app.models.coupon.findById(mainCouponId, function (err, coupon) {
          if (err)
            return callback(err)
          coupon.numberOfUsed--;
          if (coupon.status == "used")
            coupon.status = "active"
          coupon.save();
          var newCost = trip.costBeforCoupon
          trip.updateAttributes({
            "cost": newCost,
            "travelAgencyId": null,
            "couponId": null
          })
          return callback()
        })
      } else {
        console.log("change Coupon")
        Trip.app.models.coupon.findById(mainCouponId, function (err, coupon) {
          if (err)
            return callback(err)
          coupon.numberOfUsed--;
          if (coupon.status == "used")
            coupon.status = "active"
          coupon.save();
          Trip.app.models.coupon.find({
            "where": {
              "id": couponId,
              "status": "active",
              "from": {
                lt: new Date()
              },
              "to": {
                gt: new Date()
              }
            },
          }, function (err, oneCoupon) {
            if (err)
              return callback(err)
            if (oneCoupon.length == 0)
              return callback(errors.coupon.couponIsNotValid());
            oneCoupon[0].numberOfUsed++;
            if (oneCoupon[0].numberOfUsed == oneCoupon[0].numberOfUses)
              oneCoupon[0].status = "used"
            oneCoupon[0].save()
            var newCost = 0;
            if (oneCoupon[0].type == "fixed")
              newCost = trip.costBeforCoupon - oneCoupon[0].value;
            else if (oneCoupon[0].type == "percentage")
              newCost = trip.costBeforCoupon - (trip.costBeforCoupon * oneCoupon[0].value / 100)
            trip.updateAttributes({
              "cost": newCost,
              "travelAgencyId": oneCoupon[0].travelAgencyId,
              "couponId": couponId
            })
            return callback()
          })
        })
      }
    })
  };


};
