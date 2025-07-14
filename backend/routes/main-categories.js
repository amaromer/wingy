const express = require('express');
const { body, validationResult } = require('express-validator');
const MainCategory = require('../models/MainCategory');
const { auth, requireRole, requireReadOnlyAccess } = require('../middleware/auth');

const router = express.Router();

// Validation middleware
const mainCategoryValidation = [
  body('name').trim().isLength({ min: 2, max: 100 }).withMessage('Name must be between 2 and 100 characters'),
  body('description').optional().trim().isLength({ max: 500 }).withMessage('Description must be less than 500 characters'),
  body('is_active').optional().isBoolean().withMessage('is_active must be a boolean')
];

// @route   GET /api/main-categories
// @desc    Get all main categories (Admin and Accountant can view)
// @access  Private (Admin, Accountant)
router.get('/', auth, requireReadOnlyAccess, async (req, res) => {
  try {
    const { search, is_active, sort = 'name', order = 'asc' } = req.query;
    
    let query = {};
    
    // Filter by active status
    if (is_active !== undefined) {
      query.is_active = is_active === 'true';
    }
    
    // Search by name or description
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }
    
    // Sorting
    const sortOrder = order === 'desc' ? -1 : 1;
    const sortOptions = {};
    sortOptions[sort] = sortOrder;
    
    const mainCategories = await MainCategory.find(query)
      .sort(sortOptions)
      .limit(parseInt(req.query.limit) || 50)
      .skip(parseInt(req.query.skip) || 0);
    
    const total = await MainCategory.countDocuments(query);
    
    res.json({
      mainCategories,
      total,
      page: Math.floor(parseInt(req.query.skip) / parseInt(req.query.limit)) + 1 || 1,
      pages: Math.ceil(total / (parseInt(req.query.limit) || 50))
    });
  } catch (error) {
    console.error('Get main categories error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/main-categories/:id
// @desc    Get main category by ID (Admin and Accountant can view)
// @access  Private (Admin, Accountant)
router.get('/:id', auth, requireReadOnlyAccess, async (req, res) => {
  try {
    const mainCategory = await MainCategory.findById(req.params.id);
    
    if (!mainCategory) {
      return res.status(404).json({ message: 'Main category not found' });
    }
    
    res.json({ mainCategory });
  } catch (error) {
    console.error('Get main category error:', error);
    if (error.kind === 'ObjectId') {
      return res.status(404).json({ message: 'Main category not found' });
    }
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/main-categories
// @desc    Create new main category (Admin and Accountant)
// @access  Private (Admin, Accountant)
router.post('/', auth, requireRole(['Admin', 'Accountant']), mainCategoryValidation, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { name, description, icon, color, supplier_optional, is_active, sort_order } = req.body;

    // Check if name already exists
    const existingCategory = await MainCategory.findOne({ name: name.trim() });
    if (existingCategory) {
      return res.status(400).json({ message: 'Main category name already exists' });
    }

    const mainCategory = new MainCategory({
      name: name.trim(),
      description: description?.trim(),
      icon: icon?.trim() || '📁',
      color: color || '#6c757d',
      supplier_optional: supplier_optional !== undefined ? supplier_optional : true,
      is_active: is_active !== undefined ? is_active : true,
      sort_order: sort_order || 0
    });

    await mainCategory.save();
    res.status(201).json({ 
      message: 'Main category created successfully',
      mainCategory 
    });
  } catch (error) {
    console.error('Error creating main category:', error);
    if (error.name === 'ValidationError') {
      return res.status(400).json({ message: error.message });
    }
    res.status(500).json({ message: 'Failed to create main category' });
  }
});

// Update main category (Admin only)
router.put('/:id', auth, requireRole(['Admin']), async (req, res) => {
  try {
    const { name, description, icon, color, supplier_optional, is_active, sort_order } = req.body;

    // Debug: Log the received data
    console.log('Updating main category with data:', req.body);
    console.log('supplier_optional value:', supplier_optional, 'type:', typeof supplier_optional);

    // Check if name already exists (excluding current category)
    if (name) {
      const existingCategory = await MainCategory.findOne({ 
        name: name.trim(),
        _id: { $ne: req.params.id }
      });
      if (existingCategory) {
        return res.status(400).json({ message: 'Main category name already exists' });
      }
    }

    const updateData = {
      name: name?.trim(),
      description: description?.trim(),
      icon: icon?.trim(),
      color,
      supplier_optional: supplier_optional !== undefined ? supplier_optional : true,
      is_active,
      sort_order
    };

    console.log('Update data:', updateData);

    const mainCategory = await MainCategory.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    );

    if (!mainCategory) {
      return res.status(404).json({ message: 'Main category not found' });
    }

    console.log('Updated main category:', mainCategory);

    res.json({ 
      message: 'Main category updated successfully',
      mainCategory 
    });
  } catch (error) {
    console.error('Error updating main category:', error);
    if (error.name === 'ValidationError') {
      return res.status(400).json({ message: error.message });
    }
    res.status(500).json({ message: 'Failed to update main category' });
  }
});

// Delete main category (Admin only)
router.delete('/:id', auth, requireRole(['Admin']), async (req, res) => {
  try {
    const mainCategory = await MainCategory.findByIdAndDelete(req.params.id);
    if (!mainCategory) {
      return res.status(404).json({ message: 'Main category not found' });
    }

    res.json({ message: 'Main category deleted successfully' });
  } catch (error) {
    console.error('Error deleting main category:', error);
    res.status(500).json({ message: 'Failed to delete main category' });
  }
});

module.exports = router; 