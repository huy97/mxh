const formidable = require('formidable');
const slugify = require('slugify');
const fs = require('fs');
const { validationResult } = require("express-validator");
const { baseResponse, getFileType } = require("../../utils/helper");
const { set, get } = require("../../utils/redis");
const User = require('../../models/User');
const { MEDIA_TYPE } = require('../../utils/constant');

const me = async (req, res, next) => {
    baseResponse.json(res, 200, 'Thành công.', {
        user: req.user
    });
}

const getUserInfo = async (req, res, next) => {
    try{
        const {id} = req.params;
        let user = JSON.parse(await get(id));
        if(!user){
            user = await User.findById(id, {password: 0, accessToken: 0, refreshToken: 0});
            set(id, JSON.stringify(user));
        }
        if(!user){
            baseResponse.error(res, 404, 'User không tồn tại.');
            return;
        }
        baseResponse.json(res, 200, 'Thành công.', {
            user
        });
    }catch(e){
        logger.error(e);
        baseResponse.error(res);
    }
}

const updateUserInfo = async (req, res, next) => {
    try{
        const {id} = req.params;
        const {fullName, email, notification} = req.body;
        const { addressDetail = "" } = req.body.address;
        if(req.user.id !== id){
            baseResponse.error(res, 403, 'Bạn không có quyền thao tác chức năng này.');
            return;
        }
        const errors = validationResult(req);
        if(!errors.isEmpty()){
            baseResponse.error(res, 422, 'Vui lòng nhập đủ thông tin.', errors.array());
            return;
        }
        const updated = await User.findByIdAndUpdate(id, {
            fullName,
            email,
            notification,
            address: {
                province: req.province,
                district: req.district,
                subDistrict: req.subDistrict,
                addressDetail
            }
        }, {
            new: true
        });
        set(id, JSON.stringify(updated));
        baseResponse.json(res, 200, 'Thành công', {
            user: updated
        });
    }catch(e){
        logger.error(e);
        baseResponse.error(res);
    }
}

const updateUserAvatar = async (req, res, next) => {
    try{
        const {id} = req.params;
        if(req.user.id !== id){
            console.log(req.user);
            baseResponse.error(res, 403, 'Bạn không có quyền thao tác chức năng này.');
            return;
        }
        const form = formidable({maxFileSize: 1024 * 1024});
        form.parse(req, async (err, fields, files) => {
            if(err) throw Error();
            if(!files.file.size){
                baseResponse.error(res, 422, 'Vui lòng nhập đủ thông tin.', [
                    {
                        "location": "body",
                        "param": "file",
                        "msg": "Vui lòng chọn file upload."
                    }
                ]);
                return;
            }
            if(getFileType(files.file) !== MEDIA_TYPE.IMAGE){
                baseResponse.error(res, 422, 'Vui lòng nhập đủ thông tin.', [
                    {
                        "location": "body",
                        "param": "file",
                        "msg": "Vui lòng chọn đúng định dạng file ảnh."
                    }
                ]);
                return;
            }
            form.uploadDir = "static/images";
            const tmpPath = files.file.path;
            const newPath = form.uploadDir + '/' + id + '_' + slugify(files.file.name);
            fs.rename(tmpPath, newPath, async (err) => {
                let uri = `https://${req.get('host')}${newPath.replace('static', '')}`;
                if (err) throw Error();
                const updated = await User.findByIdAndUpdate(id, {
                    avatar: uri
                }, {
                    new: true
                });
                set(id, JSON.stringify(updated));
                baseResponse.json(res, 200, 'Thành công', {
                    user: updated
                });
            });
        });
    }catch(e){
        logger.error(e);
        baseResponse.error(res);
    }
}

module.exports = {
    me,
    getUserInfo,
    updateUserInfo,
    updateUserAvatar
}