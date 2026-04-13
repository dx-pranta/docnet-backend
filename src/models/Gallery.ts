import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/db';

interface GalleryAttributes {
  id: number;
  title: string;
  description?: string;
  ownerId: number;
  isPublic: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

interface GalleryCreationAttributes extends Optional<GalleryAttributes, 'id' | 'isPublic'> {}

class Gallery extends Model<GalleryAttributes, GalleryCreationAttributes> implements GalleryAttributes {
  public id!: number;
  public title!: string;
  public description?: string;
  public ownerId!: number;
  public isPublic!: boolean;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

Gallery.init(
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
    ownerId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id',
      },
    },
    isPublic: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
    },
  },
  {
    sequelize,
    modelName: 'Gallery',
    tableName: 'galleries',
    timestamps: true,
  }
);

export default Gallery;
