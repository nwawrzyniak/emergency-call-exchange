import sequelize from '../config/database.js';
import User from './User.js';
import CallRequest from './CallRequest.js';

// Define associations
User.hasMany(CallRequest, { foreignKey: 'requesterId', as: 'requests' });
User.hasMany(CallRequest, { foreignKey: 'callerId', as: 'calls' });

CallRequest.belongsTo(User, { foreignKey: 'requesterId', as: 'requester' });
CallRequest.belongsTo(User, { foreignKey: 'callerId', as: 'caller' });

export { sequelize, User, CallRequest };
