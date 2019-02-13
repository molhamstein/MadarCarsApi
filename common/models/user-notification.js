'use strict';

const configPath = process.env.NODE_ENV === undefined ?
  '../../server/config.json' :
  `../../server/config.${process.env.NODE_ENV}.json`;
const config = require(configPath);


var FCM = require('fcm-node');
var serverKey = config.serverKey; //put your server key here
var senderId = config.senderId; //put your server key here
var fcm = new FCM(serverKey);

module.exports = function (Usernotification) {
  Usernotification.validatesInclusionOf('type', {
    in: ['rate']
  });

  Usernotification.sendRateNotification = function (userId, tripId,carId, callback) {

    Usernotification.create({
      "type": "rate",
      "userId": userId,
      "tripId": tripId
    }, function (err, data) {
      if (err)
        return callback(err)

      Usernotification.app.models.firbaseToken.find({
        "where": {
          "ownerId": userId
        }
      }, function (err, data) {
        if (err)
          return callback(err)
        if (data.length == 0) {
          return callback(null);
        }
        for (let index = 0; index < data.length; index++) {
          const element = data[index];
          console.log("element.token");
          console.log(element.token);
          console.log("senderId")
          console.log(senderId)

          var message = {
            to: element.token,
            collapse_key: "626269671729",

            notification: {
              title: 'Your trip has completed successfully',
              body: 'Give us your opinion on the tour',
              click_action: "FLUTTER_NOTIFICATION_CLICK"

            },

            data: {
              "tripId": tripId,
              "carId": carId,
              "openActivity": "rating"
            }
          };

          fcm.send(message, function (err, response) {
            if (err) {
              console.log("Something has gone wrong!");
              console.log(err);
              if (index == data.length - 1)
                return callback(err)
            } else {
              console.log("Successfully sent with response: ", response);
              if (index == data.length - 1)
                return callback(null)
            }
          });
        }
      })


    })

  }
  // testNot();

  function testNot() {

    var message = {
      to: "cx3OWAyYBUw:APA91bENHhiT5HOZIIMWRc8pH-1b-7effLX95rlyRqphKDN8UqCLWHJIv_uoPcYMoBsc9qMEZ8O5-3TU60WIc8VAvdvXfjLcqrvNulVet_IBzHKp5RvBRx1T8YxiO-j0YPSHvUAoVA1j",
      collapse_key: "626269671729",

      notification: {
        title: 'Your trip has completed successfully',
        body: 'Give us your opinion on the tour',
        click_action: "FLUTTER_NOTIFICATION_CLICK"
      },

      data: {
        "tripId": "5c62a01f114920078cf7d456",
        "carId": "5c58275d8091d637d0214519",
        "openActivity": "rating"
      }
    };

    fcm.send(message, function (err, response) {
      if (err) {
        console.log("Something has gone wrong!");
        console.log(err);
        // if (index == data.length - 1)
        //   return callback(err)
      } else {
        console.log("Successfully sent with response: ", response);
        // if (index == data.length - 1)
        //   return callback(null)
      }
    });

  }

};
