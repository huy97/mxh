'use strict';
const express = require('express');
const router = express.Router();
const Authenticated = require('../../../middleware/authenticated');

router.use(Authenticated);

module.exports = router;