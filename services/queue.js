const kue = require('kue');
const User = require('../models/User');
const { logger } = require('../utils/helper');
const { sendToListUser } = require('./socket');
const { sendToMultipleDevice } = require('./firebase');
const ConversationUser = require('../models/ConversationUser');
const Notification = require('../models/Notification');
const { NOTIFICATION_TYPE } = require('../utils/constant');
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
        let title = conversation.isGroup ? conversation.title : sender.fullName;
        let body = conversation.lastMessage.message;
        if(conversation.isGroup){
            body = `${sender.fullName}: ${body}`;
        }
        await sendToMultipleDevice(listFcmToken, {title, body}, {conversationId: conversation._id});
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
        let title = conversation.isGroup ? conversation.title : sender.fullName;
        let body = message.message;
        if(conversation.isGroup){
            body = `${sender.fullName}: ${body}`;
        }
        await sendToMultipleDevice(listFcmToken, {title, body}, {conversationId: message.conversationId});
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

queue.process('notification', async (job, done) => {
    try{
        const {type, params} = job.data;
        switch(type){
            case NOTIFICATION_TYPE.POST: {
                let {user, post} = params;
                let title = user.fullName + ' vừa đăng một bài viết mới.';
                let body = post.content.length < 100 ? post.content : post.content.substr(0, 100) + '...';
                let data = {postId: post.id};
                await Notification.create({
                    title,
                    content: body,
                    userId: user._id,
                    data
                });
                await sendToMultipleDevice(listFcmToken, {title, body}, data);
            }
            case NOTIFICATION_TYPE.COMMENT:
                break;
            case NOTIFICATION_TYPE.REPLY:
                break;
            case NOTIFICATION_TYPE.LIKE:
                break;
            default:
                break;
        }
        done();
    }catch(e){
        logger.error(e);
        done();
    }
});

module.exports = {
    queue
}