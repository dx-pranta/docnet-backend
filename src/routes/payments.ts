import express from 'express';
import Stripe from 'stripe';
import { body, validationResult } from 'express-validator';
import { Payment, Event, EventAttendee, User } from '../models';
import { protect } from '../middleware/auth';

const router = express.Router();

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2023-10-16',
});

router.post(
  '/stripe/create-intent',
  protect,
  [body('eventId').isInt().withMessage('Event ID is required')],
  async (req: any, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { eventId } = req.body;

      const event = await Event.findByPk(eventId, {
        include: [{ model: User, as: 'organizer' }],
      });

      if (!event) {
        return res.status(404).json({ message: 'Event not found' });
      }

      if (!event.isPaid) {
        return res.status(400).json({ message: 'This event is free' });
      }

      const existingRegistration = await EventAttendee.findOne({
        where: { eventId, userId: req.user.id },
      });

      if (existingRegistration) {
        return res.status(400).json({ message: 'Already registered for this event' });
      }

      const amountInCents = Math.round(Number(event.price) * 100);

      const paymentIntent = await stripe.paymentIntents.create({
        amount: amountInCents,
        currency: event.currency.toLowerCase(),
        metadata: {
          eventId: event.id.toString(),
          userId: req.user.id.toString(),
        },
      });

      const payment = await Payment.create({
        userId: req.user.id,
        eventId,
        amount: event.price,
        currency: event.currency,
        paymentMethod: 'stripe',
        paymentId: paymentIntent.id,
        status: 'pending',
      });

      res.json({
        success: true,
        data: {
          clientSecret: paymentIntent.client_secret,
          paymentId: payment.id,
        },
      });
    } catch (error) {
      res.status(500).json({ message: 'Server error', error: (error as Error).message });
    }
  }
);

router.post('/stripe/webhook', express.raw({ type: 'application/json' }), async (req: any, res: any) => {
  const sig = req.headers['stripe-signature']!;
  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET!);
  } catch (err) {
    console.error('Webhook signature verification failed:', (err as Error).message);
    return res.status(400).send(`Webhook Error: ${(err as Error).message}`);
  }

  if (event.type === 'payment_intent.succeeded') {
    const paymentIntent = event.data.object as Stripe.PaymentIntent;
    const { eventId, userId } = paymentIntent.metadata;

    await Payment.update(
      { status: 'completed' },
      { where: { paymentId: paymentIntent.id } }
    );

    await EventAttendee.findOrCreate({
      where: {
        eventId: Number(eventId),
        userId: Number(userId),
      },
    });
  }

  res.json({ received: true });
});

router.post('/stripe/confirm', protect, async (req: any, res) => {
  try {
    const { paymentId } = req.body;

    const payment = await Payment.findByPk(paymentId);

    if (!payment) {
      return res.status(404).json({ message: 'Payment not found' });
    }

    if (payment.userId !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    const paymentIntent = await stripe.paymentIntents.retrieve(payment.paymentId);

      if (paymentIntent.status === 'succeeded') {
        await payment.update({ status: 'completed' });

        await EventAttendee.findOrCreate({
          where: {
            eventId: payment.eventId,
            userId: req.user.id,
          },
        });

      res.json({ success: true, message: 'Payment confirmed' });
    } else {
      res.status(400).json({ message: 'Payment not completed', status: paymentIntent.status });
    }
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: (error as Error).message });
  }
});

router.get('/history', protect, async (req: any, res) => {
  try {
    const payments = await Payment.findAll({
      where: { userId: req.user.id },
      include: [
        { model: Event, as: 'event', attributes: ['id', 'title', 'startDate'] },
      ],
      order: [['createdAt', 'DESC']],
    });

    res.json({ success: true, data: payments });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: (error as Error).message });
  }
});

router.post(
  '/refund',
  protect,
  [body('paymentId').isInt().withMessage('Payment ID is required')],
  async (req: any, res) => {
    try {
      const { paymentId } = req.body;

      const payment = await Payment.findByPk(paymentId, {
        include: [{ model: Event, as: 'event' }],
      });

      if (!payment) {
        return res.status(404).json({ message: 'Payment not found' });
      }

      if (payment.userId !== req.user.id) {
        return res.status(403).json({ message: 'Not authorized' });
      }

      if (payment.status !== 'completed') {
        return res.status(400).json({ message: 'Payment cannot be refunded' });
      }

      if (payment.paymentMethod === 'stripe') {
        await stripe.refunds.create({
          payment_intent: payment.paymentId,
        });
      }

      await payment.update({ status: 'refunded' });
      await EventAttendee.destroy({
        where: { eventId: payment.eventId, userId: req.user.id },
      });

      res.json({ success: true, message: 'Refund processed' });
    } catch (error) {
      res.status(500).json({ message: 'Server error', error: (error as Error).message });
    }
  }
);

export default router;
