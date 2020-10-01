const mongoose = require('mongoose');
const { NOTIFICATION_TYPE } = require('../utils/constant');
const Schema = mongoose.Schema;

const notificationSchema = new Schema({
    title: {type: String, default: ""},
    content: {type: String, default: ""},
    userId: {type: mongoose.Types.ObjectId},
    type: {type: String, default: NOTIFICATION_TYPE.DEFAULT},
    data: {type: Object, default: null}
}, {
    timestamps: true
});

notificationSchema.index({
    userId: 1,
    _id: -1
});

module.exports = mongoose.model('Notification', notificationSchema);