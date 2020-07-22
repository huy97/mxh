const mongoose = require('mongoose');
const { COMMENT_TYPE } = require('../utils/constant');
const Schema = mongoose.Schema;

const postCommentSchema = new Schema({
    postId: {type: mongoose.Types.ObjectId},
    userId: {type: mongoose.Types.ObjectId},
    content: {type: String, default: ""},
    type: {type: String, default: COMMENT_TYPE.COMMENT},
    reply: {type: Number, default: 0},
    parentId: {type: mongoose.Types.ObjectId}
}, {
    timestamps: true
});

postCommentSchema.index({
    postId: 1,
    userId: 1
});

module.exports = mongoose.model('PostComment', postCommentSchema);