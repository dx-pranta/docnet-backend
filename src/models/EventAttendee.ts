import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/db';

interface EventAttendeeAttributes {
  eventId: number;
  userId: number;
  registeredAt?: Date;
}

class EventAttendee extends Model<EventAttendeeAttributes, Optional<EventAttendeeAttributes, 'registeredAt'>> implements EventAttendeeAttributes {
  public eventId!: number;
  public userId!: number;
  public readonly registeredAt!: Date;
}

EventAttendee.init(
  {
    eventId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'events',
        key: 'id',
      },
    },
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id',
      },
    },
    registeredAt: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    sequelize,
    modelName: 'EventAttendee',
    tableName: 'event_attendees',
    timestamps: false,
  }
);

export default EventAttendee;
