import express from 'express';
import { body, validationResult } from 'express-validator';
import { Gallery, Photo, User, PhotoLike, Comment } from '../models';
import { protect } from '../middleware/auth';

const router = express.Router();

router.get('/', async (req: any, res: any) => {
  try {
    const { isPublic = true, page = 1, limit = 10 } = req.query;

    const galleries = await Gallery.findAndCountAll({
      where: { isPublic: isPublic === 'true' },
      include: [
        { model: User, as: 'owner', attributes: ['id', 'firstName', 'lastName', 'avatar'] },
        { model: Photo, as: 'photos', limit: 4 },
      ],
      limit: Number(limit),
      offset: (Number(page) - 1) * Number(limit),
      order: [['createdAt', 'DESC']],
    });

    res.json({
      success: true,
      data: galleries.rows,
      total: galleries.count,
      page: Number(page),
      totalPages: Math.ceil(galleries.count / Number(limit)),
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: (error as Error).message });
  }
});

router.get('/:id', async (req: any, res: any) => {
  try {
    const gallery = await Gallery.findByPk(req.params.id, {
      include: [
        { model: User, as: 'owner', attributes: ['id', 'firstName', 'lastName', 'avatar'] },
        {
          model: Photo,
          as: 'photos',
          include: [{ model: User, as: 'uploader', attributes: ['id', 'firstName', 'lastName', 'avatar'] }],
        },
      ],
    });

    if (!gallery) {
      return res.status(404).json({ message: 'Gallery not found' });
    }

    res.json({ success: true, data: gallery });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: (error as Error).message });
  }
});

router.post(
  '/',
  protect,
  [body('title').notEmpty().withMessage('Title is required')],
  async (req: any, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const gallery = await Gallery.create({
        ...req.body,
        ownerId: req.user.id,
      });

      res.status(201).json({ success: true, data: gallery });
    } catch (error) {
      res.status(500).json({ message: 'Server error', error: (error as Error).message });
    }
  }
);

router.put('/:id', protect, async (req: any, res) => {
  try {
    const gallery = await Gallery.findByPk(req.params.id);

    if (!gallery) {
      return res.status(404).json({ message: 'Gallery not found' });
    }

    if (gallery.ownerId !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized to update this gallery' });
    }

    await gallery.update(req.body);

    res.json({ success: true, data: gallery });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: (error as Error).message });
  }
});

router.delete('/:id', protect, async (req: any, res) => {
  try {
    const gallery = await Gallery.findByPk(req.params.id);

    if (!gallery) {
      return res.status(404).json({ message: 'Gallery not found' });
    }

    if (gallery.ownerId !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized to delete this gallery' });
    }

    await gallery.destroy();

    res.json({ success: true, message: 'Gallery deleted' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: (error as Error).message });
  }
});

router.post('/:id/photos', protect, async (req: any, res) => {
  try {
    const gallery = await Gallery.findByPk(req.params.id);

    if (!gallery) {
      return res.status(404).json({ message: 'Gallery not found' });
    }

    if (gallery.ownerId !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized to add photos to this gallery' });
    }

    const photos = await Promise.all(
      (req.body.photos as string[]).map((url: string) =>
        Photo.create({
          galleryId: gallery.id,
          url,
          caption: req.body.caption,
          uploadedBy: req.user.id,
        })
      )
    );

    res.status(201).json({ success: true, data: photos });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: (error as Error).message });
  }
});

router.delete('/photos/:photoId', protect, async (req: any, res) => {
  try {
    const photo = await Photo.findByPk(req.params.photoId);

    if (!photo) {
      return res.status(404).json({ message: 'Photo not found' });
    }

    const gallery = await Gallery.findByPk(photo.galleryId);

    if (gallery?.ownerId !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized to delete this photo' });
    }

    await photo.destroy();

    res.json({ success: true, message: 'Photo deleted' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: (error as Error).message });
  }
});

router.post('/photos/:id/like', protect, async (req: any, res) => {
  try {
    const photo = await Photo.findByPk(req.params.id);

    if (!photo) {
      return res.status(404).json({ message: 'Photo not found' });
    }

    const existing = await PhotoLike.findOne({
      where: { photoId: photo.id, userId: req.user.id },
    });

    if (existing) {
      await existing.destroy();
      res.json({ success: true, liked: false });
    } else {
      await PhotoLike.create({ photoId: photo.id, userId: req.user.id });
      res.json({ success: true, liked: true });
    }
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: (error as Error).message });
  }
});

export default router;
