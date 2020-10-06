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
        let userInfos = [...conversation.userInfos, sender];
        await sendToMultipleDevice(listFcmToken, {title, body}, {type: NOTIFICATION_TYPE.MESSAGE, conversationId: conversation._id, isGroup: conversation.isGroup, userInfos: JSON.stringify(userInfos)});
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
        let userInfos = [...conversation.userInfos, sender];
        await sendToMultipleDevice(listFcmToken, {title, body}, {type: NOTIFICATION_TYPE.MESSAGE, conversationId: message.conversationId, isGroup: conversation.isGroup, userInfos: JSON.stringify(userInfos)});
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
                let data = {type, postId: post._id, user: JSON.stringify(user), createdAt: post.createdAt};
                let receiveUsers = await User.find({_id: {$ne: user._id}, notification: true});
                let listFcmToken = receiveUsers.map((obj) => obj.fcmToken);
                let notificationData = receiveUsers.map((obj) => {
                    return {
                        title,
                        content: body,
                        userId: obj._id,
                        type, 
                        data
                    }
                });
                await Notification.create(notificationData);
                await sendToMultipleDevice(listFcmToken, {title, body}, data);
                done();
                break;
            }
            case NOTIFICATION_TYPE.COMMENT: {
                let {user, post, comment} = params;
                let title = user.fullName + ' vừa bình luận về bài viết của bạn.';
                let data = {type, postId: post._id, commentId: comment._id, user: JSON.stringify(user), createdAt: post.createdAt};
                let receiveUser = await User.findById(post.userId);
                if(!receiveUser || !receiveUser.notification) {
                    done();
                    return;
                }
                let notificationData = {
                    title,
                    content: "",
                    userId: post.userId,
                    type, 
                    data
                }
                await Notification.create(notificationData);
                await sendToMultipleDevice([receiveUser.fcmToken], {title, body: ""}, data);
                done();
                break;
            }
            case NOTIFICATION_TYPE.REPLY: {
                let {user, comment, reply, post} = params;
                let title = user.fullName + ' vừa trả lời bình luận của bạn.';
                let data = {type, postId: comment.postId, commentId: comment._id, replyId: reply._id, user: JSON.stringify(user), createdAt: post.createdAt};
                let receiveUser = await User.findById(comment.userId);
                if(!receiveUser || !receiveUser.notification) {
                    done();
                    return;
                }
                let notificationData = {
                    title,
                    content: "",
                    userId: comment.userId,
                    type, 
                    data
                }
                await Notification.create(notificationData);
                await sendToMultipleDevice([receiveUser.fcmToken], {title, body: ""}, data);
                done();
                break;
            }
            case NOTIFICATION_TYPE.LIKE: {
                let {user, post, like} = params;
                let title = user.fullName + ' vừa thích bài viết của bạn.';
                let data = {type, postId: post._id, user: JSON.stringify(user), createdAt: post.createdAt};
                let receiveUser = await User.findById(post.userId);
                if(!receiveUser || !receiveUser.notification) {
                    done();
                    return;
                }
                let notificationData = {
                    title,
                    content: "",
                    userId: post.userId,
                    type, 
                    data
                }
                await Notification.create(notificationData);
                await sendToMultipleDevice([receiveUser.fcmToken], {title, body: ""}, data);
                done();
                break;
            }
            default:
                break;
        }
    }catch(e){
        logger.error(e);
        done();
    }
});

module.exports = {
    queue
}