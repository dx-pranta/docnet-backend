import express from 'express';
import { body, validationResult } from 'express-validator';
import { Connection, User } from '../models';
import { protect } from '../middleware/auth';
import { Op } from 'sequelize';

const router = express.Router();

router.get('/', protect, async (req: any, res) => {
  try {
    const connections = await Connection.findAll({
      where: {
        [Op.or]: [
          { requesterId: req.user.id },
          { recipientId: req.user.id },
        ],
        status: 'accepted',
      },
      include: [
        { model: User, as: 'requester', attributes: ['id', 'firstName', 'lastName', 'title', 'specialty', 'avatar'] },
        { model: User, as: 'recipient', attributes: ['id', 'firstName', 'lastName', 'title', 'specialty', 'avatar'] },
      ],
    });

    const formattedConnections = connections.map((conn: any) => {
      const isRequester = conn.requesterId === req.user.id;
      return {
        id: conn.id,
        user: isRequester ? conn.recipient : conn.requester,
        connectedAt: conn.updatedAt,
      };
    });

    res.json({ success: true, data: formattedConnections });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: (error as Error).message });
  }
});

router.get('/requests', protect, async (req: any, res) => {
  try {
    const requests = await Connection.findAll({
      where: {
        recipientId: req.user.id,
        status: 'pending',
      },
      include: [
        { model: User, as: 'requester', attributes: ['id', 'firstName', 'lastName', 'title', 'specialty', 'avatar'] },
      ],
    });

    res.json({ success: true, data: requests });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: (error as Error).message });
  }
});

router.get('/requests/sent', protect, async (req: any, res) => {
  try {
    const sentRequests = await Connection.findAll({
      where: {
        requesterId: req.user.id,
        status: 'pending',
      },
      include: [
        { model: User, as: 'recipient', attributes: ['id', 'firstName', 'lastName', 'title', 'specialty', 'avatar'] },
      ],
    });

    res.json({ success: true, data: sentRequests });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: (error as Error).message });
  }
});

router.post(
  '/',
  protect,
  [body('recipientId').isInt().withMessage('Recipient ID is required')],
  async (req: any, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { recipientId } = req.body;

      if (req.user.id === recipientId) {
        return res.status(400).json({ message: 'Cannot connect with yourself' });
      }

      const existing = await Connection.findOne({
        where: {
          [Op.or]: [
            { requesterId: req.user.id, recipientId },
            { requesterId: recipientId, recipientId: req.user.id },
          ],
        },
      });

      if (existing) {
        return res.status(400).json({ message: 'Connection request already exists' });
      }

      const connection = await Connection.create({
        requesterId: req.user.id,
        recipientId,
        status: 'pending',
      });

      res.status(201).json({ success: true, data: connection });
    } catch (error) {
      res.status(500).json({ message: 'Server error', error: (error as Error).message });
    }
  }
);

router.put('/:id', protect, async (req: any, res) => {
  try {
    const { status } = req.body;
    const connection = await Connection.findByPk(req.params.id);

    if (!connection) {
      return res.status(404).json({ message: 'Connection not found' });
    }

    if (connection.recipientId !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized to update this connection' });
    }

    if (!['accepted', 'rejected'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }

    await connection.update({ status });

    res.json({ success: true, data: connection });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: (error as Error).message });
  }
});

router.delete('/:id', protect, async (req: any, res) => {
  try {
    const connection = await Connection.findByPk(req.params.id);

    if (!connection) {
      return res.status(404).json({ message: 'Connection not found' });
    }

    if (connection.requesterId !== req.user.id && connection.recipientId !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized to delete this connection' });
    }

    await connection.destroy();

    res.json({ success: true, message: 'Connection removed' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: (error as Error).message });
  }
});

export default router;
