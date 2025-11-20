
const express = require('express');
const cors = require('cors');

const app = express();


app.use(express.json());
app.use(cors());


app.get('/', (req, res) => {
    res.send('Olá! A API da Barbearia está a funcionando!');
});


const PORT = 3000;


app.listen(PORT, () => {
    console.log(`Servidor rodando na porta ${PORT}`);
});