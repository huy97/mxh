'use strict';
const express = require('express');
const AuthController = require('../../controllers/auth/AuthController');
const router = express.Router();

router.post('/login', [], AuthController.login);
router.post('/refresh-token', [], AuthController.refreshToken);

module.exports = router;