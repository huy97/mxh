const kue = require('kue');
const User = require('../models/User');
const { logger } = require('../utils/helper');
const { sendToListUser } = require('./socket');
const Message = require('../models/Message');
const { Types } = require('mongoose');
const queue = kue.createQueue({});

queue.process('conversation', async (job, done) => {
    try{
        const {to = [], conversation} = job.data;
        if(!to || !to.length || !conversation){
            done();
            return;
        }
        const users = await User.find({_id: {$in: to}}, {socketId: 1, fcmToken: 1});
        const listSocketId = users.map((obj) => obj.socketId);
        const listFcmToken = users.map((obj) => obj.fcmToken);
        sendToListUser(listSocketId, "conversation", conversation);
        sendToListUser(listSocketId, "message", conversation.lastMessage);
        done();
    }catch(e){
        logger.error(e);
        done();
    }
});

queue.process('message', async (job, done) => {
    try{
        const {to = [], conversation, message} = job.data;
        if(!to || !to.length || !message){
            done();
            return;
        }
        const users = await User.find({_id: {$in: to}}, {socketId: 1, fcmToken: 1});
        const listSocketId = users.map((obj) => obj.socketId);
        const listFcmToken = users.map((obj) => obj.fcmToken);
        sendToListUser(listSocketId, "conversation", conversation);
        sendToListUser(listSocketId, "message", message);
        done();
    }catch(e){
        logger.error(e);
        done();
    }
    done();
});

queue.process('reading', async (job, done) => {
    try{
        const {reading, messageId, userId} = job.data;
        const conversation = await Message.aggregate([
            {
                $match: {_id: Types.ObjectId(messageId)}
            },
            {
                $lookup: {
                    from: "conversation_users",
                    localField: "conversationId",
                    foreignField: "conversationId",
                    as: "conversationUsers"
                }
            },
            {
                $unwind: "$conversationUsers"
            },
            {
                $lookup: {
                    from: "users",
                    localField: "conversationUsers.userId",
                    foreignField: "_id",
                    as: "users"
                }
            },
            {
                $unwind: "$users"
            }
        ]);
        const listUsers = conversation.filter((obj) => obj.users._id != userId).map((obj) => obj.users.socketId);
        sendToListUser(listUsers, "reading", {
            reading
        });
    }catch(e){
        logger.error(e);
        done();
    }
});

module.exports = {
    queue
}