const express = require('express');
const router = express.Router();
const UserController = require('./controllers/UserController');
const TokenController = require('./controllers/TokenController');
const authMiddleware = require('../middlewares/auth');



router.post('/login', TokenController.store);
router.post('/users', UserController.store);

router.use(authMiddleware);

router.get('/dashboard', (req, res) => {
    return res.status(200).json({
        message: 'Bem vindo a área logada',
        userId: req.userId,
        userType: req.userType
    });
});

module.exports = router;