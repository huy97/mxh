const admin = require("firebase-admin");

const serviceAccount = require("../serviceKey.json");
const { isNullOrUndefined } = require("../utils/helper");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://mxh-example.firebaseio.com"
});


const sendToMultipleDevice = async (fcmTokens = [], notification, data, image = false) => {
  const message = {
    data: data,
    notification: notification,
    tokens: fcmTokens.filter((token) => !isNullOrUndefined(token) && token.length),
  }
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
  return admin.messaging().sendMulticast(message);
}

module.exports = {
    admin,
    sendToMultipleDevice
}