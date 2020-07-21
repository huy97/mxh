const fetch = require("node-fetch");
const { baseResponse } = require("../../utils/helper");
const User = require("../../models/User");
const jwt = require("jsonwebtoken");
const e = require("cors");

const login = async (req, res, next) => {
    try{
        const {accessToken} = req.body;
        if(!accessToken){
            baseResponse.error(res, '422', 'Vui lòng nhập đủ thông tin.', [
                {
                    "location": "body",
                    "param": "accessToken",
                    "msg": "Vui lòng nhập accessToken."
                }
            ]);
            return;
        }
        const url = `https://graph.facebook.com/v7.0/me?access_token=${accessToken}&fields=email,name,picture.height(200)`;
        const request = await fetch(url);
        if(request.status !== 200){
            baseResponse.error(res, request.status, request.statusText);
            return;
        }
        const {email, name, picture, id} = await request.json();
        let user = await User.findOne({uid: id});
        if(!user){
            user = await User.create({
                uid: id,
                email: email,
                fullName: name,
                avatar: picture.data.url
            });
        }
        const tokenExpiredAt = Math.floor(Date.now() / 1000) + (60 * 60 * 24 * 30);
        const refreshTokenExpiredAt = Math.floor(Date.now() / 1000) + (60 * 60 * 24 * 60);
        const token = await jwt.sign({uid: user.id,  exp: tokenExpiredAt}, global.privateKey);
        const refreshToken = await jwt.sign({uid: user.id,  exp: refreshTokenExpiredAt}, global.privateKey);
        user.accessToken = token;
        user.refreshToken = refreshToken;
        await user.save();
        baseResponse.json(res, 200, 'Đăng nhập thành công.', {
            accessToken: token,
            refreshToken: refreshToken,
            expiredAt: tokenExpiredAt
        });
    }catch(e){
        logger.error(e);
        baseResponse.error(res);
    }
}

const refreshToken = async (req, res, next) => {
    try{
        const {refreshToken} = req.body;
        if(!refreshToken){
            baseResponse.error(res, '422', 'Vui lòng nhập đủ thông tin.', [
                {
                    "location": "body",
                    "param": "refreshToken",
                    "msg": "Vui lòng nhập refreshToken"
                }
            ]);
            return;
        }
        const verify = await jwt.verify(refreshToken, global.privateKey);
        const user = await User.findOne({_id: verify.uid});
        if(user){
            const tokenExpiredAt = Math.floor(Date.now() / 1000) + (60 * 60 * 24 * 30);
            const newToken = await jwt.sign({uid: user.id,  exp: tokenExpiredAt}, global.privateKey);
            user.accessToken = newToken;
            await user.save();
            baseResponse.json(res, 200, 'Thành công.', {
                accessToken: newToken,
                expiredAt: tokenExpiredAt
            });
            return;
        }else{
            baseResponse.error(res, 404, 'User không tồn tại.');
        }
    }catch(error){
        logger.error(error);
        if(error instanceof jwt.TokenExpiredError){
            baseResponse.error(res, 419, 'Token đã hết hạn.');
            return;
        }
        if(error instanceof jwt.JsonWebTokenError){
            baseResponse.error(res, 400, 'Token không hợp lệ.');
            return;
        }
        baseResponse.error(res);
    }
}

module.exports = {
    login,
    refreshToken
}