'use strict';
const express = require('express');
const AuthController = require('../../controllers/auth/AuthController');
const ServiceController = require('../../controllers/service/ServiceController');
const router = express.Router();

router.post('/login', [], AuthController.login);
router.post('/refresh-token', [], AuthController.refreshToken);
router.get('/provinces', [], ServiceController.getProvinces);
router.get('/provinces/:provinceId/districts', [], ServiceController.getDistricts);
router.get('/provinces/:provinceId/districts/:districtId/subdistricts', [], ServiceController.getSubDistricts);

module.exports = router;