import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/db';

interface NewsAttributes {
  id: number;
  title: string;
  content?: string;
  authorId: number;
  category?: string;
  featuredImage?: string;
  tags?: string[];
  viewCount: number;
  status: 'draft' | 'published';
  createdAt?: Date;
  updatedAt?: Date;
}

interface NewsCreationAttributes extends Optional<NewsAttributes, 'id' | 'viewCount' | 'status'> {}

class News extends Model<NewsAttributes, NewsCreationAttributes> implements NewsAttributes {
  public id!: number;
  public title!: string;
  public content?: string;
  public authorId!: number;
  public category?: string;
  public featuredImage?: string;
  public tags?: string[];
  public viewCount!: number;
  public status!: 'draft' | 'published';
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

News.init(
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
    content: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    authorId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id',
      },
    },
    category: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    featuredImage: {
      type: DataTypes.STRING(500),
      allowNull: true,
    },
    tags: {
      type: DataTypes.ARRAY(DataTypes.STRING),
      defaultValue: [],
    },
    viewCount: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    status: {
      type: DataTypes.ENUM('draft', 'published'),
      defaultValue: 'draft',
    },
  },
  {
    sequelize,
    modelName: 'News',
    tableName: 'news',
    timestamps: true,
  }
);

export default News;
