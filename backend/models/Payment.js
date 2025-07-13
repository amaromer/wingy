const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema({
  date: {
    type: Date,
    required: [true, 'Payment date is required'],
    default: Date.now
  },
  invoice_number: {
    type: String,
    required: [true, 'Invoice number is required'],
    trim: true,
    maxlength: [50, 'Invoice number cannot exceed 50 characters']
  },
  amount: {
    type: Number,
    required: [true, 'Amount is required'],
    min: [0, 'Amount cannot be negative']
  },
  is_vat_included: {
    type: Boolean,
    required: [true, 'VAT inclusion status is required'],
    default: false
  },
  vat_amount: {
    type: Number,
    required: [true, 'VAT amount is required'],
    min: [0, 'VAT amount cannot be negative'],
    default: 0
  },
  payment_type: {
    type: String,
    required: [true, 'Payment type is required'],
    enum: ['Bank Transfer', 'Cheque', 'Cash'],
    default: 'Cash'
  },
  receipt_attachment: {
    type: String,
    trim: true
  },
  project_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Project'
  },
  supplier_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Supplier'
  },
  description: {
    type: String,
    trim: true,
    maxlength: [500, 'Description cannot exceed 500 characters']
  },
  currency: {
    type: String,
    required: [true, 'Currency is required'],
    enum: ['USD', 'EUR', 'GBP', 'CAD', 'AUD', 'AED', 'SAR', 'QAR', 'KWD', 'BHD', 'OMR', 'JOD'],
    default: 'AED'
  }
}, {
  timestamps: true
});

// Indexes for better query performance
paymentSchema.index({ date: 1 });
paymentSchema.index({ project_id: 1 });
paymentSchema.index({ supplier_id: 1 });
paymentSchema.index({ payment_type: 1 });
paymentSchema.index({ invoice_number: 1 });

// Virtual for total amount including VAT
paymentSchema.virtual('total_amount').get(function() {
  return this.amount + this.vat_amount;
});

// Ensure virtual fields are serialized
paymentSchema.set('toJSON', { virtuals: true });
paymentSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Payment', paymentSchema); 