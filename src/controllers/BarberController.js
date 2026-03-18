const { Op } = require('sequelize');
const { User, Service, sequelize } = require('../../models');
const bcrypt = require('bcryptjs');

const DEFAULT_SERVICES = [
  {
    name: 'Corte de Cabelo',
    price: 45.0,
    duration_minutes: 45
  },
  {
    name: 'Barba',
    price: 35.0,
    duration_minutes: 30
  },
  {
    name: 'Corte + Barba',
    price: 70.0,
    duration_minutes: 75
  },
  {
    name: 'Sobrancelha',
    price: 20.0,
    duration_minutes: 15
  }
];

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
      const createdBarber = await sequelize.transaction(async (transaction) => {
        const barber = await User.create({
          name,
          email,
          phone: phone || null,
          password: passwordHash,
          type: 'barbeiro'
        }, { transaction });

        const servicesPayload = DEFAULT_SERVICES.map((service) => ({
          ...service,
          barber_id: barber.id
        }));

        await Service.bulkCreate(servicesPayload, { transaction });

        return barber;
      });

      return res.status(201).json({
        id: createdBarber.id,
        name: createdBarber.name,
        email: createdBarber.email,
        phone: createdBarber.phone,
        type: createdBarber.type,
        default_services_created: DEFAULT_SERVICES.length
      });
    } catch (error) {
      return res.status(500).json({ error: 'Erro ao cadastrar barbeiro.' });
    }
  }
};
