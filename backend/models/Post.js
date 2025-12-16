const mongoose = require('mongoose');

const postSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true,
    minlength: 5,
    maxlength: 200
  },
  content: {
    type: String,
    required: true,
    trim: true,
    minlength: 10,
    maxlength: 10000
  },
  type: {
    type: String,
    required: true,
    enum: ['question', 'idea', 'discussion']
  },
  tags: [{
    type: String,
    trim: true,
    lowercase: true,
    maxlength: 50
  }],
  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  likes: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  dislikes: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  views: {
    type: Number,
    default: 0
  },
  comments: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Comment'
  }],
  isActive: {
    type: Boolean,
    default: true
  },
  isPinned: {
    type: Boolean,
    default: false
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Update updatedAt on save
postSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Index for performance
postSchema.index({ author: 1, createdAt: -1 });
postSchema.index({ type: 1, createdAt: -1 });
postSchema.index({ tags: 1 });
postSchema.index({ isPinned: -1, createdAt: -1 });
postSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Post', postSchema);
