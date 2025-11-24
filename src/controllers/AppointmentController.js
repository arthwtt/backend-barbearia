const { Appointment, User } = require('../../models');

module.exports = {

async store(req, res){

    try {
        const { barber_id, date, service } = req.body;
        const user_id = req.userId;

        
        const barber = await User.findByPk(barber_id);
        if (!barber) {
            return res.status(400).json({ error: 'Barbeiro não encontrado.' });
        }

        // Verificação extra: O barbeiro é mesmo um barbeiro?
      if (barber.type !== 'barbeiro') {
        return res.status(400).json({ error: 'O usuário escolhido não é um barbeiro.' });
      }

        // create the appointment
        const appointment = await Appointment.create({
            user_id,
            barber_id,
            date,
            service,
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

      let whereCondition = {};

      if (userType === 'barbeiro') {
        whereCondition = { barber_id: userId };
      } else {
        whereCondition = { user_id: userId };
      }

      const appointments = await Appointment.findAll({
        where: whereCondition,
        order: [['date', 'DESC']],
        include: [
          { association: 'client', attributes: ['id', 'name', 'email'] },
          { association: 'barber', attributes: ['id', 'name'] }
        ]
      });

      return res.json(appointments);
    } catch (error) {
      console.log(error);
      return res.status(500).json({ error: 'Erro ao buscar agendamentos.' });
    }
  },
  async delete (req, res){

    try {
      const { id } = req.params; 
      const { userId, userType } = req;

      
      const appointment = await Appointment.findByPk(id);

      if (!appointment) {
        return res.status(404).json({ error: 'Agendamento não encontrado.' });
      }

      
      if (appointment.user_id !== userId && appointment.barber_id !== userId) {
        return res.status(401).json({ 
          error: 'Você não tem permissão para cancelar este agendamento.' 
        });
      }

     
      await appointment.destroy();

      return res.status(200).json({ message: 'Agendamento cancelado com sucesso!' });

    } catch (error) {
      return res.status(500).json({ error: 'Erro ao cancelar agendamento.' });
    }
  }
};