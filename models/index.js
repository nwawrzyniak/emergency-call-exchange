const sequelize = require('../config/database');
const User = require('./User');
const CallRequest = require('./CallRequest');

// Define associations
User.hasMany(CallRequest, { foreignKey: 'requesterId', as: 'requests' });
User.hasMany(CallRequest, { foreignKey: 'callerId', as: 'calls' });

CallRequest.belongsTo(User, { foreignKey: 'requesterId', as: 'requester' });
CallRequest.belongsTo(User, { foreignKey: 'callerId', as: 'caller' });

module.exports = {
  sequelize,
  User,
  CallRequest
};
