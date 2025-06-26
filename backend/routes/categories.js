const express = require('express');
const { body, validationResult } = require('express-validator');
const Category = require('../models/Category');
const { auth, requireAdmin } = require('../middleware/auth');

const router = express.Router();

// Validation middleware
const categoryValidation = [
  // Simplified validation for debugging
  body('name').optional().trim(),
  body('code').optional().trim(),
  body('description').optional().trim(),
  body('parent_category').optional(),
  body('is_active').optional()
];

// @route   GET /api/categories
// @desc    Get all categories
// @access  Private
router.get('/', /* auth, */ async (req, res) => {
  try {
    const { search, sort = 'name', order = 'asc' } = req.query;
    
    let query = {};
    
    // Search by name
    if (search) {
      query.name = { $regex: search, $options: 'i' };
    }
    
    // Sorting
    const sortOrder = order === 'desc' ? -1 : 1;
    const sortOptions = {};
    sortOptions[sort] = sortOrder;
    
    const categories = await Category.find(query)
      .populate('parent_category', 'name code')
      .sort(sortOptions)
      .limit(parseInt(req.query.limit) || 50)
      .skip(parseInt(req.query.skip) || 0);
    
    const total = await Category.countDocuments(query);
    
    res.json({
      categories,
      total,
      page: Math.floor(parseInt(req.query.skip) / parseInt(req.query.limit)) + 1 || 1,
      pages: Math.ceil(total / (parseInt(req.query.limit) || 50))
    });
  } catch (error) {
    console.error('Get categories error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/categories/:id
// @desc    Get category by ID
// @access  Private
router.get('/:id', /* auth, */ async (req, res) => {
  try {
    const category = await Category.findById(req.params.id)
      .populate('parent_category', 'name code');
    
    if (!category) {
      return res.status(404).json({ message: 'Category not found' });
    }
    
    res.json(category);
  } catch (error) {
    console.error('Get category error:', error);
    if (error.kind === 'ObjectId') {
      return res.status(404).json({ message: 'Category not found' });
    }
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/categories
// @desc    Create a new category
// @access  Private (Admin)
router.post('/', /* auth, requireAdmin, */ categoryValidation, async (req, res) => {
  try {
    console.log('Received category data:', req.body);
    
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.log('Validation errors:', errors.array());
      return res.status(400).json({ errors: errors.array() });
    }

    const { name, code, description, parent_category, is_active } = req.body;
    
    // Generate unique category code if not provided
    let categoryCode = null;
    if (code?.trim()) {
      categoryCode = code.trim().toUpperCase();
    } else {
      // Generate a simple unique code
      const timestamp = Date.now().toString().slice(-4);
      const random = Math.random().toString(36).substring(2, 4).toUpperCase();
      categoryCode = `CAT-${timestamp}-${random}`;
    }

    // Check if code already exists
    if (categoryCode) {
      const existingCategory = await Category.findOne({ code: categoryCode });
      if (existingCategory) {
        return res.status(400).json({ message: 'Category with this code already exists' });
      }
    }

    // Simplified category creation for debugging
    const categoryData = {
      name: name?.trim() || 'Untitled Category',
      description: description?.trim() || '',
      parent_category: parent_category || null,
      is_active: is_active !== undefined ? is_active : true
    };

    // Only add code if it's provided
    if (categoryCode) {
      categoryData.code = categoryCode;
    }
    
    console.log('Creating category with data:', categoryData);
    
    const category = new Category(categoryData);
    
    await category.save();
    
    // Populate the parent category before sending response
    await category.populate('parent_category', 'name code');
    
    console.log('Category created successfully:', category);
    res.status(201).json(category);
  } catch (error) {
    console.error('Create category error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   PUT /api/categories/:id
// @desc    Update category
// @access  Private (Admin)
router.put('/:id', /* auth, requireAdmin, */ categoryValidation, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { name, code, description, parent_category, is_active } = req.body;
    
    const category = await Category.findById(req.params.id);
    if (!category) {
      return res.status(404).json({ message: 'Category not found' });
    }
    
    // Check if name already exists (excluding current category)
    if (name && name.trim() !== category.name) {
      const existingName = await Category.findOne({ name: name.trim() });
      if (existingName) {
        return res.status(400).json({ message: 'Category with this name already exists' });
      }
    }

    // Check if code already exists (excluding current category)
    if (code && code.trim().toUpperCase() !== category.code) {
      const existingCode = await Category.findOne({ code: code.trim().toUpperCase() });
      if (existingCode) {
        return res.status(400).json({ message: 'Category with this code already exists' });
      }
    }
    
    // Update fields
    if (name !== undefined) category.name = name.trim();
    if (code !== undefined) category.code = code.trim().toUpperCase();
    if (description !== undefined) category.description = description?.trim() || '';
    if (parent_category !== undefined) category.parent_category = parent_category || null;
    if (is_active !== undefined) category.is_active = is_active;
    
    await category.save();
    
    // Populate the parent category before sending response
    await category.populate('parent_category', 'name code');
    
    res.json(category);
  } catch (error) {
    console.error('Update category error:', error);
    if (error.kind === 'ObjectId') {
      return res.status(404).json({ message: 'Category not found' });
    }
    if (error.code === 11000) {
      return res.status(400).json({ message: 'Category with this name or code already exists' });
    }
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   DELETE /api/categories/:id
// @desc    Delete category
// @access  Private (Admin)
router.delete('/:id', /* auth, requireAdmin, */ async (req, res) => {
  try {
    const category = await Category.findById(req.params.id);
    
    if (!category) {
      return res.status(404).json({ message: 'Category not found' });
    }
    
    // Check if category has associated expenses
    const Expense = require('../models/Expense');
    const expenseCount = await Expense.countDocuments({ category_id: req.params.id });
    
    if (expenseCount > 0) {
      return res.status(400).json({ 
        message: `Cannot delete category. It has ${expenseCount} associated expenses.` 
      });
    }
    
    await Category.findByIdAndDelete(req.params.id);
    
    res.json({ message: 'Category deleted successfully' });
  } catch (error) {
    console.error('Delete category error:', error);
    if (error.kind === 'ObjectId') {
      return res.status(404).json({ message: 'Category not found' });
    }
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router; 