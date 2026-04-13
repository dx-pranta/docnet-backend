import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/db';

interface PhotoLikeAttributes {
  photoId: number;
  userId: number;
}

class PhotoLike extends Model<PhotoLikeAttributes, Optional<PhotoLikeAttributes, never>> implements PhotoLikeAttributes {
  public photoId!: number;
  public userId!: number;
}

PhotoLike.init(
  {
    photoId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'photos',
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
  },
  {
    sequelize,
    modelName: 'PhotoLike',
    tableName: 'photo_likes',
    timestamps: false,
  }
);

export default PhotoLike;
