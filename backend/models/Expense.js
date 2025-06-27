const mongoose = require('mongoose');

const expenseSchema = new mongoose.Schema({
  project_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Project',
    required: [true, 'Project is required']
  },
  supplier_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Supplier',
    required: [true, 'Supplier is required']
  },
  category_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category',
    required: [true, 'Category is required']
  },
  amount: {
    type: Number,
    required: [true, 'Amount is required'],
    min: [0, 'Amount cannot be negative']
  },
  currency: {
    type: String,
    required: [true, 'Currency is required'],
    enum: ['USD', 'EUR', 'GBP', 'CAD', 'AUD', 'AED', 'SAR', 'QAR', 'KWD', 'BHD', 'OMR', 'JOD'],
    default: 'AED'
  },
  date: {
    type: Date,
    required: [true, 'Date is required'],
    default: Date.now
  },
  description: {
    type: String,
    required: [true, 'Description is required'],
    trim: true,
    maxlength: [500, 'Description cannot exceed 500 characters']
  },
  invoice_number: {
    type: String,
    trim: true,
    maxlength: [50, 'Invoice number cannot exceed 50 characters']
  },
  attachment_url: {
    type: String,
    trim: true
  },
  is_vat: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

// Index for better query performance
expenseSchema.index({ project_id: 1 });
expenseSchema.index({ supplier_id: 1 });
expenseSchema.index({ category_id: 1 });
expenseSchema.index({ date: 1 });
expenseSchema.index({ amount: 1 });

// Virtual for formatted amount
expenseSchema.virtual('formattedAmount').get(function() {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: this.currency
  }).format(this.amount);
});

// Ensure virtual fields are serialized
expenseSchema.set('toJSON', { virtuals: true });
expenseSchema.set('toObject', { virtuals: true });

// Pre-save middleware to validate date
expenseSchema.pre('save', function(next) {
  if (this.date > new Date()) {
    next(new Error('Expense date cannot be in the future'));
  }
  next();
});

module.exports = mongoose.model('Expense', expenseSchema); 