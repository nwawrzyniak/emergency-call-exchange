import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const CallRequest = sequelize.define('CallRequest', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  requesterId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'Users',
      key: 'id'
    }
  },
  callerId: {
    type: DataTypes.INTEGER,
    references: {
      model: 'Users',
      key: 'id'
    }
  },
  status: {
    type: DataTypes.ENUM('pending', 'matched', 'completed', 'cancelled'),
    defaultValue: 'pending'
  },
  preferenceGender: {
    type: DataTypes.ENUM('male', 'female', 'non-binary', 'other', 'any'),
    defaultValue: 'any'
  },
  preferenceAgeMin: {
    type: DataTypes.INTEGER,
    defaultValue: 18
  },
  preferenceAgeMax: {
    type: DataTypes.INTEGER,
    defaultValue: 120
  },
  callTime: {
    type: DataTypes.DATE,
    allowNull: false
  },
  suggestedContactName: {
    type: DataTypes.STRING,
    defaultValue: 'Aunt Betty'
  },
  scenario: {
    type: DataTypes.ENUM('emergency', 'date-escape', 'work-meeting', 'other'),
    defaultValue: 'date-escape'
  },
  notes: {
    type: DataTypes.TEXT
  },
  matchedAt: {
    type: DataTypes.DATE
  },
  completedAt: {
    type: DataTypes.DATE
  },
  rating: {
    type: DataTypes.INTEGER,
    validate: {
      min: 1,
      max: 5
    }
  },
  feedback: {
    type: DataTypes.TEXT
  }
}, {
  timestamps: true,
  indexes: [
    { fields: ['status', 'callTime'] },
    { fields: ['requesterId', 'status'] }
  ]
});

export default CallRequest;
