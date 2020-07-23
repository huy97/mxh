const io = require('socket.io');
const { logger } = require('../utils/helper');
const User = require('../models/User');

const init = (server) => {
    const socketServer = io(server);
    
    socketServer.on('connection', (socket) => {
        logger.info(socket.id + ' client connected.');
        const { accessToken } = socket.handshake.query;
        if(accessToken){
            socket.emit('authorization', {status: 200, message: "Thành công."});
        }else{
            socket.disconnect(true);
            socket.emit('authorization', {status: 401, message: "Uỷ quyền thất bại."});
        }
    });

}

module.exports = {
    init
};