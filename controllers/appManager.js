const appManager = {
  index: (req, res) => {
    res.render('index', {
      title: 'Planejador de Rotas',
      mapboxToken: process.env.MAPBOX_TOKEN || ''
    });
  }
};

module.exports = {appManager};