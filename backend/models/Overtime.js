const mongoose = require('mongoose');

const overtimeSchema = new mongoose.Schema({
  employee_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Employee',
    required: [true, 'Employee is required']
  },
  date: {
    type: Date,
    required: [true, 'Overtime date is required'],
    default: Date.now
  },
  hours: {
    type: Number,
    required: [true, 'Overtime hours are required'],
    min: [0.5, 'Overtime hours must be at least 0.5'],
    max: [24, 'Overtime hours cannot exceed 24']
  },
  rate: {
    type: Number,
    default: 1.5, // 1.5x normal hourly rate
    min: [1, 'Overtime rate must be at least 1']
  },
  description: {
    type: String,
    trim: true,
    maxlength: [200, 'Description cannot exceed 200 characters']
  },
  is_approved: {
    type: Boolean,
    default: false
  },
  approved_by: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  approved_at: {
    type: Date
  },
  is_processed: {
    type: Boolean,
    default: false // Whether this overtime has been included in payroll
  },
  processed_payroll_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Payroll'
  }
}, {
  timestamps: true
});

// Indexes for better query performance
overtimeSchema.index({ employee_id: 1, date: 1 });
overtimeSchema.index({ date: 1 });
overtimeSchema.index({ is_approved: 1 });
overtimeSchema.index({ is_processed: 1 });

// Virtual for overtime amount calculation
overtimeSchema.virtual('amount').get(function() {
  // This will be calculated based on employee's daily rate
  // The actual calculation will be done in the service layer
  return 0; // Placeholder
});

// Ensure virtual fields are serialized
overtimeSchema.set('toJSON', { virtuals: true });
overtimeSchema.set('toObject', { virtuals: true });

// Pre-save middleware to validate date
overtimeSchema.pre('save', function(next) {
  if (this.date > new Date()) {
    next(new Error('Overtime date cannot be in the future'));
  }
  next();
});

module.exports = mongoose.model('Overtime', overtimeSchema); 