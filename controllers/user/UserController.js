const formidable = require('formidable');
const slugify = require('slugify');
const fs = require('fs');
const { validationResult } = require("express-validator");
const { baseResponse, getFileType, getStaticUrl, logger, projectUserField } = require("../../utils/helper");
const { set, get } = require("../../services/redis");
const User = require('../../models/User');
const { MEDIA_TYPE, DEFAULT_COVER, DEFAULT_AVATAR } = require('../../utils/constant');

const me = async (req, res, next) => {
    baseResponse.json(res, 200, 'Thành công.', {
        user: req.user
    });
}

const getUserInfo = async (req, res, next) => {
    try{
        const {userId} = req.params;
        let user = JSON.parse(await get(userId));
        if(!user){
            user = await User.findById(userId, {...projectUserField()});
            set(userId, JSON.stringify(user));
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
        const {userId} = req.params;
        const {fullName, email, gender, birthday, notification} = req.body;
        const { addressDetail = "" } = req.body.address;
        if(req.user.id !== userId){
            baseResponse.error(res, 403, 'Bạn không có quyền thao tác chức năng này.');
            return;
        }
        const errors = validationResult(req);
        if(!errors.isEmpty()){
            baseResponse.error(res, 422, 'Vui lòng nhập đủ thông tin.', errors.array());
            return;
        }
        const updated = await User.findByIdAndUpdate(userId, {
            fullName,
            email,
            notification,
            gender,
            birthday,
            address: {
                province: req.province,
                district: req.district,
                subDistrict: req.subDistrict,
                addressDetail
            }
        }, {
            new: true
        });
        set(userId, JSON.stringify(updated));
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
        const {userId} = req.params;
        if(req.user.id !== userId){
            baseResponse.error(res, 403, 'Bạn không có quyền thao tác chức năng này.');
            return;
        }
        const form = formidable({maxFileSize: 1024 * 1024});
        form.parse(req, async (err, fields, files) => {
            if(err) throw Error();
            if(files.avatar && files.avatar.size && getFileType(files.avatar) !== MEDIA_TYPE.IMAGE){
                baseResponse.error(res, 422, 'Vui lòng nhập đủ thông tin.', [
                    {
                        "location": "body",
                        "param": "avatar",
                        "msg": "Vui lòng chọn đúng định dạng file ảnh."
                    }
                ]);
                return;
            }
            if(files.cover && files.cover.size && getFileType(files.cover) !== MEDIA_TYPE.IMAGE){
                baseResponse.error(res, 422, 'Vui lòng nhập đủ thông tin.', [
                    {
                        "location": "body",
                        "param": "cover",
                        "msg": "Vui lòng chọn đúng định dạng file ảnh."
                    }
                ]);
                return;
            }
            form.uploadDir = "static/images";
            let avatarUrl = getStaticUrl(DEFAULT_AVATAR);
            let coverUrl = getStaticUrl(DEFAULT_COVER);
            if(files.avatar && files.avatar.size){
                const newPath = form.uploadDir + '/avatar/' + userId + '_' + slugify(files.avatar.name);
                fs.renameSync(files.avatar.path, newPath);
                avatarUrl = getStaticUrl(newPath);
            }
            if(files.cover && files.cover.size){
                const newPath = form.uploadDir + '/cover/' + userId + '_' + slugify(files.avatar.name);
                fs.renameSync(files.cover.path, newPath);
                coverUrl = getStaticUrl(newPath);
            }
            const updated = await User.findByIdAndUpdate(userId, {
                avatar: avatarUrl,
                cover: coverUrl
            }, {
                new: true
            });
            set(userId, JSON.stringify(updated));
            baseResponse.json(res, 200, 'Thành công', {
                user: updated
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