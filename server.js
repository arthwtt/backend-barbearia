require('dotenv').config();
const express = require('express');
const cors = require('cors');
const routes = require('./src/routes');

const swaggerUi = require('swagger-ui-express');
const swaggerSpec = require('./src/config/swagger');

const app = express();


app.use(express.json());
app.use(cors());
app.use('/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

app.use(routes);



app.get('/', (req, res) => {
    res.send('Olá! A API da Barbearia está a funcionando!');
});


const PORT = 3000;


app.listen(PORT, () => {
    console.log(`Servidor rodando na porta ${PORT}`);
});