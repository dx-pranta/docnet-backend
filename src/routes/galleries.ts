import express from 'express';
import { body, validationResult } from 'express-validator';
import { Gallery, Photo, User, PhotoLike, Comment } from '../models';
import { protect } from '../middleware/auth';

const router = express.Router();

router.get('/', async (req: any, res: any) => {
  try {
    const { isPublic = 'true', page = 1, limit = 10 } = req.query;
    const pageNumber = Number(page);
    const limitNumber = Number(limit);

    const isPublicFilter = String(isPublic) === 'true';
    const where = { isPublic: isPublicFilter };

    const total = await Gallery.count({ where });

    const galleries = await Gallery.findAll({
      where,
      limit: limitNumber,
      offset: (pageNumber - 1) * limitNumber,
      order: [['createdAt', 'DESC']],
    });

    const galleryIds = galleries.map((gallery) => gallery.id);
    const galleriesWithRelations = galleryIds.length
      ? await Gallery.findAll({
          where: { id: galleryIds },
          include: [
            { model: User, as: 'owner', attributes: ['id', 'firstName', 'lastName', 'avatar'] },
            { model: Photo, as: 'photos' },
          ],
          order: [['createdAt', 'DESC']],
        })
      : [];

    res.json({
      success: true,
      data: galleriesWithRelations,
      total,
      page: pageNumber,
      totalPages: Math.ceil(total / limitNumber),
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
          include: [
            { model: User, as: 'uploader', attributes: ['id', 'firstName', 'lastName', 'avatar'] },
            { model: User, as: 'likedBy', attributes: ['id'], through: { attributes: [] } },
          ],
        },
      ],
    });

    if (!gallery) {
      return res.status(404).json({ message: 'Gallery not found' });
    }

    const galleryJson: any = gallery.toJSON();
    galleryJson.photos = (galleryJson.photos || []).map((photo: any) => ({
      ...photo,
      likes: (photo.likedBy || []).map((likedUser: any) => likedUser.id),
    }));

    res.json({ success: true, data: galleryJson });
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
