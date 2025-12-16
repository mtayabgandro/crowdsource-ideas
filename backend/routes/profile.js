// routes/profile.js
const express = require('express');
const User = require('../models/User');
const { authenticateToken } = require('../middleware/auth');
const auth = authenticateToken; // Alias for backward compatibility
const multer = require('multer');
const path = require('path');

const router = express.Router();

// Configure multer for avatar uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/avatars/');
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'avatar-' + req.user.id + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('Only image files are allowed!'), false);
  }
};

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  },
  fileFilter: fileFilter
});

// @desc    Get user profile by ID
// @route   GET /api/profile/:id
// @access  Public
router.get('/:id', async (req, res) => {
  try {
    const user = await User.findById(req.params.id)
      .select('-password')
      .lean();
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json(user);
  } catch (error) {
    console.error('Error fetching user:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// @desc    Get current user profile for editing
// @route   GET /api/profile/me/edit
// @access  Private
router.get('/me/edit', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id)
      .select('-password')
      .lean();
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json(user);
  } catch (error) {
    console.error('Error fetching user profile:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// @desc    Update user profile
// @route   PUT /api/profile/update
// @access  Private
router.put('/update', auth, upload.single('avatar'), async (req, res) => {
  try {
    const { bio, description, website, twitter, linkedin, github } = req.body;
    
    // Build update object
    const updateData = {
      bio: bio || '',
      description: description || '',
      socialLinks: {
        website: website || '',
        twitter: twitter || '',
        linkedin: linkedin || '',
        github: github || ''
      },
      updatedAt: Date.now()
    };

    // If avatar file was uploaded, add it to update data
    if (req.file) {
      updateData.avatar = `/uploads/avatars/${req.file.filename}`;
    }

    // Update user in database
    const user = await User.findByIdAndUpdate(
      req.user.id,
      { $set: updateData },
      { new: true, runValidators: true }
    ).select('-password');

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({
      success: true,
      message: 'Profile updated successfully',
      user: user
    });

  } catch (error) {
    console.error('Error updating profile:', error);
    
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({ error: errors.join(', ') });
    }
    
    res.status(500).json({ error: 'Error updating profile' });
  }
});

// @desc    Delete user avatar
// @route   DELETE /api/profile/avatar
// @access  Private
router.delete('/avatar', auth, async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.user.id,
      { 
        $set: { 
          avatar: '',
          updatedAt: Date.now()
        } 
      },
      { new: true }
    ).select('-password');

    res.json({
      success: true,
      message: 'Avatar removed successfully',
      user: user
    });
  } catch (error) {
    console.error('Error removing avatar:', error);
    res.status(500).json({ error: 'Error removing avatar' });
  }
});

module.exports = router;