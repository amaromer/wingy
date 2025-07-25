const mongoose = require('mongoose');

const pettyCashSchema = new mongoose.Schema({
  employee_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Employee',
    required: [true, 'Employee is required']
  },
  type: {
    type: String,
    enum: ['credit', 'debit', 'transfer_in', 'transfer_out'],
    required: [true, 'Transaction type is required']
  },
  amount: {
    type: Number,
    required: [true, 'Amount is required'],
    min: [0.01, 'Amount must be greater than 0']
  },
  balance_after: {
    type: Number,
    required: [true, 'Balance after transaction is required']
  },
  description: {
    type: String,
    required: [true, 'Description is required'],
    trim: true,
    maxlength: [200, 'Description cannot exceed 200 characters']
  },
  reference_type: {
    type: String,
    enum: ['manual', 'expense', 'transfer'],
    default: 'manual'
  },
  reference_id: {
    type: mongoose.Schema.Types.ObjectId,
    // Can reference Expense, Transfer, or null for manual entries
  },
  transfer_to_employee: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Employee',
    // Only used when type is 'transfer_out'
  },
  transfer_from_employee: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Employee',
    // Only used when type is 'transfer_in'
  },
  processed_by: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Processed by user is required']
  }
}, {
  timestamps: true
});

// Indexes for better query performance
pettyCashSchema.index({ employee_id: 1, createdAt: -1 });
pettyCashSchema.index({ type: 1 });
pettyCashSchema.index({ reference_type: 1, reference_id: 1 });

// Virtual for formatted amount
pettyCashSchema.virtual('formattedAmount').get(function() {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'AED'
  }).format(this.amount);
});

// Virtual for formatted balance
pettyCashSchema.virtual('formattedBalance').get(function() {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'AED'
  }).format(this.balance_after);
});

// Ensure virtual fields are serialized
pettyCashSchema.set('toJSON', { virtuals: true });
pettyCashSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('PettyCash', pettyCashSchema); 