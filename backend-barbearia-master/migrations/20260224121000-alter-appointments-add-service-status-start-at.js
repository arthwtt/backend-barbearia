'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('Appointments', 'service_id', {
      type: Sequelize.INTEGER,
      allowNull: true,
      references: { model: 'Services', key: 'id' },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL'
    });

    await queryInterface.addColumn('Appointments', 'status', {
      type: Sequelize.STRING,
      allowNull: false,
      defaultValue: 'scheduled'
    });

    await queryInterface.addColumn('Appointments', 'start_at', {
      type: Sequelize.DATE,
      allowNull: true
    });
  },

  async down(queryInterface) {
    await queryInterface.removeColumn('Appointments', 'start_at');
    await queryInterface.removeColumn('Appointments', 'status');
    await queryInterface.removeColumn('Appointments', 'service_id');
  }
};
