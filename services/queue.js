const kue = require('kue');
const User = require('../models/User');
const { logger } = require('../utils/helper');
const { sendToListUser } = require('./socket');
const { Types } = require('mongoose');
const ConversationUser = require('../models/ConversationUser');
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
        const {reading, conversationId, userId} = job.data;
        const conversationUsers = await ConversationUser.find({conversationId, userId: {$ne: userId}});
        const listUsers = await User.find({_id: {$in: conversationUsers.map((obj) => obj.userId)}}, {socketId: 1});
        sendToListUser(listUsers.map((obj) => obj.socketId), "reading", {
            reading
        });
        done();
    }catch(e){
        logger.error(e);
        done();
    }
});

module.exports = {
    queue
}