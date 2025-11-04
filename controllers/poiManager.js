/**
 * @file poiManager.js
 * @description Controller responsável por obter Pontos de Interesse (POIs) a partir do backend
 * ou de APIs externas, conforme a bounding box e os tipos definidos pelo utilizador.
 * @module controllers/poiManager
 */

const axios = require('axios');
const APIClient = require('../models/apiClient');

/**
 * Controlador de Pontos de Interesse.
 * @type {object}
 */
const poiManager = {
  /**
   * Obtém uma lista de POIs com base na área geográfica (bounding box) e tipo.
   * Endpoint: `/api/poi?bbox=<sul, oeste, norte, este>&types=<tipo>`
   * @async
   * @function getPOI
   * @param {object} req - Pedido HTTP do Express.
   * @param {object} res - Resposta HTTP do Express.
   * @returns {Promise<void>} Envia um JSON com os POIs encontrados.
   */
  getPOI: async (req, res) => {
    try {
      const { bbox, types } = req.query;

      if (!bbox) {
        return res.status(400).json({
          error: 'Parâmetro "bbox" é obrigatório'
        });
      }

      const pois = await APIClient.getPointsOfInterest(bbox, types);
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
