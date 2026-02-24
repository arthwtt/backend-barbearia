const { Op } = require('sequelize');
const { Appointment, User, Service } = require('../../models');

module.exports = {
  async store(req, res) {
    try {
      const { barber_id, service_id, start_at, date } = req.body;
      const user_id = req.userId;
      const appointmentStart = start_at || date;

      if (!barber_id || !service_id || !appointmentStart) {
        return res.status(400).json({
          error: 'barber_id, service_id e start_at (ou date) sao obrigatorios.'
        });
      }

      const barber = await User.findByPk(barber_id);
      if (!barber) {
        return res.status(400).json({ error: 'Barbeiro nao encontrado.' });
      }

      if (barber.type !== 'barbeiro') {
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
      const { status } = req.query;

      let whereCondition = {};

      if (userType === 'barbeiro') {
        whereCondition = { barber_id: userId };
      } else {
        whereCondition = { user_id: userId };
      }

      if (status && status !== 'all') {
        whereCondition.status = status;
      } else {
        whereCondition.status = { [Op.ne]: 'cancelled' };
      }

      const appointments = await Appointment.findAll({
        where: whereCondition,
        order: [['start_at', 'DESC'], ['date', 'DESC']],
        include: [
          { association: 'client', attributes: ['id', 'name', 'email'] },
          { association: 'barber', attributes: ['id', 'name'] },
          { association: 'service', attributes: ['id', 'name', 'price', 'duration_minutes'] }
        ]
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
