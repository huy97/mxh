const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const UserAdminRole = new Schema({
    roleId: {type: Number, auto: true, unique: true},
    description: {type: String, default: ""},
    permissionCodes: {type: Array, default: []}
 } , {
    timestamps: true
});

module.exports = mongoose.model('UserAdminRole', UserAdminRole);