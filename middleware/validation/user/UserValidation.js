const { check, param } = require("express-validator");
const {isEmail} = require('../../../utils/helper');

const updateUserInfo = [
    check('fullName').notEmpty().withMessage('Họ tên đầy đủ không được để trống.'),
    check('email').custom((value) => {
        if(value && !isEmail(value)){
            return Promise.reject('Địa chỉ email không hợp lệ.')
        }
        return true;
    }),
    check('notification').custom((value) => {
        if(value !== null && value !== undefined && typeof value !== "boolean"){
            return Promise.reject('Tham số không hợp lệ.')
        }
        return true;
    }),
];

module.exports = {
    updateUserInfo
}