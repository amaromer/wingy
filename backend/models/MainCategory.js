const mongoose = require('mongoose');

const mainCategorySchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Main category name is required'],
    trim: true,
    maxlength: [100, 'Main category name cannot exceed 100 characters'],
    unique: true
  },
  description: {
    type: String,
    trim: true,
    maxlength: [500, 'Description cannot exceed 500 characters']
  },
  icon: {
    type: String,
    trim: true,
    maxlength: [50, 'Icon cannot exceed 50 characters'],
    default: '📁'
  },
  color: {
    type: String,
    trim: true,
    maxlength: [7, 'Color must be a valid hex color'],
    default: '#6c757d'
  },
  is_active: {
    type: Boolean,
    default: true
  },
  sort_order: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

// Indexes for better query performance
mainCategorySchema.index({ is_active: 1 });
mainCategorySchema.index({ sort_order: 1 });
mainCategorySchema.index({ name: 1 });

module.exports = mongoose.model('MainCategory', mainCategorySchema); 