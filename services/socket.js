const io = require('socket.io');
const { logger } = require('../utils/helper');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

let socketServer;
const init = (port) => {
    socketServer = io.listen(port);
    socketServer.on('connection', async (socket) => {
        logger.info(socket.id + ' client connected.');
        const { accessToken } = socket.handshake.query;
        authorization(accessToken, socket);
        onTypingMessage(socket);
    });

}

const authorization = async (accessToken, socket) => {
    try{
        const verify = await jwt.verify(accessToken, global.privateKey);
        const user = await User.findOne({_id: verify.uid, accessToken}, {password: 0});
        if(!user){
            socket.emit('authorization', {status: 401, message: "Uỷ quyền thất bại."});
            socket.disconnect(true);
            return;
        }
        user.socketId = socket.id;
        await user.save();
        socket.emit('authorization', {status: 200, message: "Thành công."});
    }catch (e) {
        logger.error(e);
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
}

const sendToUser = (socketId, eventName, data) => {
    logger.info(eventName + ', Send to user '+socketId);
    socketServer.to(socketId).emit(eventName, data);
} 

const sendToListUser = (users = [], eventName, data) => {
    users.map((user) => {
        sendToUser(user, eventName, data);
    });
}

const onTypingMessage = (socket) => {
    socket.on('typing', async (data) => {
        const {conversationId, listUsers, isTyping} = data;
        const users = await User.find({_id: {$in: listUsers}}, {socketId: 1, fcmToken: 1});
        const listSocketId = users.map((obj) => obj.socketId);
        sendToListUser(listSocketId, "typing", {
            conversationId,
            isTyping
        });
    });
}

module.exports = {
    init,
    sendToUser,
    sendToListUser
};