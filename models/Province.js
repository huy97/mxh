const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const provinceSchema = new Schema({
    name: {type: String, default: ""},
    fullName: {type: String, default: ""},
    code: {type: String, default: ""},
}, {
    timestamps: true
});

provinceSchema.index({
    code: 1,
    fullName: 'text',
}, {
    weights: {
        fullName: 1,
    },
});

module.exports = mongoose.model('Province', provinceSchema);