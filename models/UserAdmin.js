const mongoose = require('mongoose');
const { DEFAULT_COVER, GENDER } = require('../utils/constant');
const { getStaticUrl } = require('../utils/helper');
const Schema = mongoose.Schema;

const userSchema = new Schema({
    fullName: {type: String, default: "", required: true},
    username: {type: String, default: "", unique: true},
    password: {type: String, default: ""},
    accessToken: {type: String, default: ""},
    fcmToken: {type: String, default: ""},
    avatar: {type: String, default: ""},
    address: {
        province:  {type: Object},
        district:  {type: Object},
        subDistrict:  {type: Object},
        addressDetail: {type: String}
    },
    gender: {type: Number, default: GENDER.UNKNOWN},
    birthday: {type: Number, default: null},
}, {
    timestamps: true
});

userSchema.index({
    uid: 1,
    accessToken: 1
});

userSchema.index({
    fullName: 'text',
}, {
    weights: {
        fullName: 1,
    },
});

module.exports = mongoose.model('UserAdmin', userSchema);