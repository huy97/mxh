const admin = require("firebase-admin");

const serviceAccount = require("../serviceKey.json");
const { isNullOrUndefined, logger } = require("../utils/helper");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});


const sendToMultipleDevice = async (fcmTokens = [], notification, data) => {
  const listFcmTokens = fcmTokens.filter((token) => !isNullOrUndefined(token) && token.length);
  if(!listFcmTokens.length) return;
  const message = {
    data: data,
    notification: {
      ...notification,
      sound: "default"
    }
  }
  logger.info("Send notification: " + JSON.stringify(fcmTokens));
  logger.info("Message: " + JSON.stringify(message));
  return admin.messaging().sendToDevice(listFcmTokens, message);
}

module.exports = {
    admin,
    sendToMultipleDevice
}