import { DataTypes } from 'sequelize';
import { sequelize } from './index.js';
import bcrypt from 'bcryptjs';

export const User = sequelize.define('User', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  email: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
    validate: {
      isEmail: true
    }
  },
  passwordHash: {
    type: DataTypes.STRING,
    allowNull: false
  },
  createdAt: {
    type: DataTypes.DATE(3)
  },
  updatedAt: {
    type: DataTypes.DATE(3)
  }
});

// Instance method to check password
User.prototype.checkPassword = async function(password) {
  return bcrypt.compare(password, this.passwordHash);
};

// Static method to hash password
User.hashPassword = async function(password) {
  return bcrypt.hash(password, 10);
};
