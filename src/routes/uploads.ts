import express from 'express';
import multer from 'multer';

import { protect } from '../middleware/auth';
import { cloudinary, hasCloudinaryConfig } from '../config/cloudinary';

const router = express.Router();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
});

const uploadToCloudinary = (buffer: Buffer, folder: string, blurSensitiveData: boolean) =>
  new Promise<string>((resolve, reject) => {
    const options: any = {
      folder,
      resource_type: 'image',
    };

    if (blurSensitiveData) {
      options.transformation = [{ effect: 'blur_faces:2000' }];
    }

    const stream = cloudinary.uploader.upload_stream(
      options,
      (error, result) => {
        if (error || !result) {
          reject(error || new Error('Upload failed'));
          return;
        }

        resolve(result.secure_url);
      }
    );

    stream.end(buffer);
  });

router.post('/image', protect, upload.single('file'), async (req: any, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'Image file is required' });
    }

    if (!req.file.mimetype.startsWith('image/')) {
      return res.status(400).json({ message: 'Only image uploads are supported' });
    }

    if (!hasCloudinaryConfig) {
      return res.status(400).json({
        message: 'Cloudinary is not configured. Set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET.',
      });
    }

    const blurSensitiveData = req.body.blurSensitiveData === 'true';
    const url = await uploadToCloudinary(req.file.buffer, 'docnet', blurSensitiveData);

    res.status(201).json({
      success: true,
      data: {
        url,
        originalName: req.file.originalname,
      },
    });
  } catch (error) {
    const message = (error as Error).message;
    const status = message.includes('Invalid Signature') ? 400 : 500;
    res.status(status).json({ message: 'Image upload failed', error: message });
  }
});

export default router;
