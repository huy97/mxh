const formidable = require('formidable');
const slugify = require('slugify');
const fs = require('fs');
const { validationResult } = require("express-validator");
const { baseResponse, getFileType, getStaticUrl, logger, projectUserField, defaultStartLimit, isEmpty } = require("../../utils/helper");
const { set, get } = require("../../services/redis");
const User = require('../../models/User');
const UserRole = require('../../models/UserRole');
const { MEDIA_TYPE, DEFAULT_COVER, DEFAULT_AVATAR, PERMISSION_CODE } = require('../../utils/constant');
const jwt = require('jsonwebtoken');
const bcryptjs = require('bcryptjs');

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
        const queryUser = User.aggregate([
            {
                $match: find
            },
            {
                $skip: start
            },
            {
                $limit: limit
            },
            {
              $sort: {
                  createdAt: -1
              }
            },
            {
                $lookup: {
                    from: 'user_roles',
                    localField: "_id",
                    foreignField: "userId",
                    as: 'roles'
                }
            },
            {
                $lookup: {
                    from: 'roles',
                    localField: "roles.roleId",
                    foreignField: "roleId",
                    as: 'roles'
                }
            }
        ]);
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
        const {fullName, email, gender, birthday, notification, address} = req.body;
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
            notification: notification !== null || notification !== undefined ? notification : currentUser.notification,
            gender: gender ? gender : currentUser.gender,
            birthday: birthday ? birthday : currentUser.birthday,
            address: {
                province: req.province ? req.province : null,
                district: req.district ? req.district : null,
                subDistrict: req.subDistrict ? req.subDistrict : null,
                addressDetail: address && address.addressDetail ? address.addressDetail : null
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
        const form = formidable();
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
            let avatarUrl = req.user.avatar ? req.user.avatar : getStaticUrl(DEFAULT_AVATAR);
            let coverUrl = req.user.cover ? req.user.cover : getStaticUrl(DEFAULT_COVER);
            if(files.avatar && files.avatar.size){
                const newPath = form.uploadDir + '/avatar/' + userId + '_' + slugify(files.avatar.name);
                fs.renameSync(files.avatar.path, newPath);
                avatarUrl = getStaticUrl(newPath);
            }
            if(files.cover && files.cover.size){
                const newPath = form.uploadDir + '/cover/' + userId + '_' + slugify(files.cover.name);
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

const createUser = async (req, res, next) => {
    try{
        const {fullName, username, password} = req.body;
        const errors = validationResult(req);
        if(!errors.isEmpty()){
            return baseResponse.error(res, 422, 'Vui lòng nhập đủ thông tin', errors.array());
        }
        const passwordHash = await bcryptjs.hashSync(password, 10);
        let userObj = {
            fullName,
            username,
            password: passwordHash,
            uid: username
        }
        let defaultRoleId = 1;
        const user = await User.create(userObj);
        const tokenExpiredAt = Math.floor(Date.now() / 1000) + (60 * 60 * 24 * 30);
        const refreshTokenExpiredAt = Math.floor(Date.now() / 1000) + (60 * 60 * 24 * 60);
        const [token, refreshToken] = await Promise.all([
            jwt.sign({uid: user.id,  exp: tokenExpiredAt}, global.privateKey),
            jwt.sign({uid: user.id,  exp: refreshTokenExpiredAt}, global.privateKey)
        ]);
        user.accessToken = token;
        user.refreshToken = refreshToken;
        await user.save();
        await UserRole.create({
            userId: user.id,
            roleId: defaultRoleId
        });
        return baseResponse.json(res, 200, 'Thành công', {
            user
        });
    }catch (e) {
        logger.error(e);
        return baseResponse.error(res);
    }
};

const deleteUser = async (req, res, next) => {
    const {userId} = req.params;
    try{
        if(userId === req.user.id){
            return baseResponse.error(res, 422, 'Bạn không thể xoá chính bạn.');
        }
        let user = await User.findById(userId);
        if(!user){
            return baseResponse.error(res, 422, 'User không tồn tại.');
        }
        await user.remove();
        return baseResponse.success(res, 200, 'Thành công', {
            user
        });
    }catch(e){
        return baseResponse.error(res);
    }
};

module.exports = {
    me,
    getList,
    getListCustom,
    getUserInfo,
    updateUserInfo,
    updateUserAvatar,
    updateFCMToken,
    createUser,
    deleteUser
}
