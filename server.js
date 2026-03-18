require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const routes = require('./src/routes');

const swaggerUi = require('swagger-ui-express');
const swaggerSpec = require('./src/config/swagger');

const app = express();
const PORT = Number(process.env.PORT || 3000);
const frontendPath = path.resolve(__dirname, 'frontend');

app.use(express.json());
app.use(cors());
app.use('/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
app.use(routes);
app.use(express.static(frontendPath));

app.get('/', (req, res) => {
  res.sendFile(path.join(frontendPath, 'index.html'));
});

app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok' });
});

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`Servidor rodando na porta ${PORT}`);
  });
}

module.exports = app;
