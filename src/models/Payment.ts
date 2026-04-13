import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/db';

interface PaymentAttributes {
  id: number;
  userId: number;
  eventId: number;
  amount: number;
  currency: string;
  paymentMethod: 'stripe' | 'paypal';
  paymentId: string;
  status: 'pending' | 'completed' | 'failed' | 'refunded';
  createdAt?: Date;
  updatedAt?: Date;
}

interface PaymentCreationAttributes extends Optional<PaymentAttributes, 'id' | 'currency' | 'status'> {}

class Payment extends Model<PaymentAttributes, PaymentCreationAttributes> implements PaymentAttributes {
  public id!: number;
  public userId!: number;
  public eventId!: number;
  public amount!: number;
  public currency!: string;
  public paymentMethod!: 'stripe' | 'paypal';
  public paymentId!: string;
  public status!: 'pending' | 'completed' | 'failed' | 'refunded';
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

Payment.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id',
      },
    },
    eventId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'events',
        key: 'id',
      },
    },
    amount: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
    },
    currency: {
      type: DataTypes.STRING(10),
      defaultValue: 'USD',
    },
    paymentMethod: {
      type: DataTypes.ENUM('stripe', 'paypal'),
      allowNull: false,
    },
    paymentId: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    status: {
      type: DataTypes.ENUM('pending', 'completed', 'failed', 'refunded'),
      defaultValue: 'pending',
    },
  },
  {
    sequelize,
    modelName: 'Payment',
    tableName: 'payments',
    timestamps: true,
  }
);

export default Payment;
