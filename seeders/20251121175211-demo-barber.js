const bcrypt = require('bcryptjs');

module.exports = {
  async up (queryInterface, Sequelize) {
    // Gerar o hash da senha '123456'
    const passwordHash = await bcrypt.hash('123456', 8);

    return queryInterface.bulkInsert('Users', [{
      name: 'Barbeiro João',
      email: 'joao@barbearia.com',
      phone: '123456789',
      password: passwordHash,
      type: 'barbeiro', // <--- AQUI definimos que ele é barbeiro
      createdAt: new Date(),
      updatedAt: new Date()
    }]);
  },

  async down (queryInterface, Sequelize) {
    // Se desfazermos a seed, deletamos esse usuário
    return queryInterface.bulkDelete('Users', { email: 'joao@barbearia.com' }, {});
  }
};