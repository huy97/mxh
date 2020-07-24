const mongoose = require('mongoose');
const { DEFAULT_AVATAR, DEFAULT_COVER, GENDER } = require('../utils/constant');
const { getStaticUrl } = require('../utils/helper');
const Schema = mongoose.Schema;

const userSchema = new Schema({
    fullName: {type: String, default: "", required: true},
    uid: {type: String, default: "", unique: true},
    email: {type: String, default: ""},
    accessToken: {type: String, default: "", required: true},
    refreshToken: {type: String, default: "", required: true},
    socketId: {type: String, default: ""},
    fcmToken: {type: String, default: ""},
    avatar: {type: String, default: getStaticUrl(DEFAULT_AVATAR)},
    cover: {type: String, default: getStaticUrl(DEFAULT_COVER)},
    address: {
        province:  {type: Object},
        district:  {type: Object},
        subDistrict:  {type: Object},
        addressDetail: {type: String}
    },
    gender: {type: Number, default: GENDER.UNKNOWN},
    birthday: {type: Number, default: null},
    notification: {type: Boolean, default: false}
}, {
    timestamps: true
});

userSchema.index({
    uid: 1,
    accessToken: 1,
    fullName: 'text',
}, {
    weights: {
        fullName: 1,
    },
});

module.exports = mongoose.model('User', userSchema);