const { body } = require("express-validator");
const Province = require('../../../models/Province');
const District = require('../../../models/District');
const SubDistrict = require('../../../models/SubDistrict');

const UpdateUser = [
    body('fullName').notEmpty().withMessage('Họ tên đầy đủ không được để trống.'),
    body('email').optional().isEmail().withMessage('Địa chỉ email không hợp lệ.'),
    body('notification').optional().isBoolean().withMessage('Tham số không hợp lệ.'),
    body('address.provinceId').custom(async (code, {req}) => {
        if(code){
            const province = await Province.findOne({code});
            req.province = province;
            if(!province) return Promise.reject('Tỉnh/Thành phố không tồn tại.');
        }
        return true;
    }),
    body('address.districtId').custom(async (code, {req}) => {
        const {provinceId} = req.body.address;
        if(code){
            const district = await District.findOne({code, parentCode: provinceId});
            req.district = district;
            if(!district) return Promise.reject('Quận/Huyện không tồn tại.');
        }
        return true;
    }),
    body('address.subDistrictId').custom(async (code, {req}) => {
        const {districtId} = req.body.address;
        if(code){
            const subDistrict = await SubDistrict.findOne({code, parentCode: districtId});
            req.subDistrict = subDistrict;
            if(!subDistrict) return Promise.reject('Phường/xã không tồn tại.');
        }
        return true;
    }),
];

module.exports = UpdateUser;