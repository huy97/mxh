const jwt = require('jsonwebtoken');
const fs = require('fs');

const Authenticated = async (req, res, next) => {
    const privateKey = await  fs.readFileSync('privateKey');
    if(!req.headers.token){
        res.status(404).json({
            status: 404,
            message: 'Trang không tồn tại'
        });
    } else {
        try{
            const verify = await jwt.verify(req.headers.token, privateKey);
            // let user = await User.findById(verify.data.uuid, {password: 0});
            if(!user){
                res.status(401).json({
                    status: 401,
                    message: 'Uỷ quyền thất bại'
                });
                return;
            }
            req.user = user;
            next();
        }catch (e) {
            res.status(401).json({
                status: 401,
                message: 'Uỷ quyền thất bại'
            });
        }
    }
};

module.exports = Authenticated;