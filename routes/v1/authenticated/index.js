'use strict';
const express = require('express');
const router = express.Router();
const Authenticate = require('../../../middleware/Authenticate');
const UserController = require('../../../controllers/user/UserController');
const UserValidation = require('../../../middleware/validation/user/UserValidation');

router.use(Authenticate);
router.get('/user', [], UserController.me);
router.get('/user/:id', [], UserController.getUserInfo);
router.put('/user/:id', [UserValidation.updateUserInfo], UserController.updateUserInfo);
router.put('/user/:id/avatar', [], UserController.updateUserAvatar);

module.exports = router;