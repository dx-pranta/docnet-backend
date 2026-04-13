import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/db';

interface PhotoAttributes {
  id: number;
  galleryId: number;
  url: string;
  caption?: string;
  uploadedBy: number;
  createdAt?: Date;
  updatedAt?: Date;
}

interface PhotoCreationAttributes extends Optional<PhotoAttributes, 'id'> {}

class Photo extends Model<PhotoAttributes, PhotoCreationAttributes> implements PhotoAttributes {
  public id!: number;
  public galleryId!: number;
  public url!: string;
  public caption?: string;
  public uploadedBy!: number;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

Photo.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    galleryId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'galleries',
        key: 'id',
      },
    },
    url: {
      type: DataTypes.STRING(500),
      allowNull: false,
    },
    caption: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    uploadedBy: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id',
      },
    },
  },
  {
    sequelize,
    modelName: 'Photo',
    tableName: 'photos',
    timestamps: true,
  }
);

export default Photo;
