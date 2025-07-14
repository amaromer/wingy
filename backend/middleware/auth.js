const jwt = require('jsonwebtoken');
const User = require('../models/User');

const auth = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ message: 'Access denied. No token provided.' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.userId).select('-password_hash');
    
    if (!user || !user.is_active) {
      return res.status(401).json({ message: 'Invalid token or user inactive.' });
    }

    req.user = user;
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ message: 'Invalid token.' });
    }
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ message: 'Token expired.' });
    }
    res.status(500).json({ message: 'Server error.' });
  }
};

const requireRole = (roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: 'Authentication required.' });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ 
        message: 'Access denied. Insufficient permissions.' 
      });
    }

    next();
  };
};

// New middleware for read-only access (Accountant can view but not modify)
const requireReadOnly = (roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: 'Authentication required.' });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ 
        message: 'Access denied. Insufficient permissions.' 
      });
    }

    next();
  };
};

// New middleware for Engineer access (can only access expenses)
const requireEngineer = (roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: 'Authentication required.' });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ 
        message: 'Access denied. Insufficient permissions.' 
      });
    }

    next();
  };
};

// New middleware for Engineer creation only (can only create, not edit/delete)
const requireEngineerCreateOnly = (roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: 'Authentication required.' });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ 
        message: 'Access denied. Insufficient permissions.' 
      });
    }

    // Engineers can only create, not edit or delete
    if (req.user.role === 'Engineer' && (req.method === 'PUT' || req.method === 'DELETE')) {
      return res.status(403).json({ 
        message: 'Access denied. Engineers can only create expenses.' 
      });
    }

    next();
  };
};

const requireAdmin = requireRole(['Admin']);
const requireAccountant = requireRole(['Admin', 'Accountant']);
const requireReadOnlyAccess = requireReadOnly(['Admin', 'Accountant']);
const requireExpenseAccess = requireEngineer(['Admin', 'Accountant', 'Engineer']);
const requireExpenseCreateOnly = requireEngineerCreateOnly(['Admin', 'Accountant', 'Engineer']);

module.exports = {
  auth,
  requireRole,
  requireReadOnly,
  requireEngineer,
  requireAdmin,
  requireAccountant,
  requireReadOnlyAccess,
  requireExpenseAccess,
  requireExpenseCreateOnly
}; 