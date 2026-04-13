import express from 'express';
import { body, validationResult } from 'express-validator';
import { Event, User, EventAttendee } from '../models';
import { protect } from '../middleware/auth';

const router = express.Router();

router.get('/', async (req: any, res: any) => {
  try {
    const { type, isPaid, city, status = 'published', page = 1, limit = 10 } = req.query;

    const where: any = { status };
    if (type) where.eventType = type;
    if (isPaid !== undefined) where.isPaid = isPaid === 'true';
    if (city) where.city = city;

    const events = await Event.findAndCountAll({
      where,
      include: [{ model: User, as: 'organizer', attributes: ['id', 'firstName', 'lastName', 'title', 'avatar'] }],
      limit: Number(limit),
      offset: (Number(page) - 1) * Number(limit),
      order: [['startDate', 'ASC']],
    });

    res.json({
      success: true,
      data: events.rows,
      total: events.count,
      page: Number(page),
      totalPages: Math.ceil(events.count / Number(limit)),
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: (error as Error).message });
  }
});

router.get('/:id', async (req: any, res: any) => {
  try {
    const event = await Event.findByPk(req.params.id, {
      include: [
        { model: User, as: 'organizer', attributes: ['id', 'firstName', 'lastName', 'title', 'avatar', 'specialty'] },
        { model: User, as: 'attendees', attributes: ['id', 'firstName', 'lastName', 'avatar'] },
      ],
    });

    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    res.json({ success: true, data: event });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: (error as Error).message });
  }
});

router.post(
  '/',
  protect,
  [
    body('title').notEmpty().withMessage('Title is required'),
    body('description').notEmpty().withMessage('Description is required'),
    body('startDate').notEmpty().withMessage('Start date is required'),
  ],
  async (req: any, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const event = await Event.create({
        ...req.body,
        organizerId: req.user.id,
      });

      res.status(201).json({ success: true, data: event });
    } catch (error) {
      res.status(500).json({ message: 'Server error', error: (error as Error).message });
    }
  }
);

router.put('/:id', protect, async (req: any, res) => {
  try {
    const event = await Event.findByPk(req.params.id);

    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    if (event.organizerId !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized to update this event' });
    }

    await event.update(req.body);

    res.json({ success: true, data: event });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: (error as Error).message });
  }
});

router.delete('/:id', protect, async (req: any, res) => {
  try {
    const event = await Event.findByPk(req.params.id);

    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    if (event.organizerId !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized to delete this event' });
    }

    await event.destroy();

    res.json({ success: true, message: 'Event deleted' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: (error as Error).message });
  }
});

router.post('/:id/register', protect, async (req: any, res) => {
  try {
    const event = await Event.findByPk(req.params.id);

    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    const existing = await EventAttendee.findOne({
      where: { eventId: event.id, userId: req.user.id },
    });

    if (existing) {
      return res.status(400).json({ message: 'Already registered for this event' });
    }

    if (event.capacity) {
      const count = await EventAttendee.count({ where: { eventId: event.id } });
      if (count >= event.capacity) {
        return res.status(400).json({ message: 'Event is at full capacity' });
      }
    }

    await EventAttendee.create({
      eventId: event.id,
      userId: req.user.id,
    });

    res.json({ success: true, message: 'Successfully registered for event' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: (error as Error).message });
  }
});

router.delete('/:id/register', protect, async (req: any, res) => {
  try {
    const event = await Event.findByPk(req.params.id);

    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    const deleted = await EventAttendee.destroy({
      where: { eventId: event.id, userId: req.user.id },
    });

    if (!deleted) {
      return res.status(400).json({ message: 'Not registered for this event' });
    }

    res.json({ success: true, message: 'Registration cancelled' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: (error as Error).message });
  }
});

export default router;
