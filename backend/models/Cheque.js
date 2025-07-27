const mongoose = require('mongoose');

const chequeSchema = new mongoose.Schema({
  cheque_number: {
    type: String,
    required: [true, 'Cheque number is required'],
    trim: true,
    unique: true,
    maxlength: [20, 'Cheque number cannot exceed 20 characters']
  },
  payee_name: {
    type: String,
    required: [true, 'Payee name is required'],
    trim: true,
    maxlength: [100, 'Payee name cannot exceed 100 characters']
  },
  amount: {
    type: Number,
    required: [true, 'Amount is required'],
    min: [0.01, 'Amount must be greater than 0']
  },
  amount_in_words: {
    type: String,
    required: [true, 'Amount in words is required'],
    trim: true,
    maxlength: [200, 'Amount in words cannot exceed 200 characters']
  },
  currency: {
    type: String,
    required: [true, 'Currency is required'],
    enum: ['AED', 'USD', 'EUR', 'GBP', 'SAR', 'QAR', 'KWD', 'BHD', 'OMR', 'JOD'],
    default: 'AED'
  },
  cheque_date: {
    type: Date,
    required: [true, 'Cheque date is required'],
    default: Date.now
  },
  issue_date: {
    type: Date,
    required: [true, 'Issue date is required'],
    default: Date.now
  },
  bank_name: {
    type: String,
    required: [true, 'Bank name is required'],
    trim: true,
    maxlength: [100, 'Bank name cannot exceed 100 characters'],
    default: 'ADCB Islamic'
  },
  branch_name: {
    type: String,
    trim: true,
    maxlength: [100, 'Branch name cannot exceed 100 characters'],
    default: 'IBD-AL RIGGAH ROAD BRANCH, DUBAI'
  },
  account_number: {
    type: String,
    required: [true, 'Account number is required'],
    trim: true,
    maxlength: [50, 'Account number cannot exceed 50 characters'],
    default: '13946153820001'
  },
  iban: {
    type: String,
    required: [true, 'IBAN is required'],
    trim: true,
    maxlength: [50, 'IBAN cannot exceed 50 characters'],
    default: 'AE50 0030 0139 4615 3820 001'
  },
  account_holder: {
    type: String,
    required: [true, 'Account holder name is required'],
    trim: true,
    maxlength: [100, 'Account holder name cannot exceed 100 characters'],
    default: 'WINJY BUILDING CONTRACTING LLC'
  },
  description: {
    type: String,
    trim: true,
    maxlength: [500, 'Description cannot exceed 500 characters']
  },
  project_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Project'
  },
  supplier_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Supplier'
  },
  status: {
    type: String,
    required: [true, 'Status is required'],
    enum: ['Draft', 'Issued', 'Cleared', 'Cancelled', 'Void'],
    default: 'Draft'
  },
  signature_required: {
    type: Boolean,
    default: true
  },
  is_void: {
    type: Boolean,
    default: false
  },
  void_reason: {
    type: String,
    trim: true,
    maxlength: [200, 'Void reason cannot exceed 200 characters']
  },
  created_by: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Created by user is required']
  },
  approved_by: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  approved_at: {
    type: Date
  }
}, {
  timestamps: true
});

// Indexes for better query performance
chequeSchema.index({ cheque_number: 1 });
chequeSchema.index({ payee_name: 1 });
chequeSchema.index({ cheque_date: 1 });
chequeSchema.index({ status: 1 });
chequeSchema.index({ created_by: 1 });
chequeSchema.index({ project_id: 1 });
chequeSchema.index({ supplier_id: 1 });

// Virtual for formatted amount
chequeSchema.virtual('formattedAmount').get(function() {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: this.currency
  }).format(this.amount);
});

// Virtual for formatted cheque date
chequeSchema.virtual('formattedChequeDate').get(function() {
  return this.cheque_date.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });
});

// Virtual for formatted issue date
chequeSchema.virtual('formattedIssueDate').get(function() {
  return this.issue_date.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });
});

// Ensure virtual fields are serialized
chequeSchema.set('toJSON', { virtuals: true });
chequeSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Cheque', chequeSchema); 