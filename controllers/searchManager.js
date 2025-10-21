const axios = require('axios');
const APIClient = require('../models/apiClient');

const routeManager = {
  searchLocation: async (req, res) => {
    try {
      const { q, format = 'json', limit = 10 } = req.query;
      
      if (!q) {
        return res.status(400).json({
          error: 'Parâmetro "q" é obrigatório'
        });
      }

      const results = await APIClient.searchLocation(q, format, limit);
      res.json(results);
    } catch (error) {
      console.error('Erro na pesquisa:', error);
      res.status(500).json({
        error: 'Erro ao pesquisar localização'
      });
    }
  }

};

module.exports = routeManager;