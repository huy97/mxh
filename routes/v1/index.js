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

router.post('/login', [], AuthController.login);
router.post('/refresh-token', [], AuthController.refreshToken);

//Service
router.get('/provinces', [], ServiceController.getProvinces);
router.get('/provinces/:provinceId/districts', [], ServiceController.getDistricts);
router.get('/provinces/:provinceId/districts/:districtId/subdistricts', [], ServiceController.getSubDistricts);

//Authenticated here

router.use(Authenticate);

//User
router.get('/user', [], UserController.me);
router.get('/user/:userId', [], UserController.getUserInfo);
router.put('/user/:userId', [UpdateUser], UserController.updateUserInfo);
router.put('/user/:userId/avatar', [], UserController.updateUserAvatar);
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
    router.get('/comment/:commentId/reply', [], CommentController.getListReply);
    router.post('/comment/:commentId/reply', [CreateComment], CommentController.createReplyComment);
    router.put('/comment/:commentId', [CreateComment], CommentController.updateComment);
    router.delete('/comment/:commentId', [], CommentController.deleteComment);
    //End
//End
//Conversation
router.get('/conversations', [], ConversationController.getList);
router.post('/conversations', [CreateConversation], ConversationController.createConversation);
//End
//Upload
router.post('/upload/images', [], UploadController.uploadImage);
//End

module.exports = router;