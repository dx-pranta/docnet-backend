import express, { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { body, validationResult } from 'express-validator';
import { User } from '../models';
import { protect } from '../middleware/auth';
import { sendVerificationCode, generateVerificationCode } from '../services/emailService';

const router = express.Router();

const generateToken = (id: number) => {
  return jwt.sign({ id }, process.env.JWT_SECRET!, {
    expiresIn: '7d',
  } as jwt.SignOptions);
};

const VERIFICATION_CODE_EXPIRY_MINUTES = 15;

const userResponse = (user: User) => ({
  id: user.id,
  email: user.email,
  firstName: user.firstName,
  lastName: user.lastName,
  title: user.title,
  specialty: user.specialty,
  role: user.role,
  avatar: user.avatar,
  hospital: user.hospital,
  bio: user.bio,
  qualifications: user.qualifications,
  coverPhoto: user.coverPhoto,
  ahpraId: user.ahpraId,
  yearsExperience: user.yearsExperience,
  isVerified: user.isVerified,
});

router.post(
  '/register',
  [
    body('email').isEmail().withMessage('Please provide a valid email'),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
    body('firstName').notEmpty().withMessage('First name is required'),
    body('lastName').notEmpty().withMessage('Last name is required'),
  ],
  async (req: Request, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { email, password, firstName, lastName, title, specialty, hospital } = req.body;

      const existingUser = await User.findOne({ where: { email } });
      if (existingUser) {
        return res.status(400).json({ message: 'User already exists with this email' });
      }

      const user = await User.create({
        email,
        password,
        firstName,
        lastName,
        title,
        specialty,
        hospital,
        role: 'user',
        isVerified: false,
      });

      const code = generateVerificationCode();
      user.verificationCode = code;
      user.verificationCodeExpires = new Date(Date.now() + VERIFICATION_CODE_EXPIRY_MINUTES * 60 * 1000);
      await user.save();

      try {
        await sendVerificationCode(email, code);
      } catch (emailError) {
        console.error('Failed to send verification email:', emailError);
      }

      const token = generateToken(user.id);

      res.status(201).json({
        success: true,
        token,
        user: userResponse(user),
      });
    } catch (error) {
      res.status(500).json({ message: 'Server error', error: (error as Error).message });
    }
  }
);

router.post(
  '/login',
  [
    body('email').isEmail().withMessage('Please provide a valid email'),
    body('password').exists().withMessage('Password is required'),
  ],
  async (req: Request, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { email, password } = req.body;

      const user = await User.findOne({ where: { email } });
      if (!user) {
        return res.status(401).json({ message: 'Invalid credentials' });
      }

      const isMatch = await user.validatePassword(password);
      if (!isMatch) {
        return res.status(401).json({ message: 'Invalid credentials' });
      }

      const code = generateVerificationCode();
      user.verificationCode = code;
      user.verificationCodeExpires = new Date(Date.now() + VERIFICATION_CODE_EXPIRY_MINUTES * 60 * 1000);
      user.isVerified = false;
      await user.save();

      try {
        await sendVerificationCode(email, code);
      } catch (emailError) {
        console.error('Failed to send verification email:', emailError);
      }

      const token = generateToken(user.id);

      res.json({
        success: true,
        token,
        user: userResponse(user),
      });
    } catch (error) {
      res.status(500).json({ message: 'Server error', error: (error as Error).message });
    }
  }
);

router.post(
  '/verify-email',
  [
    body('email').isEmail().withMessage('Please provide a valid email'),
    body('code').isLength({ min: 6, max: 6 }).withMessage('Verification code must be 6 digits'),
  ],
  async (req: Request, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { email, code } = req.body;

      const user = await User.findOne({ where: { email } });
      if (!user) {
        return res.status(400).json({ message: 'User not found' });
      }

      if (user.isVerified) {
        return res.json({ success: true, user: userResponse(user), message: 'Email already verified' });
      }

      if (user.verificationCode !== code) {
        return res.status(400).json({ message: 'Invalid verification code' });
      }

      if (!user.verificationCodeExpires || user.verificationCodeExpires < new Date()) {
        return res.status(400).json({ message: 'Verification code has expired' });
      }

      user.isVerified = true;
      user.verificationCode = undefined;
      user.verificationCodeExpires = undefined;
      await user.save();

      res.json({ success: true, user: userResponse(user) });
    } catch (error) {
      res.status(500).json({ message: 'Server error', error: (error as Error).message });
    }
  }
);

router.post(
  '/resend-code',
  [body('email').isEmail().withMessage('Please provide a valid email')],
  async (req: Request, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { email } = req.body;

      const user = await User.findOne({ where: { email } });
      if (!user) {
        return res.status(400).json({ message: 'User not found' });
      }

      if (user.isVerified) {
        return res.json({ success: true, message: 'Email already verified' });
      }

      const code = generateVerificationCode();
      user.verificationCode = code;
      user.verificationCodeExpires = new Date(Date.now() + VERIFICATION_CODE_EXPIRY_MINUTES * 60 * 1000);
      await user.save();

      try {
        await sendVerificationCode(email, code);
      } catch (emailError) {
        console.error('Failed to resend verification email:', emailError);
        return res.status(500).json({ message: 'Failed to send verification email' });
      }

      res.json({ success: true, message: 'Verification code resent' });
    } catch (error) {
      res.status(500).json({ message: 'Server error', error: (error as Error).message });
    }
  }
);

router.get('/me', protect, async (req: any, res) => {
  res.json({
    success: true,
    user: userResponse(req.user),
  });
});

export default router;
