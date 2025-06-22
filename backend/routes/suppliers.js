const express = require('express');
const { body, validationResult } = require('express-validator');
const Supplier = require('../models/Supplier');
const { auth, requireAdmin } = require('../middleware/auth');

const router = express.Router();

// Validation middleware
const supplierValidation = [
  body('name').trim().isLength({ min: 1, max: 100 }).withMessage('Supplier name is required and must be less than 100 characters'),
  body('contact_person').trim().isLength({ min: 1, max: 100 }).withMessage('Contact person is required and must be less than 100 characters'),
  body('phone').matches(/^[\+]?[1-9][\d]{0,15}$/).withMessage('Please enter a valid phone number'),
  body('email').isEmail().normalizeEmail().withMessage('Please enter a valid email'),
  body('address').trim().isLength({ min: 1, max: 500 }).withMessage('Address is required and must be less than 500 characters'),
  body('notes').optional().trim().isLength({ max: 1000 }).withMessage('Notes must be less than 1000 characters')
];

// @route   GET /api/suppliers
// @desc    Get all suppliers
// @access  Private
router.get('/', auth, async (req, res) => {
  try {
    const { search, sort = 'name', order = 'asc' } = req.query;
    
    let query = {};
    
    // Search by name, contact person, or email
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { contact_person: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }
    
    // Sorting
    const sortOrder = order === 'desc' ? -1 : 1;
    const sortOptions = {};
    sortOptions[sort] = sortOrder;
    
    const suppliers = await Supplier.find(query)
      .sort(sortOptions)
      .limit(parseInt(req.query.limit) || 50)
      .skip(parseInt(req.query.skip) || 0);
    
    const total = await Supplier.countDocuments(query);
    
    res.json({
      suppliers,
      total,
      page: Math.floor(parseInt(req.query.skip) / parseInt(req.query.limit)) + 1 || 1,
      pages: Math.ceil(total / (parseInt(req.query.limit) || 50))
    });
  } catch (error) {
    console.error('Get suppliers error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/suppliers/:id
// @desc    Get supplier by ID
// @access  Private
router.get('/:id', auth, async (req, res) => {
  try {
    const supplier = await Supplier.findById(req.params.id);
    
    if (!supplier) {
      return res.status(404).json({ message: 'Supplier not found' });
    }
    
    res.json(supplier);
  } catch (error) {
    console.error('Get supplier error:', error);
    if (error.kind === 'ObjectId') {
      return res.status(404).json({ message: 'Supplier not found' });
    }
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/suppliers
// @desc    Create a new supplier
// @access  Private (Admin)
router.post('/', auth, requireAdmin, supplierValidation, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { name, contact_person, phone, email, address, notes } = req.body;
    
    // Check if supplier email already exists
    const existingSupplier = await Supplier.findOne({ email });
    if (existingSupplier) {
      return res.status(400).json({ message: 'Supplier with this email already exists' });
    }
    
    const supplier = new Supplier({
      name,
      contact_person,
      phone,
      email,
      address,
      notes
    });
    
    await supplier.save();
    
    res.status(201).json(supplier);
  } catch (error) {
    console.error('Create supplier error:', error);
    if (error.code === 11000) {
      return res.status(400).json({ message: 'Supplier with this email already exists' });
    }
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/suppliers/:id
// @desc    Update supplier
// @access  Private (Admin)
router.put('/:id', auth, requireAdmin, supplierValidation, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { name, contact_person, phone, email, address, notes } = req.body;
    
    const supplier = await Supplier.findById(req.params.id);
    if (!supplier) {
      return res.status(404).json({ message: 'Supplier not found' });
    }
    
    // Check if email already exists (excluding current supplier)
    if (email && email !== supplier.email) {
      const existingSupplier = await Supplier.findOne({ email });
      if (existingSupplier) {
        return res.status(400).json({ message: 'Supplier with this email already exists' });
      }
    }
    
    // Update fields
    if (name) supplier.name = name;
    if (contact_person) supplier.contact_person = contact_person;
    if (phone) supplier.phone = phone;
    if (email) supplier.email = email;
    if (address) supplier.address = address;
    if (notes !== undefined) supplier.notes = notes;
    
    await supplier.save();
    
    res.json(supplier);
  } catch (error) {
    console.error('Update supplier error:', error);
    if (error.kind === 'ObjectId') {
      return res.status(404).json({ message: 'Supplier not found' });
    }
    if (error.code === 11000) {
      return res.status(400).json({ message: 'Supplier with this email already exists' });
    }
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   DELETE /api/suppliers/:id
// @desc    Delete supplier
// @access  Private (Admin)
router.delete('/:id', auth, requireAdmin, async (req, res) => {
  try {
    const supplier = await Supplier.findById(req.params.id);
    
    if (!supplier) {
      return res.status(404).json({ message: 'Supplier not found' });
    }
    
    // Check if supplier has associated expenses
    const Expense = require('../models/Expense');
    const expenseCount = await Expense.countDocuments({ supplier_id: req.params.id });
    
    if (expenseCount > 0) {
      return res.status(400).json({ 
        message: `Cannot delete supplier. It has ${expenseCount} associated expenses.` 
      });
    }
    
    await Supplier.findByIdAndDelete(req.params.id);
    
    res.json({ message: 'Supplier deleted successfully' });
  } catch (error) {
    console.error('Delete supplier error:', error);
    if (error.kind === 'ObjectId') {
      return res.status(404).json({ message: 'Supplier not found' });
    }
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router; 