const express = require('express');
const router = express.Router();
const MainCategory = require('../models/MainCategory');
const { auth, requireRole } = require('../middleware/auth');

// Get all main categories (active only for non-admin users)
router.get('/', auth, async (req, res) => {
  try {
    const query = req.user.role === 'Admin' ? {} : { is_active: true };
    const mainCategories = await MainCategory.find(query).sort({ sort_order: 1, name: 1 });
    
    // Add default supplier_optional field for existing categories that don't have it
    const processedCategories = mainCategories.map(category => {
      const categoryObj = category.toObject();
      if (categoryObj.supplier_optional === undefined) {
        categoryObj.supplier_optional = true; // Default to optional for existing categories
      }
      return categoryObj;
    });
    
    res.json({ mainCategories: processedCategories });
  } catch (error) {
    console.error('Error fetching main categories:', error);
    res.status(500).json({ message: 'Failed to fetch main categories' });
  }
});

// Get main category by ID
router.get('/:id', auth, async (req, res) => {
  try {
    const mainCategory = await MainCategory.findById(req.params.id);
    if (!mainCategory) {
      return res.status(404).json({ message: 'Main category not found' });
    }
    
    // Add default supplier_optional field if it doesn't exist
    const categoryObj = mainCategory.toObject();
    if (categoryObj.supplier_optional === undefined) {
      categoryObj.supplier_optional = true; // Default to optional for existing categories
    }
    
    res.json({ mainCategory: categoryObj });
  } catch (error) {
    console.error('Error fetching main category:', error);
    res.status(500).json({ message: 'Failed to fetch main category' });
  }
});

// Create new main category (Admin only)
router.post('/', auth, requireRole(['Admin']), async (req, res) => {
  try {
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