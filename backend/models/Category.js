const mongoose = require('mongoose');

const categorySchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Category name is required'],
    trim: true,
    maxlength: [100, 'Category name cannot exceed 100 characters']
  },
  code: {
    type: String,
    required: [true, 'Category code is required'],
    unique: true,
    trim: true,
    uppercase: true,
    maxlength: [10, 'Category code cannot exceed 10 characters']
  },
  description: {
    type: String,
    trim: true,
    maxlength: [500, 'Description cannot exceed 500 characters']
  },
  is_active: {
    type: Boolean,
    default: true
  },
  parent_category: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category',
    default: null
  }
}, {
  timestamps: true
});

// Indexes for better query performance (excluding code since it's already unique)
categorySchema.index({ is_active: 1 });
categorySchema.index({ parent_category: 1 });

module.exports = mongoose.model('Category', categorySchema); 