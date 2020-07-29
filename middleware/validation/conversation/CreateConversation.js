const { body } = require("express-validator");
const User = require("../../../models/User");

const CreateConversation = [
    body('users').custom((users) => {
        if(!Array.isArray(users) || !users.length){
            return Promise.reject('Vui lòng chọn người nhận.')
        }
        return true;
    }),
    body('users.*').custom(async (userId, {req}) => {
        if(req.user.id === userId) return Promise.reject('Không thể gửi tin nhắn cho chính bạn');
        const user = await User.findById(userId);
        if(!user) return Promise.reject('User không tồn tại.');
        return true;
    }),
    // body('title').notEmpty().withMessage('Vui lòng nhập tiêu đề.')
];

module.exports = CreateConversation;