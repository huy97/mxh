const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const conversationUserSchema = new Schema({
    conversationId: {type: mongoose.Types.ObjectId, required: true},
    userId: {type: mongoose.Types.ObjectId, required: true},
    isManager: {type: Boolean, default: false}
}, {
    timestamps: true
});

conversationUserSchema.index({
    conversationId: 1,
    userId: 1
});

conversationUserSchema.index({
    userId: 1,
    updatedAt: -1
});

module.exports = mongoose.model('ConversationUser', conversationUserSchema, "conversation_users");