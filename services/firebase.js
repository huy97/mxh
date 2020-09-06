const admin = require("firebase-admin");

const serviceAccount = require("../serviceKey.json");
const { isNullOrUndefined, logger } = require("../utils/helper");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});


const sendToMultipleDevice = async (fcmTokens = [], notification, data, image = false) => {
  const message = {
    data: data,
    notification: notification,
    tokens: fcmTokens.filter((token) => !isNullOrUndefined(token) && token.length),
  }
  logger.info("Send notification: " + JSON.stringify(fcmTokens));
  if(image){
    message.apns = {
      payload: {
        aps: {
          'mutable-content': true
        }
      },
      fcm_options: {
        image
      },
    }

    message.android = {
      notification: {
        image
      }
    }
  }
  logger.info("Message: " + JSON.stringify(message));
  return admin.messaging().sendMulticast(message);
}

module.exports = {
    admin,
    sendToMultipleDevice
}