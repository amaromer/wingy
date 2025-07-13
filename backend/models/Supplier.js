const mongoose = require('mongoose');

const supplierSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Supplier name is required'],
    trim: true,
    maxlength: [200, 'Supplier name cannot exceed 200 characters']
  },
  contact_person: {
    type: String,
    trim: true,
    maxlength: [100, 'Contact person name cannot exceed 100 characters']
  },
  phone: {
    type: String,
    trim: true,
    match: [/^[\+]?[1-9][\d]{0,15}$/, 'Please enter a valid phone number']
  },
  email: {
    type: String,
    trim: true,
    lowercase: true,
    match: [/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
  },
  address: {
    type: String,
    trim: true,
    maxlength: [500, 'Address cannot exceed 500 characters']
  },
  vat_enabled: {
    type: Boolean,
    default: false
  },
  vat_no: {
    type: String,
    trim: true,
    maxlength: [50, 'VAT number cannot exceed 50 characters'],
    validate: {
      validator: function(v) {
        // VAT number is required if vat_enabled is true
        if (this.vat_enabled && (!v || v.trim() === '')) {
          return false;
        }
        return true;
      },
      message: 'VAT number is required when VAT is enabled'
    }
  },
  payment_terms: {
    type: String,
    trim: true,
    maxlength: [100, 'Payment terms cannot exceed 100 characters']
  },
  is_active: {
    type: Boolean,
    default: true
  },
  notes: {
    type: String,
    trim: true,
    maxlength: [1000, 'Notes cannot exceed 1000 characters']
  },
  main_category_ids: {
    type: [mongoose.Schema.Types.ObjectId],
    ref: 'MainCategory',
    default: []
  }
}, {
  timestamps: true
});

// Indexes for better query performance
supplierSchema.index({ name: 1 });
supplierSchema.index({ phone: 1 });
supplierSchema.index({ is_active: 1 });
supplierSchema.index({ vat_enabled: 1 });

module.exports = mongoose.model('Supplier', supplierSchema); 