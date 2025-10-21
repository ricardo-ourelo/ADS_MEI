const express = require('express');
const router = express.Router();
const poiManager = require('../controllers/poiManager');
const searchManager = require('../controllers/searchManager');
const routeManager = require('../controllers/routeManager');

// Rotas da API
router.get('/search', searchManager.searchLocation);
router.get('/route', routeManager.calculateRoute);
router.get('/poi', poiManager.getPOI);

module.exports = router;