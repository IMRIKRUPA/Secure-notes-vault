import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { authenticator } from 'otplib';
import qrcode from 'qrcode';
import { randomBytes } from 'crypto';

import User from '../models/User.js';
import { 
  authenticateToken, 
  generateTokens, 
  setTokenCookies, 
  clearTokenCookies 
} from '../middleware/auth.js';
import { 
  validate, 
  signupSchema, 
  loginSchema, 
  mfaVerificationSchema 
} from '../middleware/validation.js';
import { sendWelcomeEmail, sendLoginNotification } from '../services/email.js';

const router = express.Router();

// Signup endpoint
router.post('/signup', validate(signupSchema), async (req, res) => {
  try {
    const { name, email, password } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists with this email' });
    }

    // Generate MFA secret
    const secret = authenticator.generateSecret();
    const serviceName = 'Secure Notes Vault';
    const accountName = email;
    const otpauth = authenticator.keyuri(accountName, serviceName, secret);

    // Generate QR code
    const qrCodeDataURL = await qrcode.toDataURL(otpauth);

    // Create user (password will be hashed by pre-save middleware)
    const user = new User({
      name,
      email,
      passwordHash: password, // Will be hashed by middleware
      mfa: {
        enabled: false, // Will be enabled after verification
        secret: secret,
      },
    });

    await user.save();

    // Generate temporary token for MFA verification
    const tempToken = jwt.sign(
      { userId: user._id, purpose: 'mfa-setup' },
      process.env.JWT_ACCESS_SECRET,
      { expiresIn: '10m' }
    );

    res.status(201).json({
      message: 'User created successfully',
      tempToken,
      qrCode: qrCodeDataURL,
      secret: secret,
    });

  } catch (error) {
    console.error('Signup error:', error);
    res.status(500).json({ message: 'Server error during signup' });
  }
});

// MFA verification endpoint (completes signup)
router.post('/verify-mfa', validate(mfaVerificationSchema), async (req, res) => {
  try {
    const { token, mfaCode } = req.body;

    // Verify temporary token
    const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET);
    if (decoded.purpose !== 'mfa-setup') {
      return res.status(400).json({ message: 'Invalid token purpose' });
    }

    const user = await User.findById(decoded.userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Verify MFA code
    const isValid = authenticator.verify({
      token: mfaCode,
      secret: user.mfa.secret,
    });

    if (!isValid) {
      return res.status(400).json({ message: 'Invalid MFA code' });
    }

    // Enable MFA
    user.mfa.enabled = true;
    user.lastLogin = new Date();
    await user.save();

    // Generate auth tokens
    const { accessToken, refreshToken } = generateTokens(user._id);
    setTokenCookies(res, accessToken, refreshToken);

    // Send welcome email
    try {
      await sendWelcomeEmail(user.email, user.name);
    } catch (emailError) {
      console.error('Failed to send welcome email:', emailError);
    }

    res.json({
      message: 'MFA verification successful',
      user: user.toSafeObject(),
    });

  } catch (error) {
    if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
      return res.status(400).json({ message: 'Invalid or expired token' });
    }
    
    console.error('MFA verification error:', error);
    res.status(500).json({ message: 'Server error during MFA verification' });
  }
});

// Login endpoint
router.post('/login', validate(loginSchema), async (req, res) => {
  try {
    const { email, password, mfaCode } = req.body;

    // Find user
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Check password
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // If MFA is enabled, require MFA code
    if (user.mfa.enabled) {
      if (!mfaCode) {
        // Generate temporary token for MFA verification
        const tempToken = jwt.sign(
          { userId: user._id, purpose: 'mfa-login' },
          process.env.JWT_ACCESS_SECRET,
          { expiresIn: '5m' }
        );

        return res.json({
          requiresMFA: true,
          tempToken,
          message: 'MFA code required',
        });
      }

      // Verify MFA code
      const isValidMFA = authenticator.verify({
        token: mfaCode,
        secret: user.mfa.secret,
      });

      if (!isValidMFA) {
        return res.status(401).json({ message: 'Invalid MFA code' });
      }
    }

    // Update last login
    user.lastLogin = new Date();
    await user.save();

    // Generate auth tokens
    const { accessToken, refreshToken } = generateTokens(user._id);
    setTokenCookies(res, accessToken, refreshToken);

    // Send login notification email
    try {
      const loginInfo = {
        timestamp: new Date().toLocaleString(),
        ip: req.ip || req.connection.remoteAddress,
        userAgent: req.get('User-Agent'),
      };
      await sendLoginNotification(user.email, user.name, loginInfo);
    } catch (emailError) {
      console.error('Failed to send login notification:', emailError);
    }

    res.json({
      message: 'Login successful',
      user: user.toSafeObject(),
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server error during login' });
  }
});

// Refresh token endpoint
router.post('/refresh', async (req, res) => {
  try {
    const refreshToken = req.cookies.refreshToken;
    
    if (!refreshToken) {
      return res.status(401).json({ message: 'Refresh token required' });
    }

    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
    const user = await User.findById(decoded.userId);
    
    if (!user) {
      return res.status(401).json({ message: 'User not found' });
    }

    // Generate new tokens
    const { accessToken, refreshToken: newRefreshToken } = generateTokens(user._id);
    setTokenCookies(res, accessToken, newRefreshToken);

    res.json({
      message: 'Token refreshed successfully',
      user: user.toSafeObject(),
    });

  } catch (error) {
    clearTokenCookies(res);
    
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ message: 'Refresh token expired' });
    }
    
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ message: 'Invalid refresh token' });
    }
    
    console.error('Token refresh error:', error);
    res.status(500).json({ message: 'Server error during token refresh' });
  }
});

// Get current user
router.get('/me', authenticateToken, async (req, res) => {
  res.json({
    user: req.user.toSafeObject(),
  });
});

// Logout endpoint
router.post('/logout', (req, res) => {
  clearTokenCookies(res);
  res.json({ message: 'Logout successful' });
});

export default router;