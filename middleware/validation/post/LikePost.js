const { body } = require("express-validator");
const { EMOJI_TYPE } = require("../../../utils/constant");

const LikePost = [
    body('emojiType').notEmpty().withMessage('Vui lòng chọn hành động.')
        .isInt().withMessage('Tham số không hợp lệ.')
        .custom((value) => {
            if(![EMOJI_TYPE.ANGRY, EMOJI_TYPE.HAHA, EMOJI_TYPE.HAPPY, EMOJI_TYPE.LIKE, EMOJI_TYPE.SAD].includes(value)) return Promise.reject('Tham số không đúng.')
            return true;
        })
];

module.exports = LikePost;