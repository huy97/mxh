const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const permissionSchema = new Schema({
    permissionCode: {type: String, unique: true},
    permissionDesc: {type: String, default: ""},
}, {
    timestamps: true
});

permissionSchema.index({
    permissionCode: 1
});

module.exports = mongoose.model('Permission', permissionSchema);
