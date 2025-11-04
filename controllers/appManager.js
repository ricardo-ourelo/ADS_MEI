/**
 * @file appManager.js
 * @description Controller responsável por renderizar a página principal da aplicação.
 * Este módulo serve a interface do utilizador e fornece o token de acesso ao Mapbox.
 * @module controllers/appManager
 */

/**
 * Controlador principal da aplicação.
 * @type {object}
 */
const appManager = {
  /**
   * Rendeiriza a página inicial do Planeador de Rotas.
   * @function index
   * @param {object} req - Objeto de pedido HTTP do Express.
   * @param {object} res - Objeto de resposta HTTP do Express.
   * @returns {void} Rendeiriza a página inicial (index.ejs).
   */
  index: (req, res) => {
    res.render('index', {
      title: 'Planeador de Rotas',
      mapboxToken: process.env.MAPBOX_TOKEN || ''
    });
  }
};

module.exports = { appManager };
