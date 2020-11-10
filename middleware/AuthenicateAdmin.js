const jwt = require('jsonwebtoken');
const UserAdmin = require('../models/UserAdmin');
const userRoleModel = require('../models/UserRole');
const {baseResponse, logger} = require('../utils/helper');

const AuthenticatedAdmin = async (req, res, next) => {
    try{
        const {token} = req.headers || req.cookies.token;
        if(!token){
            baseResponse.error(res, 400, 'Token missing.');
        } else {
            try{
                const verify = await jwt.verify(token, global.privateKey);
                const user = await UserAdmin.findOne({_id: verify.uid, accessToken: token}, {password: 0});
                if(!user){
                    baseResponse.error(res, 401, 'Uỷ quyền thất bại.');
                    return;
                }
                const userRole = await userRoleModel.aggregate([
                    {
                        $match: {
                            userId: user._id
                        }
                    },
                    {
                        $project: {
                            roleId: 1,
                            roles: 1
                        }
                    },
                    {
                        $lookup: {
                            from: 'useradminroles',
                            localField: 'roleId',
                            foreignField: 'roleId',
                            as: 'useradminroles'
                        }
                    }
                ]);
                let roles = [];
                userRole[0].useradminroles.map((roleTemp) => {
                    roles = [...roles, ...roleTemp.permissionCodes];
                });
                req.user = user;
                req.roles = roles;
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

module.exports = AuthenticatedAdmin;