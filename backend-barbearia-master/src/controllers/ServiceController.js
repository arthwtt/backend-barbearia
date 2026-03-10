const Service = require('../../models').Service;

module.exports = {
  async index(req, res) {
    try {
      const whereCondition = {};
      const { barber_id } = req.query;

      if (barber_id) {
        whereCondition.barber_id = Number(barber_id);
      }

      const services = await Service.findAll({
        where: whereCondition,
        attributes: ['id', 'name', 'price', 'duration_minutes', 'barber_id'],
        order: [['name', 'ASC']]
      });

      return res.json(services);
    } catch (error) {
      return res.status(500).json({ error: 'Erro ao listar servicos.' });
    }
  },

  async store(req, res) {
    try {
      const requesterType = String(req.userType || '').toLowerCase();
      const isBarber = requesterType === 'barbeiro' || requesterType === 'barber';

      if (!isBarber) {
        return res.status(403).json({ error: 'Apenas barbeiros podem cadastrar servicos.' });
      }

      const { name, price, duration_minutes } = req.body;
      if (!name || price == null || !duration_minutes) {
        return res.status(400).json({ error: 'name, price e duration_minutes sao obrigatorios.' });
      }

      const service = await Service.create({
        name,
        price,
        duration_minutes,
        barber_id: req.userId
      });

      return res.status(201).json(service);
    } catch (error) {
      return res.status(500).json({ error: 'Erro ao cadastrar servico.' });
    }
  },

  async update(req, res) {
    try {
      const requesterType = String(req.userType || '').toLowerCase();
      const isBarber = requesterType === 'barbeiro' || requesterType === 'barber';

      if (!isBarber) {
        return res.status(403).json({ error: 'Apenas barbeiros podem atualizar servicos.' });
      }

      const { id } = req.params;
      const service = await Service.findByPk(id);
      if (!service) {
        return res.status(404).json({ error: 'Servico nao encontrado.' });
      }

      if (Number(service.barber_id) !== Number(req.userId)) {
        return res.status(403).json({ error: 'Voce so pode alterar seus proprios servicos.' });
      }

      const { name, price, duration_minutes } = req.body;
      await service.update({
        name: name ?? service.name,
        price: price ?? service.price,
        duration_minutes: duration_minutes ?? service.duration_minutes
      });

      return res.json(service);
    } catch (error) {
      return res.status(500).json({ error: 'Erro ao atualizar servico.' });
    }
  },

  async delete(req, res) {
    try {
      const requesterType = String(req.userType || '').toLowerCase();
      const isBarber = requesterType === 'barbeiro' || requesterType === 'barber';

      if (!isBarber) {
        return res.status(403).json({ error: 'Apenas barbeiros podem excluir servicos.' });
      }

      const { id } = req.params;
      const service = await Service.findByPk(id);
      if (!service) {
        return res.status(404).json({ error: 'Servico nao encontrado.' });
      }

      if (Number(service.barber_id) !== Number(req.userId)) {
        return res.status(403).json({ error: 'Voce so pode excluir seus proprios servicos.' });
      }

      await service.destroy();
      return res.status(200).json({ message: 'Servico excluido com sucesso.' });
    } catch (error) {
      return res.status(500).json({ error: 'Erro ao excluir servico.' });
    }
  }
};
