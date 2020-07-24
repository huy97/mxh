const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const postMediaSchema = new Schema({
    postId: {type: mongoose.Types.ObjectId, required: true},
    size: {type: Number, required: true},
    path: {type: String, required: true},
    name: {type: String, required: true},
    type: {type: String, required: true},
    source: {type: String, required: true},
}, {
    timestamps: true
});

postMediaSchema.index({
    postId: 1
});

module.exports = mongoose.model('PostMedia', postMediaSchema);