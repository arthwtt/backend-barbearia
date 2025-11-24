const express = require('express');
const router = express.Router();
const UserController = require('./controllers/UserController');
const TokenController = require('./controllers/TokenController');
const AppointmentController = require('./controllers/AppointmentController');

const authMiddleware = require('../middlewares/auth');

/**
 * @swagger
 * tags:
 *   - name: Autenticação
 *     description: Rotas de Login e Cadastro (UC 001 / UC 002)
 *   - name: Agendamentos
 *     description: Gerenciamento de horários (UC 003 / UC 004 / UC 005)
 */

/**
 * @swagger
 * /users:
 *   post:
 *     summary: Cadastra um novo usuário (Cliente) - UC 001
 *     tags:
 *       - Autenticação
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               email:
 *                 type: string
 *               phone:
 *                 type: string
 *               password:
 *                 type: string
 *     responses:
 *       '201':
 *         description: Usuário criado com sucesso
 *       '400':
 *         description: Email já cadastrado
 */
router.post('/users', UserController.store);

/**
 * @swagger
 * /login:
 *   post:
 *     summary: Realiza o login e retorna o Token JWT - UC 002
 *     tags:
 *       - Autenticação
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *     responses:
 *       '200':
 *         description: Login realizado com sucesso
 *       '401':
 *         description: Credenciais inválidas
 */
router.post('/login', TokenController.store);

router.use(authMiddleware);

/**
 * @swagger
 * /appointments:
 *   post:
 *     summary: Cria um novo agendamento - UC 003
 *     tags:
 *       - Agendamentos
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               barber_id:
 *                 type: integer
 *                 example: 2
 *               date:
 *                 type: string
 *                 format: date-time
 *                 example: "2025-10-20T14:00:00Z"
 *               service:
 *                 type: string
 *                 example: "Corte de Cabelo"
 *     responses:
 *       '201':
 *         description: Agendamento criado
 *       '400':
 *         description: Barbeiro não encontrado ou inválido
 */
router.post('/appointments', AppointmentController.store);

/**
 * @swagger
 * /appointments:
 *   get:
 *     summary: Lista agendamentos do usuário logado - UC 004 / UC 006
 *     tags:
 *       - Agendamentos
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       '200':
 *         description: Lista retornada com sucesso
 */
router.get('/appointments', AppointmentController.index);

/**
 * @swagger
 * /appointments/{id}:
 *   delete:
 *     summary: Cancela um agendamento - UC 005
 *     tags:
 *       - Agendamentos
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: integer
 *         required: true
 *         description: ID do agendamento
 *     responses:
 *       '200':
 *         description: Agendamento cancelado
 *       '401':
 *         description: Não autorizado
 */
router.delete('/appointments/:id', AppointmentController.delete);

router.get('/dashboard', (req, res) => {
    return res.status(200).json({
        message: 'Bem vindo a área logada',
        userId: req.userId,
        userType: req.userType
    });
});

module.exports = router;