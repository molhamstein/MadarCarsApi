'use strict';

const configPath = process.env.NODE_ENV === undefined ?
  '../../server/config.json' :
  `../../server/config.${process.env.NODE_ENV}.json`;
const config = require(configPath);


var FCM = require('fcm-node');
var serverKey = config.serverKey; //put your server key here
var fcm = new FCM(serverKey);

module.exports = function (Usernotification) {
  Usernotification.validatesInclusionOf('type', { in: ['rate']
  });

  function sendRateNotification(userId, tripId, callback) {

    Usernotification.create({
      "type": "rate",
      "userId": userId,
      "tripId": tripId
    }, function (err, data) {
      if (err)
        return callback(err)
      Usernotification.app.models.Firbasetoken.find({
        "where": {
          "userId": userId
        }
      }, function (err, data) {
        if (err)
          return callback(err)

        for (let index = 0; index < data.length; index++) {
          const element = data[index];


          var message = {
            to: element.token,
            collapse_key: config.senderId,

            notification: {
              title: 'Your trip has completed successfully',
              body: 'Give us your opinion on the tour',
              click_action: "rating"

            },

            data: {
              "orderId": tripId,
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

};
