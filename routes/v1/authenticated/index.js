'use strict';
const express = require('express');
const router = express.Router();
const Authenticate = require('../../../middleware/Authenticate');
const UserController = require('../../../controllers/user/UserController');
const UpdateUser = require('../../../middleware/validation/user/UpdateUser');
const PostController = require('../../../controllers/post/PostController');
const CreatePost = require('../../../middleware/validation/post/CreatePost');
const UploadController = require('../../../controllers/service/UploadController');

router.use(Authenticate);

//User
router.get('/user', [], UserController.me);
router.get('/user/:id', [], UserController.getUserInfo);
router.put('/user/:id', [UpdateUser], UserController.updateUserInfo);
router.put('/user/:id/avatar', [], UserController.updateUserAvatar);

//Post
router.post('/post', [CreatePost], PostController.createPost);

//Upload
router.post('/upload/images', [], UploadController.uploadImage);

module.exports = router;