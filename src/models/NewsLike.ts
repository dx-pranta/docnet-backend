import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/db';

interface NewsLikeAttributes {
  newsId: number;
  userId: number;
  type?: string | null;
}

class NewsLike extends Model<NewsLikeAttributes, Optional<NewsLikeAttributes, never>> implements NewsLikeAttributes {
  public newsId!: number;
  public userId!: number;
  public type?: string | null;
}

NewsLike.init(
  {
    newsId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'news',
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
    type: {
      type: DataTypes.STRING(50),
      allowNull: true,
      defaultValue: 'like',
    },
  },
  {
    sequelize,
    modelName: 'NewsLike',
    tableName: 'news_likes',
    timestamps: false,
  }
);

export default NewsLike;
