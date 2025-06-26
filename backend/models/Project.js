const mongoose = require('mongoose');

const projectSchema = new mongoose.Schema({
  code: {
    type: String,
    unique: true,
    sparse: true, // Allow multiple null values
    trim: true,
    maxlength: [50, 'Project code cannot exceed 50 characters']
  },
  name: {
    type: String,
    required: [true, 'Project name is required'],
    trim: true,
    maxlength: [200, 'Project name cannot exceed 200 characters']
  },
  description: {
    type: String,
    trim: true,
    maxlength: [1000, 'Description cannot exceed 1000 characters'],
    default: ''
  },
  start_date: {
    type: Date,
    default: Date.now
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
    enum: ['Active', 'Completed', 'On Hold'],
    default: 'Active'
  },
  priority: {
    type: String,
    enum: ['Low', 'Medium', 'High', 'Critical'],
    default: 'Medium'
  },
  location: {
    type: String,
    trim: true,
    maxlength: [200, 'Location cannot exceed 200 characters'],
    default: ''
  },
  client_name: {
    type: String,
    trim: true,
    maxlength: [200, 'Client name cannot exceed 200 characters'],
    default: ''
  },
  manager: {
    type: String,
    trim: true,
    maxlength: [100, 'Manager name cannot exceed 100 characters'],
    default: ''
  },
  phases: [{
    name: {
      type: String,
      trim: true,
      maxlength: [50, 'Phase name cannot exceed 50 characters']
    },
    description: {
      type: String,
      trim: true,
      maxlength: [200, 'Phase description cannot exceed 200 characters']
    },
    start_date: {
      type: Date
    },
    end_date: {
      type: Date
    },
    budget: {
      type: Number,
      min: [0, 'Phase budget cannot be negative'],
      default: 0
    },
    status: {
      type: String,
      enum: ['Not Started', 'In Progress', 'Completed'],
      default: 'Not Started'
    }
  }],
  team_members: [{
    name: {
      type: String,
      trim: true,
      maxlength: [50, 'Member name cannot exceed 50 characters']
    },
    role: {
      type: String,
      trim: true,
      maxlength: [50, 'Role cannot exceed 50 characters']
    },
    email: {
      type: String,
      trim: true,
      lowercase: true
    },
    phone: {
      type: String,
      trim: true
    }
  }]
}, {
  timestamps: true
});

// Indexes for better query performance
projectSchema.index({ status: 1 });
projectSchema.index({ start_date: 1 });
projectSchema.index({ client_name: 1 });
projectSchema.index({ priority: 1 });

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