import express from 'express';
import { User } from '../models';
import { protect } from '../middleware/auth';
import { Op } from 'sequelize';

const router = express.Router();

router.get('/', async (req: any, res: any) => {
  try {
    const { specialty, city, country, search, page = 1, limit = 10 } = req.query;

    const where: any = {};
    if (specialty) where.specialty = specialty;
    if (city) where.city = city;
    if (country) where.country = country;
    if (search) {
      where[Op.or] = [
        { firstName: { [Op.iLike]: `%${search}%` } },
        { lastName: { [Op.iLike]: `%${search}%` } },
        { specialty: { [Op.iLike]: `%${search}%` } },
      ];
    }

    const users = await User.findAndCountAll({
      where,
      attributes: { exclude: ['password'] },
      limit: Number(limit),
      offset: (Number(page) - 1) * Number(limit),
      order: [['createdAt', 'DESC']],
    });

    res.json({
      success: true,
      data: users.rows,
      total: users.count,
      page: Number(page),
      totalPages: Math.ceil(users.count / Number(limit)),
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: (error as Error).message });
  }
});

router.get('/:id', async (req: any, res: any) => {
  try {
    const user = await User.findByPk(req.params.id, {
      attributes: { exclude: ['password'] },
    });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({ success: true, data: user });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: (error as Error).message });
  }
});

router.put('/:id', protect, async (req: any, res) => {
  try {
    if (req.user.id !== Number(req.params.id) && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized to update this profile' });
    }

    const user = await User.findByPk(req.params.id);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const { password, email, ...updates } = req.body;
    await user.update(updates);

    res.json({ success: true, data: user });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: (error as Error).message });
  }
});

export default router;
