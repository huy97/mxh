const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const districtSchema = new Schema({
    name: {type: String, default: ""},
    fullName: {type: String, default: ""},
    code: {type: String, default: ""},
    parentCode: {type: String, default: ""}
}, {
    timestamps: true
});

districtSchema.index({
    code: 1,
    fullName: 'text',
}, {
    weights: {
        fullName: 1,
    },
});

module.exports = mongoose.model('District', districtSchema);