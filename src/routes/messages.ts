import express from 'express';
import { body, validationResult } from 'express-validator';
import { Message, User, Connection } from '../models';
import { protect } from '../middleware/auth';
import { Op } from 'sequelize';

const router = express.Router();

router.get('/', protect, async (req: any, res) => {
  try {
    const userId = req.user.id;

    const messages = await Message.findAll({
      where: {
        [Op.or]: [
          { senderId: userId },
          { recipientId: userId },
        ],
      },
      order: [['createdAt', 'DESC']],
    });

    const conversations = new Map();
    messages.forEach((msg: any) => {
      const otherUserId = msg.senderId === userId ? msg.recipientId : msg.senderId;
      if (!conversations.has(otherUserId)) {
        conversations.set(otherUserId, {
          lastMessage: msg,
          unreadCount: msg.recipientId === userId && !msg.isRead ? 1 : 0,
        });
      } else {
        const conv = conversations.get(otherUserId);
        if (msg.recipientId === userId && !msg.isRead) {
          conv.unreadCount++;
        }
      }
    });

    const conversationList = await Promise.all(
      Array.from(conversations.entries()).map(async ([otherUserId, data]: [any, any]) => {
        const user = await User.findByPk(otherUserId, {
          attributes: ['id', 'firstName', 'lastName', 'avatar'],
        });
        return {
          user,
          lastMessage: data.lastMessage,
          unreadCount: data.unreadCount,
        };
      })
    );

    res.json({ success: true, data: conversationList });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: (error as Error).message });
  }
});

router.get('/:userId', protect, async (req: any, res) => {
  try {
    const otherUserId = Number(req.params.userId);
    const userId = req.user.id;

    const connection = await Connection.findOne({
      where: {
        [Op.or]: [
          { requesterId: userId, recipientId: otherUserId, status: 'accepted' },
          { requesterId: otherUserId, recipientId: userId, status: 'accepted' },
        ],
      },
    });

    if (!connection) {
      return res.status(403).json({ message: 'You need to be connected to message this user' });
    }

    const messages = await Message.findAll({
      where: {
        [Op.or]: [
          { senderId: userId, recipientId: otherUserId },
          { senderId: otherUserId, recipientId: userId },
        ],
      },
      include: [
        { model: User, as: 'sender', attributes: ['id', 'firstName', 'lastName', 'avatar'] },
        { model: User, as: 'recipient', attributes: ['id', 'firstName', 'lastName', 'avatar'] },
      ],
      order: [['createdAt', 'ASC']],
    });

    await Message.update(
      { isRead: true },
      { where: { senderId: otherUserId, recipientId: userId, isRead: false } }
    );

    res.json({ success: true, data: messages });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: (error as Error).message });
  }
});

router.post(
  '/',
  protect,
  [body('recipientId').isInt().withMessage('Recipient ID is required'), body('content').notEmpty().withMessage('Content is required')],
  async (req: any, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { recipientId, content } = req.body;

      const connection = await Connection.findOne({
        where: {
          [Op.or]: [
            { requesterId: req.user.id, recipientId, status: 'accepted' },
            { requesterId: recipientId, recipientId: req.user.id, status: 'accepted' },
          ],
        },
      });

      if (!connection) {
        return res.status(403).json({ message: 'You need to be connected to message this user' });
      }

      const message = await Message.create({
        senderId: req.user.id,
        recipientId,
        content,
      });

      const fullMessage = await Message.findByPk(message.id, {
        include: [
          { model: User, as: 'sender', attributes: ['id', 'firstName', 'lastName', 'avatar'] },
        ],
      });

      res.status(201).json({ success: true, data: fullMessage });
    } catch (error) {
      res.status(500).json({ message: 'Server error', error: (error as Error).message });
    }
  }
);

router.delete('/:id', protect, async (req: any, res) => {
  try {
    const message = await Message.findByPk(req.params.id);

    if (!message) {
      return res.status(404).json({ message: 'Message not found' });
    }

    if (message.senderId !== req.user.id && message.recipientId !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized to delete this message' });
    }

    await message.destroy();

    res.json({ success: true, message: 'Message deleted' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: (error as Error).message });
  }
});

export default router;
