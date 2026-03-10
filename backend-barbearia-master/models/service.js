'use strict';
const {
  Model
} = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class Service extends Model {
    static associate(models) {
      this.belongsTo(models.User, { foreignKey: 'barber_id', as: 'barber' });
      this.hasMany(models.Appointment, { foreignKey: 'service_id', as: 'appointments' });
    }
  }

  Service.init({
    name: DataTypes.STRING,
    price: DataTypes.DECIMAL,
    duration_minutes: DataTypes.INTEGER,
    barber_id: DataTypes.INTEGER
  }, {
    sequelize,
    modelName: 'Service',
  });

  return Service;
};
