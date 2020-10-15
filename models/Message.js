const mongoose = require('mongoose');
const { MESSAGE_STATUS } = require('../utils/constant');
const Schema = mongoose.Schema;

const messageSchema = new Schema({
    conversationId: {type: mongoose.Types.ObjectId, required: true},
    from: {type: Object, required: true},
    to: {type: Array, required: true},
    message: {type: String, default: "", trim: true},
    status: {type: String, default: MESSAGE_STATUS.SENT},
    attachments: {type: Array}
}, {
    timestamps: true
});

messageSchema.index({
    conversationId: 1,
    _id: -1
});

module.exports = mongoose.model('Message', messageSchema);