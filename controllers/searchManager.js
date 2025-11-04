/**
 * @file searchManager.js
 * @description Controller responsável por pesquisar locais e endereços utilizando a API Nominatim.
 * Recebe texto de pesquisa do frontend e devolve coordenadas correspondentes.
 * @module controllers/searchManager
 */

const axios = require('axios');
const APIClient = require('../models/apiClient');

/**
 * Controlador de pesquisa de locais.
 * @type {object}
 */
const searchManager = {
  /**
   * Pesquisa um local com base numa query textual.
   * Endpoint: `/api/search?q=<texto>&format=json&limit=10`
   * @async
   * @function searchLocation
   * @param {import('express').Request} req - Pedido HTTP do Express.
   * @param {import('express').Response} res - Resposta HTTP do Express.
   * @returns {Promise<void>} Envia um JSON com resultados de pesquisa (coordenadas e nomes).
   */
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

module.exports = searchManager;
