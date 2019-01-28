'use strict';


module.exports = function (Adminnotification) {
  /**
   *
   * @param {Function(Error, number)} callback
   */

  Adminnotification.validatesInclusionOf('type', { in: ['help']
  });

  Adminnotification.needHelp = function (context, callback) {
    var code = 200;
    Adminnotification.create({
      "userId": context.req.accessToken.userId,
      "type": "help"
    }, function (err, data) {
      if (err)
        return callback(err)
        
      callback(null, code)
    })
  };
};
