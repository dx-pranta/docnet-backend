import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/db';

interface EventAttributes {
  id: number;
  title: string;
  description?: string;
  organizerId: number;
  eventType?: 'conference' | 'workshop' | 'seminar' | 'meetup';
  isPaid: boolean;
  price: number;
  currency: string;
  startDate?: Date;
  endDate?: Date;
  venue?: string;
  address?: string;
  city?: string;
  country?: string;
  isOnline: boolean;
  meetingLink?: string;
  capacity?: number;
  images?: string[];
  tags?: string[];
  status: 'draft' | 'published' | 'cancelled' | 'completed';
  createdAt?: Date;
  updatedAt?: Date;
}

interface EventCreationAttributes extends Optional<EventAttributes, 'id' | 'isPaid' | 'currency' | 'isOnline' | 'status'> {}

class Event extends Model<EventAttributes, EventCreationAttributes> implements EventAttributes {
  public id!: number;
  public title!: string;
  public description?: string;
  public organizerId!: number;
  public eventType?: 'conference' | 'workshop' | 'seminar' | 'meetup';
  public isPaid!: boolean;
  public price!: number;
  public currency!: string;
  public startDate?: Date;
  public endDate?: Date;
  public venue?: string;
  public address?: string;
  public city?: string;
  public country?: string;
  public isOnline!: boolean;
  public meetingLink?: string;
  public capacity?: number;
  public images?: string[];
  public tags?: string[];
  public status!: 'draft' | 'published' | 'cancelled' | 'completed';
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

Event.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    title: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    organizerId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id',
      },
    },
    eventType: {
      type: DataTypes.ENUM('conference', 'workshop', 'seminar', 'meetup'),
      allowNull: true,
    },
    isPaid: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    price: {
      type: DataTypes.DECIMAL(10, 2),
      defaultValue: 0,
    },
    currency: {
      type: DataTypes.STRING(10),
      defaultValue: 'USD',
    },
    startDate: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    endDate: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    venue: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    address: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    city: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    country: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    isOnline: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    meetingLink: {
      type: DataTypes.STRING(500),
      allowNull: true,
    },
    capacity: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    images: {
      type: DataTypes.ARRAY(DataTypes.STRING),
      defaultValue: [],
    },
    tags: {
      type: DataTypes.ARRAY(DataTypes.STRING),
      defaultValue: [],
    },
    status: {
      type: DataTypes.ENUM('draft', 'published', 'cancelled', 'completed'),
      defaultValue: 'draft',
    },
  },
  {
    sequelize,
    modelName: 'Event',
    tableName: 'events',
    timestamps: true,
  }
);

export default Event;
