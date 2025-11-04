/**
 * @file app.js
 * @description Configuração principal do servidor Express.
 * Define middlewares, rotas e inicializa o servidor.
 */
require('dotenv').config();
const express = require('express');
const path = require('path');
const cors = require('cors');

const app = express();


// Configurações
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Middlewares
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'src')));
app.use(cors());

// Rotas
app.use('/', require('./routes/index'));
app.use('/api', require('./routes/api'));

// Rota 404
app.use((req, res) => {
  res.status(404).render('404', { title: 'Página Não Encontrada' });
});

// Error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).render('error', { 
    title: 'Erro', 
    message: 'Algo deu errado!' 
  });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
  console.log(`Acesse: http://localhost:${PORT}`);
});