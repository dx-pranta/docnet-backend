import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/db';

interface ConnectionAttributes {
  id: number;
  requesterId: number;
  recipientId: number;
  status: 'pending' | 'accepted' | 'rejected';
  createdAt?: Date;
  updatedAt?: Date;
}

interface ConnectionCreationAttributes extends Optional<ConnectionAttributes, 'id' | 'status'> {}

class Connection extends Model<ConnectionAttributes, ConnectionCreationAttributes> implements ConnectionAttributes {
  public id!: number;
  public requesterId!: number;
  public recipientId!: number;
  public status!: 'pending' | 'accepted' | 'rejected';
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

Connection.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    requesterId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id',
      },
    },
    recipientId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id',
      },
    },
    status: {
      type: DataTypes.ENUM('pending', 'accepted', 'rejected'),
      defaultValue: 'pending',
    },
  },
  {
    sequelize,
    modelName: 'Connection',
    tableName: 'connections',
    timestamps: true,
  }
);

export default Connection;
