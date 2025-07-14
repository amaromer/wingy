const express = require('express');
const { body, validationResult } = require('express-validator');
const Supplier = require('../models/Supplier');
const { auth, requireAdmin, requireReadOnlyAccess, requireRole } = require('../middleware/auth');

const router = express.Router();

// Validation middleware
const supplierValidation = [
  body('name').trim().isLength({ min: 2, max: 100 }).withMessage('Name must be between 2 and 100 characters'),
  body('email').optional().isEmail().normalizeEmail().withMessage('Please enter a valid email'),
  body('phone').optional().trim().isLength({ max: 20 }).withMessage('Phone number must be less than 20 characters'),
  body('address').optional().trim().isLength({ max: 500 }).withMessage('Address must be less than 500 characters'),
  body('contact_person').optional().trim().isLength({ max: 100 }).withMessage('Contact person must be less than 100 characters'),
  body('tax_number').optional().trim().isLength({ max: 50 }).withMessage('Tax number must be less than 50 characters'),
  body('payment_terms').optional().trim().isLength({ max: 200 }).withMessage('Payment terms must be less than 200 characters'),
  body('notes').optional().trim().isLength({ max: 1000 }).withMessage('Notes must be less than 1000 characters'),
  body('is_active').optional().isBoolean().withMessage('is_active must be a boolean')
];

// @route   GET /api/suppliers
// @desc    Get all suppliers (Admin and Accountant can view)
// @access  Private (Admin, Accountant)
router.get('/', auth, requireReadOnlyAccess, async (req, res) => {
  try {
    const { search, is_active, sort = 'createdAt', order = 'desc' } = req.query;
    
    let query = {};
    
    // Filter by active status
    if (is_active !== undefined) {
      query.is_active = is_active === 'true';
    }
    
    // Search by name, email, or contact person
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { contact_person: { $regex: search, $options: 'i' } }
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
// @desc    Get supplier by ID (Admin and Accountant can view)
// @access  Private (Admin, Accountant)
router.get('/:id', auth, requireReadOnlyAccess, async (req, res) => {
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
// @desc    Create new supplier (Admin and Accountant)
// @access  Private (Admin, Accountant)
router.post('/', auth, requireRole(['Admin', 'Accountant']), supplierValidation, async (req, res) => {
  try {
    console.log('Received supplier data:', req.body);
    
    // const errors = validationResult(req);
    // if (!errors.isEmpty()) {
    //   console.log('Validation errors:', errors.array());
    //   return res.status(400).json({ errors: errors.array() });
    // }

    const { 
      name, 
      contact_person, 
      phone, 
      email, 
      address, 
      vat_enabled,
      vat_no,
      payment_terms,
      is_active,
      notes,
      main_category_ids
    } = req.body;
    
    // Check if supplier email already exists (only if email is provided)
    if (email) {
      const existingSupplier = await Supplier.findOne({ email });
      if (existingSupplier) {
        return res.status(400).json({ message: 'Supplier with this email already exists' });
      }
    }
    
    const supplier = new Supplier({
      name,
      contact_person,
      phone,
      email,
      address,
      vat_enabled: vat_enabled || false,
      vat_no,
      payment_terms,
      is_active: is_active !== undefined ? is_active : true,
      notes,
      main_category_ids: main_category_ids || []
    });
    
    console.log('Creating supplier with data:', supplier);
    await supplier.save();
    console.log('Supplier saved successfully:', supplier);
    console.log('Supplier ID:', supplier._id);
    
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
router.put('/:id', /* auth, requireAdmin, */ supplierValidation, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { 
      name, 
      contact_person, 
      phone, 
      email, 
      address, 
      vat_enabled,
      vat_no,
      payment_terms,
      is_active,
      notes,
      main_category_ids
    } = req.body;
    
    const supplier = await Supplier.findById(req.params.id);
    if (!supplier) {
      return res.status(404).json({ message: 'Supplier not found' });
    }
    
    // Check if email already exists (excluding current supplier, only if email is provided)
    if (email && email !== supplier.email) {
      const existingSupplier = await Supplier.findOne({ email });
      if (existingSupplier) {
        return res.status(400).json({ message: 'Supplier with this email already exists' });
      }
    }
    
    // Update fields
    if (name) supplier.name = name;
    if (contact_person !== undefined) supplier.contact_person = contact_person;
    if (phone !== undefined) supplier.phone = phone;
    if (email !== undefined) supplier.email = email;
    if (address !== undefined) supplier.address = address;
    if (vat_enabled !== undefined) supplier.vat_enabled = vat_enabled;
    if (vat_no !== undefined) supplier.vat_no = vat_no;
    if (payment_terms !== undefined) supplier.payment_terms = payment_terms;
    if (is_active !== undefined) supplier.is_active = is_active;
    if (notes !== undefined) supplier.notes = notes;
    if (main_category_ids !== undefined) supplier.main_category_ids = main_category_ids;
    
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
router.delete('/:id', /* auth, requireAdmin, */ async (req, res) => {
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