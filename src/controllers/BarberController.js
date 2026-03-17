const { Op } = require('sequelize');
const User = require('../../models').User;
const bcrypt = require('bcryptjs');

module.exports = {
  async index(req, res) {
    try {
      const barbers = await User.findAll({
        where: {
          type: {
            [Op.in]: ['barbeiro', 'barber']
          }
        },
        attributes: ['id', 'name', 'email'],
        order: [['name', 'ASC']]
      });

      return res.json(barbers);
    } catch (error) {
      return res.status(500).json({ error: 'Erro ao listar barbeiros.' });
    }
  },

  async store(req, res) {
    try {
      const requesterType = String(req.userType || '').toLowerCase();
      const canManageBarbers = requesterType === 'barbeiro' || requesterType === 'barber';

      if (!canManageBarbers) {
        return res.status(403).json({ error: 'Apenas barbeiros podem cadastrar outros barbeiros.' });
      }

      const { name, email, phone, password } = req.body;
      if (!name || !email || !password) {
        return res.status(400).json({ error: 'name, email e password sao obrigatorios.' });
      }

      const existingUser = await User.findOne({ where: { email } });
      if (existingUser) {
        return res.status(400).json({ error: 'Ja existe um usuario com este e-mail.' });
      }

      const passwordHash = await bcrypt.hash(password, 8);
      const barber = await User.create({
        name,
        email,
        phone: phone || null,
        password: passwordHash,
        type: 'barbeiro'
      });

      return res.status(201).json({
        id: barber.id,
        name: barber.name,
        email: barber.email,
        phone: barber.phone,
        type: barber.type
      });
    } catch (error) {
      return res.status(500).json({ error: 'Erro ao cadastrar barbeiro.' });
    }
  }
};
