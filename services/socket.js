const io = require('socket.io');
const { logger } = require('../utils/helper');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

const init = (server) => {
    const socketServer = io(server);
    
    socketServer.on('connection', async (socket) => {
        logger.info(socket.id + ' client connected.');
        const { accessToken } = socket.handshake.query;
        try{
            const verify = await jwt.verify(accessToken, global.privateKey);
            const user = await User.findOne({_id: verify.uid, accessToken}, {password: 0});
            if(!user){
                socket.disconnect(true);
                socket.emit('authorization', {status: 401, message: "Uỷ quyền thất bại."});
                return;
            }
            user.socketId = socket.id;
            await user.save();
            socket.emit('authorization', {status: 200, message: "Thành công."});
        }catch (e) {
            if(e instanceof jwt.TokenExpiredError){
                socket.emit('authorization', {status: 419, message: "Token đã hết hạn."});
                socket.disconnect(true);
                return;
            }
            if(e instanceof jwt.JsonWebTokenError){
                socket.emit('authorization', {status: 400, message: "Token không hợp lệ."});
                socket.disconnect(true);
            }
            socket.emit('authorization', {status: 401, message: "Uỷ quyền thất bại."});
            socket.disconnect(true);
        }
    });

}

module.exports = {
    init
};