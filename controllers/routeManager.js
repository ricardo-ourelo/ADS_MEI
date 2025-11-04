/**
 * @file routeManager.js
 * @description Controller responsável por calcular rotas entre pontos através da API OSRM.
 * Recebe pedidos do frontend e devolve a rota calculada em formato JSON.
 * @module controllers/routeManager
 */

const axios = require('axios');
const APIClient = require('../models/apiClient');

/**
 * Controlador de rotas.
 * @type {object}
 */
const routeManager = {
  /**
   * Calcula uma rota entre coordenadas de origem e destino.
   * Endpoint: `/api/route?start=<lat,lng>&end=<lat,lng>&profile=<car|bike|foot>`
   * @async
   * @function calculateRoute
   * @param {object} req - Pedido HTTP do Express.
   * @param {object} res - Resposta HTTP do Express.
   * @returns {Promise<void>} Envia um JSON com a rota calculada ou erro.
   */
  calculateRoute: async (req, res) => {
    try {
      const { start, end, profile = 'car' } = req.query;

      if (!start || !end) {
        return res.status(400).json({
          error: 'Parâmetros "start" e "end" são obrigatórios'
        });
      }

      console.log(`A calcular rota: ${profile} de ${start} para ${end}`);

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
