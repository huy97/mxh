const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const subDistrictSchema = new Schema({
    name: {type: String, default: ""},
    fullName: {type: String, default: ""},
    code: {type: String, default: ""},
    parentCode: {type: String, default: ""}
}, {
    timestamps: true
});

subDistrictSchema.index({
    code: 1,
    fullName: 'text',
}, {
    weights: {
        fullName: 1,
    },
});

module.exports = mongoose.model('SubDistrict', subDistrictSchema);