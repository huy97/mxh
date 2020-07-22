const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const postLikeSchema = new Schema({
    postId: {type: mongoose.Types.ObjectId},
    userId: {type: mongoose.Types.ObjectId},
    emojiType: {type: Number, default: 1}
}, {
    timestamps: true
});

postLikeSchema.index({
    postId: 1,
    userId: 1
});

module.exports = mongoose.model('PostLike', postLikeSchema);