const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const conversationSchema = new Schema({
    title: {type: String, default: "", required: true},
    color: {type: String, default: ""},
    isGroup: {type: Boolean, default: false}
}, {
    timestamps: true
});

module.exports = mongoose.model('Conversation', conversationSchema);