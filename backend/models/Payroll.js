const mongoose = require('mongoose');

const payrollSchema = new mongoose.Schema({
  employee_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Employee',
    required: [true, 'Employee is required']
  },
  month: {
    type: Number,
    required: [true, 'Month is required'],
    min: [1, 'Month must be between 1 and 12'],
    max: [12, 'Month must be between 1 and 12']
  },
  year: {
    type: Number,
    required: [true, 'Year is required'],
    min: [2020, 'Year must be 2020 or later']
  },
  base_salary: {
    type: Number,
    required: [true, 'Base salary is required'],
    min: [0, 'Base salary cannot be negative']
  },
  absent_days: {
    type: Number,
    default: 0,
    min: [0, 'Absent days cannot be negative']
  },
  overtime_days: {
    type: Number,
    default: 0,
    min: [0, 'Overtime days cannot be negative']
  },
  overtime_rate: {
    type: Number,
    default: 1.5, // 1.5x normal daily rate
    min: [1, 'Overtime rate must be at least 1']
  },
  deductions: {
    type: Number,
    default: 0,
    min: [0, 'Deductions cannot be negative']
  },
  bonuses: {
    type: Number,
    default: 0,
    min: [0, 'Bonuses cannot be negative']
  },
  net_salary: {
    type: Number,
    required: [true, 'Net salary is required'],
    min: [0, 'Net salary cannot be negative']
  },
  is_paid: {
    type: Boolean,
    default: false
  },
  payment_date: {
    type: Date
  },
  notes: {
    type: String,
    trim: true,
    maxlength: [500, 'Notes cannot exceed 500 characters']
  }
}, {
  timestamps: true
});

// Compound index for employee and month/year
payrollSchema.index({ employee_id: 1, month: 1, year: 1 }, { unique: true });
payrollSchema.index({ month: 1, year: 1 });
payrollSchema.index({ is_paid: 1 });

// Virtual for daily rate calculation
payrollSchema.virtual('dailyRate').get(function() {
  // Assuming 30 days per month
  return this.base_salary / 30;
});

// Virtual for absent days deduction
payrollSchema.virtual('absentDeduction').get(function() {
  return this.dailyRate * this.absent_days;
});

// Virtual for overtime calculation
payrollSchema.virtual('overtimeAmount').get(function() {
  return this.dailyRate * this.overtime_days * this.overtime_rate;
});

// Virtual for total salary calculation
payrollSchema.virtual('totalSalary').get(function() {
  return this.base_salary - this.absentDeduction + this.overtimeAmount + this.bonuses - this.deductions;
});

// Ensure virtual fields are serialized
payrollSchema.set('toJSON', { virtuals: true });
payrollSchema.set('toObject', { virtuals: true });

// Pre-save middleware to calculate net salary (commented out since we calculate it explicitly in routes)
// payrollSchema.pre('save', function(next) {
//   this.net_salary = this.totalSalary;
//   next();
// });

module.exports = mongoose.model('Payroll', payrollSchema); 