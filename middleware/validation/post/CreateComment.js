const { body } = require("express-validator");

const CreateComment = [
    body('content').notEmpty().withMessage("Vui lòng nhập nội dung.")
];

module.exports = CreateComment;