'use strict';
const express = require('express');
const router = express.Router();
const AuthController = require('../../controllers/auth/AuthController');
const ServiceController = require('../../controllers/service/ServiceController');
const Authenticate = require('../../middleware/Authenticate');
const UserController = require('../../controllers/user/UserController');
const UpdateUser = require('../../middleware/validation/user/UpdateUser');
const PostController = require('../../controllers/post/PostController');
const CreatePost = require('../../middleware/validation/post/CreatePost');
const UploadController = require('../../controllers/service/UploadController');
const UpdatePost = require('../../middleware/validation/post/UpdatePost');
const LikeController = require('../../controllers/post/LikeController');
const LikePost = require('../../middleware/validation/post/LikePost');
const CommentController = require('../../controllers/post/CommentController');
const CreateComment = require('../../middleware/validation/post/CreateComment');
const ConversationController = require('../../controllers/message/ConversationController');
const CreateConversation = require('../../middleware/validation/conversation/CreateConversation');
const MessageController = require('../../controllers/message/MessageController');
const NotificationController = require('../../controllers/user/NotificationController');
const jwt = require('jsonwebtoken');
const User = require('../../models/User');
const VersionController = require('../../controllers/admin/VersionController');

router.post('/login', [], AuthController.login);
router.post('/login-apple', [], AuthController.loginWithApple);
router.post('/manager/login', [], AuthController.loginWithPassword);
router.post('/refresh-token', [], AuthController.refreshToken);

//Service
router.get('/provinces', [], ServiceController.getProvinces);
router.get('/provinces/:provinceId/districts', [], ServiceController.getDistricts);
router.get('/provinces/:provinceId/districts/:districtId/subdistricts', [], ServiceController.getSubDistricts);
router.post('/version/check', [], VersionController.checkVersion);

//Authenticated here
router.use(Authenticate);

//User
router.get('/user', [], UserController.me);
router.post('/user', [], UserController.createUser);
router.get('/user/find', [], UserController.getList);
router.get('/user/find-custom', [], UserController.getListCustom);
router.get('/user/:userId', [], UserController.getUserInfo);
router.put('/user/:userId', [UpdateUser], UserController.updateUserInfo);
router.delete('/user/:userId', [], UserController.deleteUser);
router.post('/user/:userId/avatar', [], UserController.updateUserAvatar);
router.put('/user/:userId/update-fcmtoken', [], UserController.updateFCMToken);
router.get('/user/:userId/post', [], PostController.getList);
//End
//Post
router.get('/post/list', [], PostController.getList);
router.post('/post', [CreatePost], PostController.createPost);
router.get('/post/:postId', [], PostController.show);
router.put('/post/:postId', [UpdatePost], PostController.updatePost);
router.delete('/post/:postId', [], PostController.deletePost);
    //Post Like
    router.get('/post/:postId/like', [], LikeController.getList);
    router.post('/post/:postId/like', [LikePost], LikeController.likePost);
    router.delete('/post/:postId/dislike', [], LikeController.dislikePost);
    //End
    //Post comment
    router.get('/post/:postId/comment', [], CommentController.getList);
    router.post('/post/:postId/comment', [CreateComment], CommentController.createComment);
    router.get('/comment/:commentId', [], CommentController.getCommentById);
    router.get('/comment/:commentId/reply', [], CommentController.getListReply);
    router.post('/comment/:commentId/reply', [CreateComment], CommentController.createReplyComment);
    router.put('/comment/:commentId', [CreateComment], CommentController.updateComment);
    router.delete('/comment/:commentId', [], CommentController.deleteComment);
    //End
//End
//Conversation
router.get('/conversations', [], ConversationController.getList);
router.get('/conversations/:conversationId', [], ConversationController.getList);
router.post('/conversations', [CreateConversation], ConversationController.createConversation);
router.post('/conversations/list-unread', [CreateConversation], ConversationController.getUnreadMessage);
router.get('/conversations/:userId/check-exist', [], ConversationController.checkExist);
router.delete('/conversations/:conversationId', [], ConversationController.deleteConversation);
router.get('/conversations/:conversationId/last-read', [], ConversationController.getLastRead);
router.get('/conversations/:conversationId/messages', [], MessageController.getList);
router.get('/conversations/:conversationId/messages/:messageId/reading', [], MessageController.readMessage);
router.post('/conversations/:conversationId/messages', [], MessageController.createMessage);
router.delete('/messages/:messageId', [], MessageController.deleteMessage);
//End
//Notification
router.get('/notifications', [], NotificationController.getList);
//End
//Upload
router.post('/upload/images', [], UploadController.uploadImage);
//End

module.exports = router;
