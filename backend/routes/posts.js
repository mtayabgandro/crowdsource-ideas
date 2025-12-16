const express = require('express');
const { body, validationResult } = require('express-validator');
const mongoose = require('mongoose'); // ✅ Add mongoose import
const Post = require('../models/Post');
const Comment = require('../models/Comment');
const User = require('../models/User'); // ✅ Add User import
const { authenticateToken, optionalAuth } = require('../middleware/auth');

const router = express.Router();

// Get all posts with pagination and filtering
router.get('/', optionalAuth, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;
    const sortBy = req.query.sortBy || 'createdAt';
    const sortOrder = req.query.sortOrder === 'asc' ? 1 : -1;
    const type = req.query.type;
    const author = req.query.author;
    const tags = req.query.tags ? req.query.tags.split(',') : [];

    let query = { isActive: true };

    if (type && type !== 'all') {
      query.type = type;
    }

    if (author) {
      query.author = author;
    }

    if (tags.length > 0) {
      query.tags = { $in: tags };
    }

    const posts = await Post.find(query)
      .populate('author', 'username avatar bio')
      .sort({ [sortBy]: sortOrder })
      .skip(skip)
      .limit(limit)
      .lean();

    const total = await Post.countDocuments(query);

    res.json({
      posts,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(total / limit),
        totalPosts: total,
        hasNext: page * limit < total,
        hasPrev: page > 1
      }
    });
  } catch (error) {
    console.error('Get posts error:', error);
    res.status(500).json({ error: 'Failed to fetch posts' });
  }
});

// SIMPLIFIED: Get platform stats
router.get('/stats', async (req, res) => {
  try {
    console.log('Fetching stats...');
    
    // Simple counts without complex aggregation
    const totalPosts = await Post.countDocuments({ isActive: true });
    const totalUsers = await User.countDocuments({ isActive: true });
    const totalComments = await Comment.countDocuments({ isActive: true });

    console.log('Stats fetched:', { totalPosts, totalUsers, totalComments });

    res.json({
      totalPosts,
      totalUsers,
      totalComments
    });
  } catch (error) {
    console.error('Get stats error details:', error);
    res.status(500).json({ 
      error: 'Failed to fetch stats',
      details: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// Get single post by ID
router.get('/:id', optionalAuth, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id)
      .populate('author', 'username avatar bio')
      .populate('comments', 'content author createdAt');

    if (!post || !post.isActive) {
      return res.status(404).json({ error: 'Post not found' });
    }

    res.json(post);
  } catch (error) {
    console.error('Get post error:', error);
    res.status(500).json({ error: 'Failed to fetch post' });
  }
});

// Increment view count for a post
router.post('/:id/view', optionalAuth, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);

    if (!post || !post.isActive) {
      return res.status(404).json({ error: 'Post not found' });
    }

    // Increment view count (only if not the author viewing)
    if (!req.user || req.user._id.toString() !== post.author._id.toString()) {
      post.views += 1;
      await post.save();
    }

    res.json({ views: post.views });
  } catch (error) {
    console.error('View post error:', error);
    res.status(500).json({ error: 'Failed to increment view' });
  }
});

// Create new post
router.post('/', authenticateToken, [
  body('title')
    .isLength({ min: 5, max: 200 })
    .withMessage('Title must be between 5 and 200 characters'),
  body('content')
    .isLength({ min: 10, max: 10000 })
    .withMessage('Content must be between 10 and 10000 characters'),
  body('type')
    .isIn(['question', 'idea', 'discussion'])
    .withMessage('Type must be question, idea, or discussion'),
  body('tags')
    .optional()
    .isArray({ max: 10 })
    .withMessage('Maximum 10 tags allowed')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ error: errors.array()[0].msg });
    }

    const { title, content, type, tags } = req.body;

    const post = new Post({
      title: title.trim(),
      content: content.trim(),
      type,
      tags: tags ? tags.map(tag => tag.trim().toLowerCase()) : [],
      author: req.user._id
    });

    await post.save();
    await post.populate('author', 'username avatar bio');

    res.status(201).json({
      message: 'Post created successfully',
      post
    });
  } catch (error) {
    console.error('Create post error:', error);
    res.status(500).json({ error: 'Failed to create post' });
  }
});

// Update post
router.put('/:id', authenticateToken, [
  body('title')
    .optional()
    .isLength({ min: 5, max: 200 }),
  body('content')
    .optional()
    .isLength({ min: 10, max: 10000 }),
  body('type')
    .optional()
    .isIn(['question', 'idea', 'discussion']),
  body('tags')
    .optional()
    .isArray({ max: 10 })
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ error: errors.array()[0].msg });
    }

    const post = await Post.findById(req.params.id);

    if (!post) {
      return res.status(404).json({ error: 'Post not found' });
    }

    if (post.author.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: 'Not authorized to edit this post' });
    }

    const { title, content, type, tags } = req.body;

    if (title) post.title = title.trim();
    if (content) post.content = content.trim();
    if (type) post.type = type;
    if (tags) post.tags = tags.map(tag => tag.trim().toLowerCase());

    await post.save();
    await post.populate('author', 'username avatar bio');

    res.json({
      message: 'Post updated successfully',
      post
    });
  } catch (error) {
    console.error('Update post error:', error);
    res.status(500).json({ error: 'Failed to update post' });
  }
});

// Delete post
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);

    if (!post) {
      return res.status(404).json({ error: 'Post not found' });
    }

    if (post.author.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: 'Not authorized to delete this post' });
    }

    // Soft delete
    post.isActive = false;
    await post.save();

    res.json({ message: 'Post deleted successfully' });
  } catch (error) {
    console.error('Delete post error:', error);
    res.status(500).json({ error: 'Failed to delete post' });
  }
});

// Like/Unlike post
router.post('/:id/like', authenticateToken, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);

    if (!post || !post.isActive) {
      return res.status(404).json({ error: 'Post not found' });
    }

    const userId = req.user._id;
    const likeIndex = post.likes.indexOf(userId);

    if (likeIndex > -1) {
      // Unlike
      post.likes.splice(likeIndex, 1);
    } else {
      // Like
      post.likes.push(userId);
      // Remove dislike if exists
      const dislikeIndex = post.dislikes.indexOf(userId);
      if (dislikeIndex > -1) {
        post.dislikes.splice(dislikeIndex, 1);
      }
    }

    await post.save();
    await post.populate('author', 'username avatar bio');

    res.json({
      message: likeIndex > -1 ? 'Post unliked' : 'Post liked',
      post
    });
  } catch (error) {
    console.error('Like post error:', error);
    res.status(500).json({ error: 'Failed to like post' });
  }
});

// Dislike/Undislike post
router.post('/:id/dislike', authenticateToken, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);

    if (!post || !post.isActive) {
      return res.status(404).json({ error: 'Post not found' });
    }

    const userId = req.user._id;
    const dislikeIndex = post.dislikes.indexOf(userId);

    if (dislikeIndex > -1) {
      // Undislike
      post.dislikes.splice(dislikeIndex, 1);
    } else {
      // Dislike
      post.dislikes.push(userId);
      // Remove like if exists
      const likeIndex = post.likes.indexOf(userId);
      if (likeIndex > -1) {
        post.likes.splice(likeIndex, 1);
      }
    }

    await post.save();
    await post.populate('author', 'username avatar bio');

    res.json({
      message: dislikeIndex > -1 ? 'Post undisliked' : 'Post disliked',
      post
    });
  } catch (error) {
    console.error('Dislike post error:', error);
    res.status(500).json({ error: 'Failed to dislike post' });
  }
});

// Get posts by user
router.get('/user/:userId', async (req, res) => {
  try {
    const posts = await Post.find({
      author: req.params.userId,
      isActive: true
    })
      .populate('author', 'username avatar bio')
      .sort({ createdAt: -1 })
      .lean();

    res.json(posts);
  } catch (error) {
    console.error('Get user posts error:', error);
    res.status(500).json({ error: 'Failed to fetch user posts' });
  }
});

// Get comments for a post
router.get('/:id/comments', async (req, res) => {
  try {
    const comments = await Comment.find({
      post: req.params.id,
      isActive: true
    })
      .populate('author', 'username avatar')
      .sort({ createdAt: 1 })
      .lean();

    res.json(comments);
  } catch (error) {
    console.error('Get comments error:', error);
    res.status(500).json({ error: 'Failed to fetch comments' });
  }
});

// Add comment to post
router.post('/:id/comments', authenticateToken, [
  body('content')
    .isLength({ min: 1, max: 2000 })
    .withMessage('Comment must be between 1 and 2000 characters')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ error: errors.array()[0].msg });
    }

    const post = await Post.findById(req.params.id);
    if (!post || !post.isActive) {
      return res.status(404).json({ error: 'Post not found' });
    }

    const { content } = req.body;

    const comment = new Comment({
      content: content.trim(),
      author: req.user._id,
      post: req.params.id
    });

    await comment.save();
    await comment.populate('author', 'username avatar');

    // Add comment to post's comments array
    post.comments.push(comment._id);
    await post.save();

    res.status(201).json({
      message: 'Comment added successfully',
      comment
    });
  } catch (error) {
    console.error('Add comment error:', error);
    res.status(500).json({ error: 'Failed to add comment' });
  }
});

// Update comment
router.put('/:id/comments/:commentId', authenticateToken, [
  body('content')
    .isLength({ min: 1, max: 2000 })
    .withMessage('Comment must be between 1 and 2000 characters')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ error: errors.array()[0].msg });
    }

    const comment = await Comment.findById(req.params.commentId);
    if (!comment || !comment.isActive) {
      return res.status(404).json({ error: 'Comment not found' });
    }

    const { content } = req.body;
    comment.content = content.trim();
    await comment.save();
    await comment.populate('author', 'username avatar');

    res.json({
      message: 'Comment updated successfully',
      comment
    });
  } catch (error) {
    console.error('Update comment error:', error);
    res.status(500).json({ error: 'Failed to update comment' });
  }
});

// Like/Unlike comment
router.post('/:id/comments/:commentId/like', authenticateToken, async (req, res) => {
  try {
    const comment = await Comment.findById(req.params.commentId);
    if (!comment || !comment.isActive) {
      return res.status(404).json({ error: 'Comment not found' });
    }

    const userId = req.user._id;
    const likeIndex = comment.likes.indexOf(userId);

    if (likeIndex > -1) {
      // Unlike
      comment.likes.splice(likeIndex, 1);
    } else {
      // Like
      comment.likes.push(userId);
      // Remove dislike if exists
      const dislikeIndex = comment.dislikes.indexOf(userId);
      if (dislikeIndex > -1) {
        comment.dislikes.splice(dislikeIndex, 1);
      }
    }

    await comment.save();
    await comment.populate('author', 'username avatar');

    res.json({
      message: likeIndex > -1 ? 'Comment unliked' : 'Comment liked',
      comment
    });
  } catch (error) {
    console.error('Like comment error:', error);
    res.status(500).json({ error: 'Failed to like comment' });
  }
});

// Dislike/Undislike comment
router.post('/:id/comments/:commentId/dislike', authenticateToken, async (req, res) => {
  try {
    const comment = await Comment.findById(req.params.commentId);
    if (!comment || !comment.isActive) {
      return res.status(404).json({ error: 'Comment not found' });
    }

    const userId = req.user._id;
    const dislikeIndex = comment.dislikes.indexOf(userId);

    if (dislikeIndex > -1) {
      // Undislike
      comment.dislikes.splice(dislikeIndex, 1);
    } else {
      // Dislike
      comment.dislikes.push(userId);
      // Remove like if exists
      const likeIndex = comment.likes.indexOf(userId);
      if (likeIndex > -1) {
        comment.likes.splice(likeIndex, 1);
      }
    }

    await comment.save();
    await comment.populate('author', 'username avatar');

    res.json({
      message: dislikeIndex > -1 ? 'Comment undisliked' : 'Comment disliked',
      comment
    });
  } catch (error) {
    console.error('Dislike comment error:', error);
    res.status(500).json({ error: 'Failed to dislike comment' });
  }
});

// ✅ SIMPLIFIED: Get platform stats
router.get('/stats', async (req, res) => {
  try {
    console.log('Fetching stats...');

    // Simple counts without complex aggregation
    const totalPosts = await Post.countDocuments({ isActive: true });
    const totalUsers = await User.countDocuments({ isActive: true });
    const totalComments = await Comment.countDocuments({ isActive: true });

    console.log('Stats fetched:', { totalPosts, totalUsers, totalComments });

    res.json({
      totalPosts,
      totalUsers,
      totalComments
    });
  } catch (error) {
    console.error('Get stats error details:', error);
    res.status(500).json({
      error: 'Failed to fetch stats',
      details: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

module.exports = router;
