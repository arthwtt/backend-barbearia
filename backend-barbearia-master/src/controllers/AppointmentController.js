const { Op } = require('sequelize');
const { Appointment, User, Service } = require('../../models');

function normalizeToDbDateTime(input) {
  if (!input) return null;

  const raw = String(input).trim();
  let normalized = raw;

  if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(normalized)) {
    normalized = `${normalized}:00`;
  } else if (/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}$/.test(normalized)) {
    normalized = `${normalized}:00`;
  }

  if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}$/.test(normalized)) {
    return normalized.replace('T', ' ');
  }

  if (/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/.test(normalized)) {
    return normalized;
  }

  const parsed = new Date(raw);
  if (Number.isNaN(parsed.getTime())) return null;

  const year = parsed.getFullYear();
  const month = String(parsed.getMonth() + 1).padStart(2, '0');
  const day = String(parsed.getDate()).padStart(2, '0');
  const hours = String(parsed.getHours()).padStart(2, '0');
  const minutes = String(parsed.getMinutes()).padStart(2, '0');
  const seconds = String(parsed.getSeconds()).padStart(2, '0');

  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
}

module.exports = {
  async store(req, res) {
    try {
      const { barber_id, service_id, start_at, date } = req.body;
      const user_id = req.userId;
      const appointmentStart = normalizeToDbDateTime(start_at || date);

      if (!barber_id || !service_id || !appointmentStart) {
        return res.status(400).json({
          error: 'barber_id, service_id e start_at (ou date) sao obrigatorios.'
        });
      }

      const barber = await User.findByPk(barber_id);
      if (!barber) {
        return res.status(400).json({ error: 'Barbeiro nao encontrado.' });
      }

      if (barber.type !== 'barbeiro' && barber.type !== 'barber') {
        return res.status(400).json({ error: 'O usuario escolhido nao e um barbeiro.' });
      }

      const service = await Service.findByPk(service_id);
      if (!service) {
        return res.status(400).json({ error: 'Servico nao encontrado.' });
      }

      if (service.barber_id !== Number(barber_id)) {
        return res.status(400).json({
          error: 'O servico informado nao pertence ao barbeiro selecionado.'
        });
      }

      const conflict = await Appointment.findOne({
        where: {
          barber_id: Number(barber_id),
          status: { [Op.ne]: 'cancelled' },
          start_at: appointmentStart
        }
      });

      if (conflict) {
        return res.status(409).json({
          error: 'Este horario ja foi reservado para este barbeiro.'
        });
      }

      const appointment = await Appointment.create({
        user_id,
        barber_id,
        service_id,
        start_at: appointmentStart,
        date: appointmentStart,
        status: 'scheduled',
      });

      return res.status(201).json(appointment);
    } catch (err) {
      console.error(err);
      return res.status(500).json({ error: 'Erro ao criar agendamento.' });
    }
  },

  async index(req, res) {
    try {
      const { userType, userId } = req;
      const { status, barber_id, date } = req.query;

      let whereCondition = {};
      let include = [
        { association: 'client', attributes: ['id', 'name', 'email'] },
        { association: 'barber', attributes: ['id', 'name'] },
        { association: 'service', attributes: ['id', 'name', 'price', 'duration_minutes'] }
      ];
      let attributes = undefined;
      const normalizedUserType = String(userType || '').toLowerCase();
      const isBarber = normalizedUserType === 'barbeiro' || normalizedUserType === 'barber';
      const requestedBarberId = barber_id ? Number(barber_id) : null;
      const hasBarberFilter = Number.isInteger(requestedBarberId) && requestedBarberId > 0;

      if (isBarber) {
        whereCondition = { barber_id: userId };
      } else {
        whereCondition = hasBarberFilter ? { barber_id: requestedBarberId } : { user_id: userId };
      }

      if (!isBarber && hasBarberFilter) {
        attributes = ['id', 'barber_id', 'service_id', 'start_at', 'status'];
        include = [{ association: 'service', attributes: ['id', 'name', 'duration_minutes'] }];
      }

      if (status && status !== 'all') {
        whereCondition.status = status;
      } else {
        whereCondition.status = { [Op.ne]: 'cancelled' };
      }

      if (date) {
        const dayStart = normalizeToDbDateTime(`${date}T00:00:00`);
        const dayEnd = normalizeToDbDateTime(`${date}T23:59:59`);

        if (!dayStart || !dayEnd) {
          return res.status(400).json({ error: 'Data invalida. Use o formato YYYY-MM-DD.' });
        }

        whereCondition.start_at = {
          [Op.between]: [dayStart, dayEnd]
        };
      }

      const appointments = await Appointment.findAll({
        where: whereCondition,
        order: [['start_at', 'DESC'], ['date', 'DESC']],
        attributes,
        include
      });

      return res.json(appointments);
    } catch (error) {
      console.log(error);
      return res.status(500).json({ error: 'Erro ao buscar agendamentos.' });
    }
  },

  async delete(req, res) {
    try {
      const { id } = req.params;
      const { userId } = req;

      const appointment = await Appointment.findByPk(id);

      if (!appointment) {
        return res.status(404).json({ error: 'Agendamento nao encontrado.' });
      }

      if (appointment.user_id !== userId && appointment.barber_id !== userId) {
        return res.status(401).json({
          error: 'Voce nao tem permissao para cancelar este agendamento.'
        });
      }

      if (appointment.status === 'cancelled') {
        return res.status(400).json({ error: 'Agendamento ja esta cancelado.' });
      }

      await appointment.update({ status: 'cancelled' });

      return res.status(200).json({ message: 'Agendamento cancelado com sucesso!' });
    } catch (error) {
      return res.status(500).json({ error: 'Erro ao cancelar agendamento.' });
    }
  }
};
