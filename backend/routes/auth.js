const express = require('express');
const router = express.Router();
const admin = require('firebase-admin');
const User = require('../models/User');
const jwt = require('jsonwebtoken');

// Initialize Firebase Admin (if not already initialized)
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    }),
  });
}

// Middleware to verify Firebase token
const verifyFirebaseToken = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    
    if (!token) {
      console.log('❌ No token provided in request');
      return res.status(401).json({ error: 'No token provided' });
    }

    console.log('🔍 Verifying Firebase token, length:', token.length);
    console.log('🔍 Token preview:', token.substring(0, 50) + '...');
    
    const decodedToken = await admin.auth().verifyIdToken(token);
    console.log('✅ Firebase token verified successfully');
    req.firebaseUser = decodedToken;
    next();
  } catch (error) {
    console.error('❌ Firebase token verification error:', error.message);
    console.error('❌ Error details:', error);
    res.status(401).json({ error: 'Invalid token' });
  }
};

// POST /api/auth/login - Login or register user
router.post('/login', verifyFirebaseToken, async (req, res) => {
  try {
    console.log('🔐 Login attempt for Firebase user:', req.firebaseUser);
    const { uid, email, name, picture } = req.firebaseUser;
    
    // Check if user exists
    let user = await User.findOne({ firebaseUid: uid });
    console.log('👤 User found in database:', user ? 'Yes' : 'No');
    
    if (!user) {
      // Create new user
      console.log('📝 Creating new user...');
      user = new User({
        firebaseUid: uid,
        email,
        username: name || email.split('@')[0],
        avatar: picture
      });
      await user.save();
      console.log('✅ New user created:', user._id);
    } else {
      // Update existing user info
      console.log('🔄 Updating existing user...');
      user.email = email;
      if (name) user.username = name;
      if (picture) user.avatar = picture;
      user.lastSeen = new Date();
      await user.save();
      console.log('✅ User updated:', user._id);
    }

    // Generate JWT token
    if (!process.env.JWT_SECRET) {
      throw new Error('JWT_SECRET environment variable is required');
    }
    
    console.log('🔑 Generating JWT token...');
    const token = jwt.sign(
      { id: user._id, firebaseUid: uid },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );
    console.log('✅ JWT token generated');

    const responseData = {
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        avatar: user.avatar,
        anonymousMode: user.anonymousMode
      }
    };
    
    console.log('📤 Sending response:', { 
      hasToken: !!responseData.token, 
      hasUser: !!responseData.user,
      userId: responseData.user.id 
    });
    
    res.json(responseData);
  } catch (error) {
    console.error('❌ Login error:', error);
    res.status(500).json({ error: 'Login failed' });
  }
});

// POST /api/auth/verify - Verify JWT token
router.post('/verify', async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    
    if (!token) {
      return res.status(401).json({ error: 'No token provided' });
    }

    if (!process.env.JWT_SECRET) {
      return res.status(500).json({ error: 'Server configuration error' });
    }
    
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id);
    
    if (!user || !user.isActive) {
      return res.status(401).json({ error: 'User not found' });
    }

    res.json({
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        avatar: user.avatar,
        anonymousMode: user.anonymousMode
      }
    });
  } catch (error) {
    console.error('Token verification error:', error);
    res.status(401).json({ error: 'Invalid token' });
  }
});

// POST /api/auth/logout - Logout (client-side token removal)
router.post('/logout', (req, res) => {
  res.json({ message: 'Logged out successfully' });
});

module.exports = router;
