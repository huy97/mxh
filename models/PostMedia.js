const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const postMediaSchema = new Schema({
    postId: {type: mongoose.Types.ObjectId},
    size: {type: Number},
    path: {type: String},
    name: {type: String},
    type: {type: String},
    source: {type: String},
}, {
    timestamps: true
});

postMediaSchema.index({
    postId: 1
});

module.exports = mongoose.model('PostMedia', postMediaSchema);