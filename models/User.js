const mongoose = require('mongoose');
const { DEFAULT_AVATAR, DEFAULT_COVER } = require('../utils/constant');
const Schema = mongoose.Schema;

const userSchema = new Schema({
    fullName: {type: String, default: "", required: true},
    uid: {type: String, default: "", unique: true},
    email: {type: String, default: ""},
    accessToken: {type: String, default: "", required: true},
    refreshToken: {type: String, default: "", required: true},
    avatar: {type: String, default: DEFAULT_AVATAR},
    cover: {type: String, default: DEFAULT_COVER},
    address: {
        province:  {type: Object},
        district:  {type: Object},
        subDistrict:  {type: Object},
        addressDetail: {type: String}
    },
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