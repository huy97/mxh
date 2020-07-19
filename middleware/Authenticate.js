const jwt = require('jsonwebtoken');
const User = require('../models/User');
const {baseResponse} = require('../utils/helper');
const {get, set} = require('../utils/redis');

const Authenticated = async (req, res, next) => {
    try{
        const {token} = req.headers || req.cookies.token;
        if(!token){
            baseResponse.error(res, 400, 'Token missing.');
        } else {
            try{
                const verify = await jwt.verify(token, global.privateKey);
                let user = JSON.parse(await get(verify.uid));
                if(!user){
                    user = await User.findOne({_id: verify.uid, accessToken: token}, {password: 0});
                    set(verify.uid, JSON.stringify(user));
                }
                if(!user){
                    baseResponse.error(res, 401, 'Uỷ quyền thất bại.');
                    return;
                }
                req.user = user;
                next();
            }catch (e) {
                if(e instanceof jwt.TokenExpiredError){
                    baseResponse.error(res, 419, 'Token đã hết hạn.');
                    return;
                }
                if(e instanceof jwt.JsonWebTokenError){
                    baseResponse.error(res, 400, 'Token không hợp lệ.');
                    return;
                }
                baseResponse.error(res, 401, 'Uỷ quyền thất bại.');
            }
        }
    }catch(e){
        baseResponse.error(res);
    }
};

module.exports = Authenticated;