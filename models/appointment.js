'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Appointment extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
    
    this.belongsTo(models.User, { foreignKey: 'user_id', as: 'client' });
    this.belongsTo(models.User, { foreignKey: 'barber_id', as: 'barber' });
    }
  }
  Appointment.init({
    date: DataTypes.DATE,
    user_id: DataTypes.INTEGER,
    barber_id: DataTypes.INTEGER,
    service: DataTypes.STRING
  }, {
    sequelize,
    modelName: 'Appointment',
  });
  return Appointment;
};