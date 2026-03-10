'use strict';

module.exports = {
  async up(queryInterface) {
    const [users] = await queryInterface.sequelize.query(
      "SELECT id FROM Users WHERE email = 'joao@barbearia.com' LIMIT 1;"
    );

    if (!users || users.length === 0) {
      return;
    }

    const barberId = users[0].id;
    const now = new Date();

    return queryInterface.bulkInsert('Services', [
      {
        name: 'Corte de Cabelo',
        price: 45.0,
        duration_minutes: 45,
        barber_id: barberId,
        createdAt: now,
        updatedAt: now
      },
      {
        name: 'Barba',
        price: 35.0,
        duration_minutes: 30,
        barber_id: barberId,
        createdAt: now,
        updatedAt: now
      },
      {
        name: 'Corte + Barba',
        price: 70.0,
        duration_minutes: 75,
        barber_id: barberId,
        createdAt: now,
        updatedAt: now
      },
      {
        name: 'Sobrancelha',
        price: 20.0,
        duration_minutes: 15,
        barber_id: barberId,
        createdAt: now,
        updatedAt: now
      }
    ]);
  },

  async down(queryInterface) {
    const { Op } = queryInterface.sequelize.Sequelize;
    return queryInterface.bulkDelete('Services', {
      name: {
        [Op.in]: ['Corte de Cabelo', 'Barba', 'Corte + Barba', 'Sobrancelha']
      }
    }, {});
  }
};
