const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const conversationSchema = new Schema({
    title: {type: String, default: ""},
    color: {type: String, default: ""},
    isGroup: {type: Boolean, default: false}
}, {
    timestamps: true
});

conversationSchema.index({
    updatedAt: 1
});

module.exports = mongoose.model('Conversation', conversationSchema);