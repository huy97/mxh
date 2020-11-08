const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const version = new Schema({
    versionId: mongoose.ObjectId,
    versionCode: Number,
    versionName: {type: String, default: ""},
    os: Number,
    desc: {type: String, default: ""},
    isUpdate: Number,
}, {
    timestamps: true
});

version.index({
    versionId: 1,
    versionCode: 1,
});

module.exports = mongoose.model('Version', version);
