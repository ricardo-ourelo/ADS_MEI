const axios = require('axios');
const APIClient = require('../models/apiClient');

const routeManager = {
    
  calculateRoute: async (req, res) => {
    try {
      const { start, end, profile = 'car' } = req.query;
      
      if (!start || !end) {
        return res.status(400).json({
          error: 'Parâmetros "start" e "end" são obrigatórios'
        });
      }

      console.log(`Calculando rota: ${profile} de ${start} para ${end}`);
      
      const route = await APIClient.calculateRoute(start, end, profile);
      res.json(route);
    } catch (error) {
      console.error('Erro no cálculo da rota:', error);
      res.status(500).json({
        error: 'Erro ao calcular rota: ' + error.message
      });
    }
  }

};

module.exports = routeManager;