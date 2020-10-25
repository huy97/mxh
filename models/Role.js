const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const roleSchema = new Schema({
    roleId: {type: Number, auto: true, unique: true},
    description: {type: String, default: ""},
    permissionCodes: {type: Array, default: []}
}, {
    timestamps: true
});

roleSchema.index({
    roleId: 1
});

module.exports = mongoose.model('Role', roleSchema);
