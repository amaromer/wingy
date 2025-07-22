const mongoose = require('mongoose');

const receivedPaymentSchema = new mongoose.Schema({
  date: {
    type: Date,
    required: [true, 'Payment date is required'],
    default: Date.now
  },
  project_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Project',
    required: [true, 'Project is required']
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
  is_vat_applicable: {
    type: Boolean,
    required: [true, 'VAT applicability status is required'],
    default: false
  },
  vat_amount: {
    type: Number,
    required: [true, 'VAT amount is required'],
    min: [0, 'VAT amount cannot be negative'],
    default: 0
  },
  payment_method: {
    type: String,
    required: [true, 'Payment method is required'],
    enum: ['Bank Transfer', 'Cheque', 'Cash'],
    default: 'Cash'
  },
  payment_attachment: {
    type: String,
    trim: true
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
  },
  client_name: {
    type: String,
    trim: true,
    maxlength: [100, 'Client name cannot exceed 100 characters']
  },
  reference_number: {
    type: String,
    trim: true,
    maxlength: [50, 'Reference number cannot exceed 50 characters']
  }
}, {
  timestamps: true
});

// Indexes for better query performance
receivedPaymentSchema.index({ date: 1 });
receivedPaymentSchema.index({ project_id: 1 });
receivedPaymentSchema.index({ payment_method: 1 });
receivedPaymentSchema.index({ invoice_number: 1 });
receivedPaymentSchema.index({ client_name: 1 });

// Virtual for total amount including VAT
receivedPaymentSchema.virtual('total_amount').get(function() {
  return this.amount + this.vat_amount;
});

// Ensure virtual fields are serialized
receivedPaymentSchema.set('toJSON', { virtuals: true });
receivedPaymentSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('ReceivedPayment', receivedPaymentSchema); 