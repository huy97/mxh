const mongoose = require('mongoose');
const { COMMENT_TYPE } = require('../utils/constant');
const Schema = mongoose.Schema;

const postCommentSchema = new Schema({
    postId: {type: mongoose.Types.ObjectId, required: true},
    userId: {type: mongoose.Types.ObjectId, required: true},
    content: {type: String, default: "", required: true, trim: true},
    type: {type: String, default: COMMENT_TYPE.COMMENT, required: true},
    reply: {type: Number, default: 0},
    parentId: {type: mongoose.Types.ObjectId}
}, {
    timestamps: true
});

postCommentSchema.index({
    postId: 1,
    userId: 1
});

postCommentSchema.index({
    parentId: 1,
    _id: -1
});

module.exports = mongoose.model('PostComment', postCommentSchema, "post_comments");