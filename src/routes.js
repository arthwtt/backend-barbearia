const express = require('express');
const router = express.Router();
const UserController = require('./controllers/UserController');
const TokenController = require('./controllers/TokenController');
const AppointmentController = require('./controllers/AppointmentController');

// Importar o Middleware (o segurança)
const authMiddleware = require('../middlewares/auth'); 

// --- 1. ROTAS PÚBLICAS (Qualquer um acessa) ---
router.post('/login', TokenController.store);
router.post('/users', UserController.store);

// --- 2. A BARREIRA DE SEGURANÇA (Middleware) ---
// Daqui para baixo, TUDO exige Token
router.use(authMiddleware);

// --- 3. ROTAS PROTEGIDAS (Só acessa quem tem Token) ---
router.post('/appointments', AppointmentController.store); // <--- MOVI PARA CÁ

router.get('/dashboard', (req, res) => {
    return res.status(200).json({
        message: 'Bem vindo a área logada',
        userId: req.userId,
        userType: req.userType
    });
});

module.exports = router;