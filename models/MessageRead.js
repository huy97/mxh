const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const messageReadSchema = new Schema({
    conversationId: {type: mongoose.Types.ObjectId, required: true},
    messageId: {type: mongoose.Types.ObjectId, required: true},
    userId: {type: mongoose.Types.ObjectId, required: true}
}, {
    timestamps: true
});

messageReadSchema.index({
    messageId: 1,
    userId: 1
});

module.exports = mongoose.model('MessageRead', messageReadSchema, "message_reads");