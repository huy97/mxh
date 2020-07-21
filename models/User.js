const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const userSchema = new Schema({
    fullName: {type: String, default: ""},
    uid: {type: String, default: "", unique: true},
    email: {type: String, default: "", unique: true},
    accessToken: {type: String, default: ""},
    refreshToken: {type: String, default: ""},
    avatar: {type: String, default: ""},
    address: {
        province:  {type: Object},
        district:  {type: Object},
        subDistrict:  {type: Object},
        addressDetail: {type: String}
    }
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