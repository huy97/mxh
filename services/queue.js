const kue = require('kue');
const User = require('../models/User');
const { logger, getTitle } = require('../utils/helper');
const { sendToListUser } = require('./socket');
const { sendToMultipleDevice } = require('./firebase');
const ConversationUser = require('../models/ConversationUser');
const queue = kue.createQueue({});

queue.process('conversation', async (job, done) => {
    try{
        const {to = [], conversation, sender} = job.data;
        if(!to || !to.length || !conversation){
            done();
            return;
        }
        const users = await User.find({_id: {$in: to}}, {socketId: 1, fcmToken: 1});
        const listSocketId = users.map((obj) => obj.socketId);
        const listFcmToken = users.map((obj) => obj.fcmToken);
        sendToListUser(listSocketId, "conversation", conversation);
        sendToListUser(listSocketId, "message", conversation.lastMessage);
        let body = conversation.lastMessage.message;
        if(conversation.isGroup){
            body = `${sender.fullName}: ${body}`;
        }
        sendToMultipleDevice(listFcmToken, {title: getTitle(conversation), body}, {conversationId: conversation._id}, sender.avatar).then((r) => console.log(r));
        done();
    }catch(e){
        logger.error(e);
        done();
    }
});

queue.process('message', async (job, done) => {
    try{
        const {to = [], conversation, message, sender} = job.data;
        if(!to || !to.length || !message){
            done();
            return;
        }
        const users = await User.find({_id: {$in: to}}, {socketId: 1, fcmToken: 1});
        const listSocketId = users.map((obj) => obj.socketId);
        const listFcmToken = users.map((obj) => obj.fcmToken);
        sendToListUser(listSocketId, "conversation", conversation);
        sendToListUser(listSocketId, "message", message);
        let body = message.message;
        if(conversation.isGroup){
            body = `${sender.fullName}: ${body}`;
        }
        await sendToMultipleDevice(listFcmToken, {title: getTitle(conversation), body}, {conversationId: message.conversationId}, sender.avatar);
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
        const conversationUsers = await ConversationUser.find({conversationId});
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