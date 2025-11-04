const express = require('express');
const router = express.Router();
const { indexController, appManager } = require('../controllers/appManager');

router.get('/', appManager.index);

module.exports = router;