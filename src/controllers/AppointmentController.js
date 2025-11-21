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
}
};