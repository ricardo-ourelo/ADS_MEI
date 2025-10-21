const axios = require('axios');
const RouteModel = require('../models/apiClient');

const poiManager = {

  getPOI: async (req, res) => {
    try {
      const { bbox, types } = req.query;
      
      if (!bbox) {
        return res.status(400).json({
          error: 'Parâmetro "bbox" é obrigatório'
        });
      }

      const pois = await RouteModel.getPointsOfInterest(bbox, types);
      res.json(pois);
    } catch (error) {
      console.error('Erro ao buscar POIs:', error);
      res.status(500).json({
        error: 'Erro ao buscar pontos de interesse'
      });
    }
  }
  
};

module.exports = poiManager;