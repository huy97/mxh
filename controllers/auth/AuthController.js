const fetch = require("node-fetch");
const { baseResponse, logger } = require("../../utils/helper");
const {FB, FacebookApiException} = require('fb');
const User = require("../../models/User");
const jwt = require("jsonwebtoken");

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
        FB.setAccessToken(accessToken);
        const {email, name, picture, id} = await FB.api("me", { fields: "email,name,picture.height(200)" });
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
        console.log(Date.now())
        baseResponse.json(res, 200, 'Đăng nhập thành công.', {
            accessToken: token,
            refreshToken: refreshToken,
            expiredAt: tokenExpiredAt,
            user: user
        });
    }catch(e){
        logger.error(e);
        if(e instanceof FacebookApiException){
            baseResponse.json(res, 400, 'accessToken không hợp lệ hoặc hết hạn.');
            return;
        }
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