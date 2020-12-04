const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const postSchema = new Schema({
    title: {type: String, default: ""},
    content: {type: String, default: "", required: true, trim: true},
    userId: {type: mongoose.Types.ObjectId, required: true},
    comment: {type: Number, default: 0},
    reply: {type: Number, default: 0},
    isShow: {type: Boolean, default: true}
}, {
    timestamps: true
});

postSchema.index({
    userId: 1,
    updatedAt: -1
});

module.exports = mongoose.model('Post', postSchema);