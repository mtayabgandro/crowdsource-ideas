const express = require('express');
const mongoose = require('mongoose');
const path = require('path');
const multer = require('multer');
const fs = require('fs');
const User = require('../models/User');
const Post = require('../models/Post');
const { authenticateToken, requireAdmin } = require('../middleware/auth');

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/avatars/');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ storage: storage });

const router = express.Router();

// Get user profile by ID
router.get('/:id', async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user || !user.isActive) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({
      _id: user._id,
      username: user.username,
      avatar: user.avatar,
      bio: user.bio,
      description: user.description,
      socialLinks: user.socialLinks,
      role: user.role,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt
    });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ error: 'Failed to fetch user' });
  }
});

// Get user stats (for dashboard)
router.get('/:id/stats', authenticateToken, async (req, res) => {
  try {
    // Only allow users to see their own stats or admins to see anyone's
    if (req.user._id.toString() !== req.params.id && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Not authorized' });
    }

    const userId = req.params.id;

    const [totalPosts, totalLikes, totalViews, totalComments] = await Promise.all([
      Post.countDocuments({ author: userId, isActive: true }),
      Post.aggregate([
        { $match: { author: new mongoose.Types.ObjectId(userId), isActive: true } },
        { $group: { _id: null, totalLikes: { $sum: { $size: '$likes' } } } }
      ]),
      Post.aggregate([
        { $match: { author: new mongoose.Types.ObjectId(userId), isActive: true } },
        { $group: { _id: null, totalViews: { $sum: '$views' } } }
      ]),
      Post.aggregate([
        { $match: { author: new mongoose.Types.ObjectId(userId), isActive: true } },
        { $group: { _id: null, totalComments: { $sum: { $size: '$comments' } } } }
      ])
    ]);

    res.json({
      totalPosts: totalPosts || 0,
      totalLikes: totalLikes[0]?.totalLikes || 0,
      totalViews: totalViews[0]?.totalViews || 0,
      totalComments: totalComments[0]?.totalComments || 0
    });
  } catch (error) {
    console.error('Get user stats error:', error);
    res.status(500).json({ error: 'Failed to fetch user stats' });
  }
});

// Update user profile
router.put('/:id', authenticateToken, upload.single('avatar'), async (req, res) => {
  try {
    // Check if user is updating their own profile or is admin
    if (req.user._id.toString() !== req.params.id && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Not authorized to update this profile' });
    }

    const { username, email, bio, description, socialLinks, role, isActive, removeAvatar } = req.body;

    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Only admins can change role and isActive
    if (req.user.role !== 'admin') {
      if (role !== undefined || isActive !== undefined) {
        return res.status(403).json({ error: 'Not authorized to change role or status' });
      }
    }

    // Check for unique constraints
    if (username && username !== user.username) {
      const existingUser = await User.findOne({ username: username.toLowerCase() });
      if (existingUser) {
        return res.status(400).json({ error: 'Username already taken' });
      }
      user.username = username.trim();
    }

    if (email && email !== user.email) {
      const existingUser = await User.findOne({ email: email.toLowerCase() });
      if (existingUser) {
        return res.status(400).json({ error: 'Email already registered' });
      }
      user.email = email.toLowerCase().trim();
    }

    if (bio !== undefined) user.bio = bio.trim();
    if (description !== undefined) user.description = description.trim();
    
    const oldAvatar = user.avatar;
    if (req.file) {
      user.avatar = `/uploads/avatars/${req.file.filename}`;
      if (oldAvatar) {
        const oldAvatarPath = path.join(__dirname, '..', oldAvatar);
        fs.unlink(oldAvatarPath, (err) => {
          if (err) console.error(`Failed to delete old avatar: ${oldAvatarPath}`, err);
        });
      }
    } else if (removeAvatar) {
      user.avatar = null;
      if (oldAvatar) {
        const oldAvatarPath = path.join(__dirname, '..', oldAvatar);
        fs.unlink(oldAvatarPath, (err) => {
          if (err) console.error(`Failed to delete old avatar: ${oldAvatarPath}`, err);
        });
      }
    }

    if (socialLinks) user.socialLinks = JSON.parse(socialLinks);
    if (role && ['user', 'moderator', 'admin'].includes(role)) user.role = role;
    if (isActive !== undefined) user.isActive = isActive;

    await user.save();

    res.json({
      message: 'User updated successfully',
      user: {
        _id: user._id,
        username: user.username,
        email: user.email,
        avatar: user.avatar,
        bio: user.bio,
        description: user.description,
        socialLinks: user.socialLinks,
        role: user.role,
        isActive: user.isActive,
        updatedAt: user.updatedAt
      }
    });
  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({ error: 'Failed to update user' });
  }
});

// Delete user (admin only)
router.delete('/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Soft delete - deactivate user
    user.isActive = false;
    await user.save();

    // Optionally deactivate all user's posts
    await Post.updateMany(
      { author: req.params.id },
      { isActive: false }
    );

    res.json({ message: 'User deactivated successfully' });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({ error: 'Failed to delete user' });
  }
});

// Get all users (admin only)
router.get('/', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;
    const search = req.query.search || '';

    let query = {};
    if (search) {
      query = {
        $or: [
          { username: { $regex: search, $options: 'i' } },
          { email: { $regex: search, $options: 'i' } }
        ]
      };
    }

    const users = await User.find(query)
      .select('-password')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    const total = await User.countDocuments(query);

    res.json({
      users,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(total / limit),
        totalUsers: total,
        hasNext: page * limit < total,
        hasPrev: page > 1
      }
    });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

module.exports = router;
