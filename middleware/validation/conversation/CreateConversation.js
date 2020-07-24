const { body } = require("express-validator");
const User = require("../../../models/User");
const { isEmpty } = require("../../../utils/helper");

const CreateConversation = [
    body('isGroup').optional().isBoolean().withMessage('Tham số không hợp lệ.'),
    body('title').optional().custom((value, {req}) => {
        if(req.body.isGroup && isEmpty(value)) return Promise.reject('Vui lòng nhập tiêu đề.');
        return true;
    }),
    body('users').custom((users) => {
        if(!Array.isArray(users) || !users.length){
            return Promise.reject('Vui lòng chọn người nhận.')
        }
    }),
    body('users.*').custom(async (userId) => {
        const user = await User.findById(userId);
        if(!user) return Promise.reject('User không tồn tại.');
        return true;
    })
];

module.exports = CreateConversation;