const mongoose = require('mongoose');

const projectSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Project name is required'],
    trim: true,
    maxlength: [200, 'Project name cannot exceed 200 characters']
  },
  code: {
    type: String,
    required: [true, 'Project code is required'],
    unique: true,
    trim: true,
    uppercase: true,
    maxlength: [20, 'Project code cannot exceed 20 characters']
  },
  description: {
    type: String,
    trim: true,
    maxlength: [1000, 'Description cannot exceed 1000 characters']
  },
  start_date: {
    type: Date,
    required: [true, 'Start date is required']
  },
  end_date: {
    type: Date
  },
  budget: {
    type: Number,
    min: [0, 'Budget cannot be negative'],
    default: 0
  },
  status: {
    type: String,
    enum: ['Planning', 'Active', 'On Hold', 'Completed', 'Cancelled'],
    default: 'Planning'
  },
  location: {
    type: String,
    trim: true,
    maxlength: [200, 'Location cannot exceed 200 characters']
  },
  client_name: {
    type: String,
    trim: true,
    maxlength: [200, 'Client name cannot exceed 200 characters']
  },
  manager: {
    type: String,
    trim: true,
    maxlength: [100, 'Manager name cannot exceed 100 characters']
  }
}, {
  timestamps: true
});

// Indexes for better query performance (excluding code since it's already unique)
projectSchema.index({ status: 1 });
projectSchema.index({ start_date: 1 });
projectSchema.index({ client_name: 1 });

// Virtual for project duration
projectSchema.virtual('duration').get(function() {
  if (this.start_date && this.end_date) {
    const diffTime = Math.abs(this.end_date - this.start_date);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  }
  return null;
});

// Ensure virtual fields are serialized
projectSchema.set('toJSON', { virtuals: true });
projectSchema.set('toObject', { virtuals: true });

// Pre-save middleware to validate dates
projectSchema.pre('save', function(next) {
  if (this.start_date && this.end_date && this.start_date > this.end_date) {
    next(new Error('Start date cannot be after end date'));
  }
  next();
});

module.exports = mongoose.model('Project', projectSchema); 