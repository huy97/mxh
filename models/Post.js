const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const postSchema = new Schema({
    content: {type: String, default: ""},
}, {
    timestamps: true
});

postSchema.index({
    user_id: 1
});

module.exports = mongoose.model('Post', postSchema);