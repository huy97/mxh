const formidable = require('formidable');
const slugify = require('slugify');
const fs = require('fs');
const { validationResult } = require("express-validator");
const { baseResponse, getFileType, getStaticUrl, logger, projectUserField, defaultStartLimit, isEmpty } = require("../../utils/helper");
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

const getList = async (req, res, next) => {
    try{
        const {keyword = ""} = req.query;
        const {start, limit} = defaultStartLimit(req);
        const find = {
            _id: {$ne: req.user._id},
            $text : {$search: keyword}
        };
        const queryUser = User.find(find, {_id: 1, fullName: 1, avatar: 1, online: 1}).skip(start).limit(limit);
        const queryTotal = User.countDocuments(find);
        const [users, total] = await Promise.all([queryUser, queryTotal]);
        baseResponse.success(res, 200, 'Thành công', users, {
            total
        });
    }catch(e){
        logger.error(e);
        baseResponse.error(res);
    }
}

const getListCustom = async (req, res, next) => {
    try{
        const {keyword} = req.query;
        const {start, limit} = defaultStartLimit(req);
        let find = {
            _id: {$ne: req.user._id},
        };
        if(keyword){
            find.$text = {
                $search: keyword
            }
        }
        const queryUser = User.find(find, {_id: 1, fullName: 1, avatar: 1, online: 1}).skip(start).limit(limit);
        const queryTotal = User.countDocuments(find);
        const [users, total] = await Promise.all([queryUser, queryTotal]);
        baseResponse.success(res, 200, 'Thành công', users, {
            total
        });
    }catch(e){
        logger.error(e);
        baseResponse.error(res);
    }
}

const updateUserInfo = async (req, res, next) => {
    try{
        const {userId} = req.params;
        const {fullName, email, gender, birthday, notification, address = {}} = req.body;
        const { addressDetail = "" } = address;
        const currentUser = req.user;
        if(currentUser.id !== userId){
            baseResponse.error(res, 403, 'Bạn không có quyền thao tác chức năng này.');
            return;
        }
        const errors = validationResult(req);
        if(!errors.isEmpty()){
            baseResponse.error(res, 422, 'Vui lòng nhập đủ thông tin.', errors.array());
            return;
        }
        const updateField = {
            fullName: fullName ? fullName : currentUser.fullName,
            email: email ? email : currentUser.email,
            notification: notification ? notification : currentUser.notification,
            gender: gender ? gender : currentUser.gender,
            birthday: birthday ? birthday : currentUser.birthday,
            address: {
                province: req.province ? req.province : null,
                district: req.district ? req.district : null,
                subDistrict: req.subDistrict ? req.subDistrict : null,
                addressDetail: addressDetail ? addressDetail : null
            }
        };
        const updated = await User.findByIdAndUpdate(userId, updateField, {
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

const updateFCMToken = async (req, res, next) => {
    try{
        const {userId} = req.params;
        const {token = ""} = req.body;
        if(req.user.id !== userId){
            baseResponse.error(res, 403, 'Bạn không có quyền thao tác chức năng này.');
            return;
        }
        const updated = await User.findByIdAndUpdate(userId, {
            fcmToken: token
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

module.exports = {
    me,
    getList,
    getListCustom,
    getUserInfo,
    updateUserInfo,
    updateUserAvatar,
    updateFCMToken
}