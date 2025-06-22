const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true,
    maxlength: [100, 'Name cannot exceed 100 characters']
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    trim: true,
    lowercase: true,
    match: [/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
  },
  password_hash: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [6, 'Password must be at least 6 characters long']
  },
  role: {
    type: String,
    enum: ['Admin', 'Accountant'],
    default: 'Accountant'
  },
  is_active: {
    type: Boolean,
    default: true
  },
  last_login: {
    type: Date
  }
}, {
  timestamps: true
});

// Indexes for better query performance (excluding email since it's already unique)
userSchema.index({ role: 1 });
userSchema.index({ is_active: 1 });

// Virtual for password (not stored in DB)
userSchema.virtual('password')
  .set(function(password) {
    this.password_hash = bcrypt.hashSync(password, 10);
  })
  .get(function() {
    return this.password_hash;
  });

// Method to compare password
userSchema.methods.comparePassword = function(candidatePassword) {
  return bcrypt.compareSync(candidatePassword, this.password_hash);
};

// Method to get user without password
userSchema.methods.toJSON = function() {
  const user = this.toObject();
  delete user.password_hash;
  return user;
};

// Pre-save middleware to hash password if modified
userSchema.pre('save', function(next) {
  if (this.isModified('password_hash')) {
    // Password is already hashed by the virtual setter
    next();
  } else {
    next();
  }
});

module.exports = mongoose.model('User', userSchema); 