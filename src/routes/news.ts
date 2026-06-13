import express from 'express';
import { body, validationResult } from 'express-validator';
import jwt from 'jsonwebtoken';
import { News, User, NewsLike, Comment } from '../models';
import { protect } from '../middleware/auth';

const router = express.Router();

router.get('/', async (req: any, res: any) => {
  try {
    const { category, status = 'published', page = 1, limit = 10 } = req.query;

    const where: any = { status };
    if (category) where.category = category;

    const news = await News.findAndCountAll({
      where,
      include: [
        { model: User, as: 'author', attributes: ['id', 'firstName', 'lastName', 'title', 'avatar'] },
        { model: User, as: 'likedBy', attributes: ['id'], through: { attributes: [] } },
      ],
      limit: Number(limit),
      offset: (Number(page) - 1) * Number(limit),
      order: [['createdAt', 'DESC']],
    });

    const newsWithCounts = news.rows.map((article: any) => {
      const json = article.toJSON();
      const likedBy = json.likedBy || [];
      return {
        ...json,
        likes: likedBy,
        likesCount: likedBy.length,
      };
    });

    res.json({
      success: true,
      data: newsWithCounts,
      total: news.count,
      page: Number(page),
      totalPages: Math.ceil(news.count / Number(limit)),
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: (error as Error).message });
  }
});

router.get('/:id', async (req: any, res: any) => {
  try {
    // include author and likedBy users so frontend can show likes and whether current user liked
    const news = await News.findByPk(req.params.id, {
      include: [
        { model: User, as: 'author', attributes: ['id', 'firstName', 'lastName', 'title', 'avatar'] },
        { model: User, as: 'likedBy', attributes: ['id'] },
      ],
    });

    if (!news) {
      return res.status(404).json({ message: 'News article not found' });
    }

    await news.increment('viewCount');

    // Try to read token (if present) to determine whether the current user liked this article
    let currentUserId: number | null = null;
    try {
      const authHeader = req.headers.authorization || '';
      if (authHeader.startsWith('Bearer ')) {
        const token = authHeader.split(' ')[1];
        const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { id: number };
        currentUserId = decoded?.id ?? null;
      }
    } catch (err) {
      // ignore token errors - treat as not logged in
      currentUserId = null;
    }

    const newsJson: any = news.toJSON();
    const likedBy = newsJson.likedBy || [];
    newsJson.likes = likedBy; // keep backwards compat with frontend expecting .likes
    newsJson.likesCount = likedBy.length;
    newsJson.liked = currentUserId ? likedBy.some((u: any) => u.id === currentUserId) : false;

    res.json({ success: true, data: newsJson });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: (error as Error).message });
  }
});

router.post(
  '/',
  protect,
  [
    body('title').notEmpty().withMessage('Title is required'),
    body('content').notEmpty().withMessage('Content is required'),
  ],
  async (req: any, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const news = await News.create({
        ...req.body,
        authorId: req.user.id,
      });

      res.status(201).json({ success: true, data: news });
    } catch (error) {
      res.status(500).json({ message: 'Server error', error: (error as Error).message });
    }
  }
);

router.put('/:id', protect, async (req: any, res) => {
  try {
    const news = await News.findByPk(req.params.id);

    if (!news) {
      return res.status(404).json({ message: 'News article not found' });
    }

    if (news.authorId !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized to update this article' });
    }

    await news.update(req.body);

    res.json({ success: true, data: news });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: (error as Error).message });
  }
});

router.delete('/:id', protect, async (req: any, res) => {
  try {
    const news = await News.findByPk(req.params.id);

    if (!news) {
      return res.status(404).json({ message: 'News article not found' });
    }

    if (news.authorId !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized to delete this article' });
    }

    await news.destroy();

    res.json({ success: true, message: 'Article deleted' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: (error as Error).message });
  }
});

router.post('/:id/like', protect, async (req: any, res) => {
  try {
    const news = await News.findByPk(req.params.id);

    if (!news) {
      return res.status(404).json({ message: 'News article not found' });
    }

    // allow optional reaction type (emoji name). default to 'like'
    const { type = 'like' } = req.body as { type?: string };

    // find existing like for this user/article
    const existing = await NewsLike.findOne({
      where: { newsId: news.id, userId: req.user.id },
    });

    if (existing) {
      // if same type, remove reaction (toggle off). if different type, update it
      if ((existing as any).type === type) {
        await existing.destroy();
        res.json({ success: true, liked: false });
      } else {
        await existing.update({ type });
        res.json({ success: true, liked: true, type });
      }
    } else {
      await NewsLike.create({ newsId: news.id, userId: req.user.id, type });
      res.json({ success: true, liked: true, type });
    }
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: (error as Error).message });
  }
});

router.get('/:id/comments', async (req: any, res: any) => {
  try {
    const comments = await Comment.findAll({
      where: { targetType: 'news', targetId: req.params.id },
      include: [{ model: User, as: 'author', attributes: ['id', 'firstName', 'lastName', 'avatar'] }],
      order: [['createdAt', 'DESC']],
    });

    res.json({ success: true, data: comments });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: (error as Error).message });
  }
});

router.post('/:id/comments', protect, async (req: any, res) => {
  try {
    const comment = await Comment.create({
      content: req.body.content,
      authorId: req.user.id,
      targetType: 'news',
      targetId: Number(req.params.id),
    });

    const fullComment = await Comment.findByPk(comment.id, {
      include: [{ model: User, as: 'author', attributes: ['id', 'firstName', 'lastName', 'avatar'] }],
    });

    res.status(201).json({ success: true, data: fullComment });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: (error as Error).message });
  }
});

router.delete('/comments/:commentId', protect, async (req: any, res) => {
  try {
    const comment = await Comment.findByPk(req.params.commentId);

    if (!comment) {
      return res.status(404).json({ message: 'Comment not found' });
    }

    if (comment.authorId !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized to delete this comment' });
    }

    await comment.destroy();

    res.json({ success: true, message: 'Comment deleted' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: (error as Error).message });
  }
});

export default router;
