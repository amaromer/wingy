const express = require('express');
const { body, validationResult } = require('express-validator');
const Expense = require('../models/Expense');
const Project = require('../models/Project');
const Supplier = require('../models/Supplier');
const Category = require('../models/Category');
const Employee = require('../models/Employee');
const PettyCash = require('../models/PettyCash');
const { auth, requireRole, requireExpenseAccess, requireExpenseCreateOnly } = require('../middleware/auth');
const { upload, handleUploadError } = require('../middleware/upload');
const createCsvWriter = require('csv-writer').createObjectCsvWriter;
const ExcelJS = require('exceljs');
const path = require('path');

const router = express.Router();

// @route   GET /api/expenses/suppliers-by-category/:categoryId
// @desc    Get suppliers filtered by main category
// @access  Private (Admin, Accountant, Engineer)
router.get('/suppliers-by-category/:categoryId', auth, requireExpenseAccess, async (req, res) => {
  try {
    const { categoryId } = req.params;
    
    // Find suppliers that have this main category in their main_category_ids array
    const suppliers = await Supplier.find({ 
      main_category_ids: categoryId,
      is_active: true 
    }).sort({ name: 1 });
    
    res.json(suppliers);
  } catch (error) {
    console.error('Get suppliers by category error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/expenses/categories-by-main-category/:mainCategoryId
// @desc    Get categories filtered by main category
// @access  Private (Admin, Accountant, Engineer)
router.get('/categories-by-main-category/:mainCategoryId', auth, requireExpenseAccess, async (req, res) => {
  try {
    const { mainCategoryId } = req.params;
    
    // Find categories that have this main category as their main_category_id
    const categories = await Category.find({ 
      main_category_id: mainCategoryId,
      is_active: true 
    }).sort({ name: 1 });
    
    res.json(categories);
  } catch (error) {
    console.error('Get categories by main category error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Custom validation middleware that checks main category supplier_optional setting
const dynamicExpenseValidation = async (req, res, next) => {
  const { category_id, supplier_id } = req.body;
  
  // Basic validation for required fields
  const basicValidation = [
    body('project_id').isMongoId().withMessage('Valid project ID is required'),
    body('amount').isFloat({ min: 0 }).withMessage('Amount must be a positive number'),
    body('currency').isIn(['USD', 'EUR', 'GBP', 'CAD', 'AUD', 'AED', 'SAR', 'QAR', 'KWD', 'BHD', 'OMR', 'JOD']).withMessage('Invalid currency'),
    body('date').isISO8601().withMessage('Date must be a valid date'),
    body('description').trim().isLength({ min: 1, max: 500 }).withMessage('Description is required and must be less than 500 characters'),
    body('invoice_number').optional().trim().isLength({ max: 50 }).withMessage('Invoice number must be less than 50 characters'),
    body('category_id').optional().isMongoId().withMessage('Valid category ID is required')
  ];

  // Check basic validation first
  await Promise.all(basicValidation.map(validation => validation.run(req)));
  const basicErrors = validationResult(req);
  
  if (!basicErrors.isEmpty()) {
    return res.status(400).json({ 
      message: 'Validation failed',
      errors: basicErrors.array() 
    });
  }

  // If supplier_id is provided, validate it
  if (supplier_id) {
    const supplierValidation = body('supplier_id').isMongoId().withMessage('Valid supplier ID is required');
    await supplierValidation.run(req);
    const supplierErrors = validationResult(req);
    
    if (!supplierErrors.isEmpty()) {
      return res.status(400).json({ 
        message: 'Validation failed',
        errors: supplierErrors.array() 
      });
    }
  }

  // If category_id is provided, check if supplier is optional for that category
  if (category_id) {
    try {
      const category = await Category.findById(category_id);
      if (category && category.main_category_id) {
        const MainCategory = require('../models/MainCategory');
        const mainCategory = await MainCategory.findById(category.main_category_id);
        
        if (mainCategory && mainCategory.supplier_optional === false && !supplier_id) {
          return res.status(400).json({ 
            message: 'Validation failed',
            errors: [{ type: 'field', msg: 'Valid supplier ID is required', path: 'supplier_id', location: 'body' }]
          });
        }
      }
    } catch (error) {
      console.error('Error checking main category supplier_optional setting:', error);
      // If we can't check the setting, default to requiring supplier
      if (!supplier_id) {
        return res.status(400).json({ 
          message: 'Validation failed',
          errors: [{ type: 'field', msg: 'Valid supplier ID is required', path: 'supplier_id', location: 'body' }]
        });
      }
    }
  } else {
    // If no category is provided, supplier is optional
    // No additional validation needed
  }

  next();
};

// Static validation middleware (for backward compatibility)
const expenseValidation = [
  body('project_id').isMongoId().withMessage('Valid project ID is required'),
  body('supplier_id').isMongoId().withMessage('Valid supplier ID is required'),
  body('category_id').optional().isMongoId().withMessage('Valid category ID is required'),
  body('amount').isFloat({ min: 0 }).withMessage('Amount must be a positive number'),
  body('currency').isIn(['USD', 'EUR', 'GBP', 'CAD', 'AUD', 'AED', 'SAR', 'QAR', 'KWD', 'BHD', 'OMR', 'JOD']).withMessage('Invalid currency'),
  body('date').isISO8601().withMessage('Date must be a valid date'),
  body('description').trim().isLength({ min: 1, max: 500 }).withMessage('Description is required and must be less than 500 characters'),
  body('invoice_number').optional().trim().isLength({ max: 50 }).withMessage('Invoice number must be less than 50 characters')
];

// @route   GET /api/expenses
// @desc    Get all expenses with filtering
// @access  Private (Admin, Accountant, Engineer)
router.get('/', auth, requireExpenseAccess, async (req, res) => {
  try {
    const { 
      project_id, 
      supplier_id, 
      category_id, 
      date_from, 
      date_to, 
      amount_min, 
      amount_max,
      currency,
      search,
      sort = 'date', 
      order = 'desc' 
    } = req.query;
    
    let query = {};
    
    // Filter by project
    if (project_id) {
      query.project_id = project_id;
    }
    
    // Filter by supplier
    if (supplier_id) {
      query.supplier_id = supplier_id;
    }
    
    // Filter by category
    if (category_id) {
      query.category_id = category_id;
    }
    
    // Filter by date range
    if (date_from || date_to) {
      query.date = {};
      if (date_from) query.date.$gte = new Date(date_from);
      if (date_to) query.date.$lte = new Date(date_to);
    }
    
    // Filter by amount range
    if (amount_min || amount_max) {
      query.amount = {};
      if (amount_min) query.amount.$gte = parseFloat(amount_min);
      if (amount_max) query.amount.$lte = parseFloat(amount_max);
    }
    
    // Filter by currency
    if (currency) {
      query.currency = currency;
    }
    
    // Search by description or invoice number
    if (search) {
      query.$or = [
        { description: { $regex: search, $options: 'i' } },
        { invoice_number: { $regex: search, $options: 'i' } }
      ];
    }
    
    // Sorting
    const sortOrder = order === 'desc' ? -1 : 1;
    const sortOptions = {};
    sortOptions[sort] = sortOrder;
    
    const expenses = await Expense.find(query)
      .populate('project_id', 'name code')
      .populate('supplier_id', 'name contact_person')
      .populate('category_id', 'name')
      .sort(sortOptions)
      .limit(parseInt(req.query.limit) || 50)
      .skip(parseInt(req.query.skip) || 0);
    
    const total = await Expense.countDocuments(query);
    
    res.json({
      expenses,
      total,
      page: Math.floor(parseInt(req.query.skip) / parseInt(req.query.limit)) + 1 || 1,
      pages: Math.ceil(total / (parseInt(req.query.limit) || 50))
    });
  } catch (error) {
    console.error('Get expenses error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/expenses/:id
// @desc    Get expense by ID
// @access  Private
router.get('/:id', auth, async (req, res) => {
  try {
    const expense = await Expense.findById(req.params.id)
      .populate('project_id', 'name code')
      .populate('supplier_id', 'name contact_person email phone')
      .populate('category_id', 'name description');
    
    if (!expense) {
      return res.status(404).json({ message: 'Expense not found' });
    }
    
    res.json(expense);
  } catch (error) {
    console.error('Get expense error:', error);
    if (error.kind === 'ObjectId') {
      return res.status(404).json({ message: 'Expense not found' });
    }
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/expenses
// @desc    Create a new expense
// @access  Private (Admin, Accountant, Engineer)
router.post('/', auth, requireExpenseAccess, upload.single('attachment'), handleUploadError, dynamicExpenseValidation, async (req, res) => {
  try {
    console.log('Creating expense - Request body:', req.body);
    console.log('Creating expense - Request file:', req.file);
    console.log('Creating expense - User:', req.user);

    const { 
      project_id, 
      supplier_id, 
      employee_id,
      category_id, 
      amount, 
      currency, 
      date, 
      description, 
      invoice_number,
      is_vat
    } = req.body;
    
    console.log('Creating expense - Parsed data:', {
      project_id, supplier_id, category_id, amount, currency, date, description, invoice_number
    });
    
    // Validate that referenced entities exist
    const [project] = await Promise.all([
      Project.findById(project_id)
    ]);
    
    // Only validate supplier if supplier_id is provided
    let supplier = null;
    if (supplier_id) {
      supplier = await Supplier.findById(supplier_id);
    }
    
    // Only validate employee if employee_id is provided
    let employee = null;
    if (employee_id) {
      employee = await Employee.findById(employee_id);
    }
    
    // Only validate category if category_id is provided
    let category = null;
    if (category_id) {
      category = await Category.findById(category_id);
    }
    
    console.log('Creating expense - Found entities:', {
      project: project ? project.name : null,
      supplier: supplier ? supplier.name : null,
      employee: employee ? employee.name : null,
      category: category ? category.name : null
    });
    
    if (!project) {
      return res.status(400).json({ message: 'Project not found' });
    }
    if (supplier_id && !supplier) {
      return res.status(400).json({ message: 'Supplier not found' });
    }
    if (employee_id && !employee) {
      return res.status(400).json({ message: 'Employee not found' });
    }
    if (category_id && !category) {
      return res.status(400).json({ message: 'Category not found' });
    }
    
    // Handle file upload
    let attachment_url = null;
    if (req.file) {
      attachment_url = `/uploads/${req.file.filename}`;
    }
    
    const expense = new Expense({
      project_id,
      supplier_id: supplier_id || null,
      employee_id: employee_id || null,
      category_id: category_id || null,
      amount: parseFloat(amount),
      currency,
      date,
      description,
      invoice_number,
      attachment_url,
      is_vat: is_vat === 'true' || is_vat === true
    });

    // Calculate VAT amount if applicable
    let vatAmount = 0;
    if (expense.is_vat) {
      vatAmount = expense.amount * 0.05; // 5% VAT
      expense.vat_amount = vatAmount;
    }

    console.log('Creating expense - Expense object:', expense);
    console.log('Creating expense - VAT amount:', vatAmount);
    
    await expense.save();
    
    console.log('Creating expense - Expense saved successfully');
    
    // If expense is linked to an employee, deduct from petty cash
    if (employee_id) {
      try {
        // Get current balance
        const lastTransaction = await PettyCash.findOne({ employee_id })
          .sort({ createdAt: -1 });

        const currentBalance = lastTransaction ? lastTransaction.balance_after : 0;
        
        // Always deduct from petty cash, even if it results in negative balance
        const newBalance = currentBalance - parseFloat(amount);
        
        const pettyCashTransaction = new PettyCash({
          employee_id,
          type: 'debit',
          amount: parseFloat(amount),
          balance_after: newBalance,
          description: `Expense deduction: ${description}`,
          reference_type: 'expense',
          reference_id: expense._id,
          processed_by: req.user.id
        });
        
        await pettyCashTransaction.save();
        console.log('Creating expense - Petty cash deduction saved');
        console.log(`Employee balance: ${currentBalance} → ${newBalance} (${newBalance < 0 ? 'NEGATIVE' : 'POSITIVE'})`);
      } catch (error) {
        console.error('Creating expense - Petty cash deduction error:', error);
        // Don't fail the expense creation if petty cash deduction fails
      }
    }
    
    // Populate references for response
    await expense.populate('project_id', 'name code');
    await expense.populate('supplier_id', 'name contact_person');
    await expense.populate('employee_id', 'name job');
    await expense.populate('category_id', 'name');
    
    res.status(201).json(expense);
  } catch (error) {
    console.error('Create expense error:', error);
    console.error('Create expense error name:', error.name);
    console.error('Create expense error message:', error.message);
    console.error('Create expense error stack:', error.stack);
    
    // Handle specific validation errors from mongoose
    if (error.name === 'ValidationError') {
      const validationErrors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({ 
        message: 'Validation failed',
        errors: validationErrors 
      });
    }
    
    // Handle duplicate key errors
    if (error.code === 11000) {
      return res.status(400).json({ 
        message: 'Duplicate expense entry. Please check your data.' 
      });
    }
    
    // Handle date validation errors
    if (error.message && error.message.includes('future')) {
      return res.status(400).json({ 
        message: 'Expense date cannot be in the future' 
      });
    }
    
    // Handle database connection errors
    if (error.name === 'MongoNetworkError' || error.name === 'MongoServerSelectionError') {
      return res.status(503).json({ 
        message: 'Database connection error. Please try again later.' 
      });
    }
    
    // Generic server error with more context
    res.status(500).json({ 
      message: 'Failed to create expense. Please check your data and try again.',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// @route   PUT /api/expenses/:id
// @desc    Update expense
// @access  Private (Admin, Accountant)
router.put('/:id', auth, requireExpenseCreateOnly, upload.single('attachment'), handleUploadError, dynamicExpenseValidation, async (req, res) => {
  try {

    const { 
      project_id, 
      supplier_id, 
      employee_id,
      category_id, 
      amount, 
      currency, 
      date, 
      description, 
      invoice_number,
      is_vat
    } = req.body;
    
    const expense = await Expense.findById(req.params.id);
    if (!expense) {
      return res.status(404).json({ message: 'Expense not found' });
    }
    
    // Validate that referenced entities exist
    if (project_id) {
      const project = await Project.findById(project_id);
      if (!project) {
        return res.status(400).json({ message: 'Project not found' });
      }
    }
    if (supplier_id) {
      const supplier = await Supplier.findById(supplier_id);
      if (!supplier) {
        return res.status(400).json({ message: 'Supplier not found' });
      }
    }
    if (employee_id) {
      const employee = await Employee.findById(employee_id);
      if (!employee) {
        return res.status(400).json({ message: 'Employee not found' });
      }
    }
    if (category_id) {
      const category = await Category.findById(category_id);
      if (!category) {
        return res.status(400).json({ message: 'Category not found' });
      }
    }
    
    // Handle file upload
    if (req.file) {
      expense.attachment_url = `/uploads/${req.file.filename}`;
    }
    
    // Update fields
    if (project_id) expense.project_id = project_id;
    if (supplier_id !== undefined) expense.supplier_id = supplier_id || null;
    if (employee_id !== undefined) expense.employee_id = employee_id || null;
    if (category_id !== undefined) expense.category_id = category_id || null;
    if (amount) expense.amount = parseFloat(amount);
    if (currency) expense.currency = currency;
    if (date) expense.date = date;
    if (description) expense.description = description;
    if (invoice_number !== undefined) expense.invoice_number = invoice_number;
    if (is_vat !== undefined) expense.is_vat = is_vat === 'true' || is_vat === true;
    
    await expense.save();
    
    // Populate references for response
    await expense.populate('project_id', 'name code');
    await expense.populate('supplier_id', 'name contact_person');
    await expense.populate('employee_id', 'name job');
    await expense.populate('category_id', 'name');
    
    res.json(expense);
  } catch (error) {
    console.error('Update expense error:', error);
    
    // Handle specific validation errors from mongoose
    if (error.name === 'ValidationError') {
      const validationErrors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({ 
        message: 'Validation failed',
        errors: validationErrors 
      });
    }
    
    // Handle duplicate key errors
    if (error.code === 11000) {
      return res.status(400).json({ 
        message: 'Duplicate expense entry. Please check your data.' 
      });
    }
    
    // Handle date validation errors
    if (error.message && error.message.includes('future')) {
      return res.status(400).json({ 
        message: 'Expense date cannot be in the future' 
      });
    }
    
    if (error.kind === 'ObjectId') {
      return res.status(404).json({ message: 'Expense not found' });
    }
    
    // Handle database connection errors
    if (error.name === 'MongoNetworkError' || error.name === 'MongoServerSelectionError') {
      return res.status(503).json({ 
        message: 'Database connection error. Please try again later.' 
      });
    }
    
    // Generic server error with more context
    res.status(500).json({ 
      message: 'Failed to update expense. Please check your data and try again.',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// @route   DELETE /api/expenses/:id
// @desc    Delete expense
// @access  Private (Admin, Accountant)
router.delete('/:id', auth, requireExpenseCreateOnly, async (req, res) => {
  try {
    const expense = await Expense.findById(req.params.id);
    
    if (!expense) {
      return res.status(404).json({ message: 'Expense not found' });
    }
    
    await Expense.findByIdAndDelete(req.params.id);
    
    res.json({ message: 'Expense deleted successfully' });
  } catch (error) {
    console.error('Delete expense error:', error);
    if (error.kind === 'ObjectId') {
      return res.status(404).json({ message: 'Expense not found' });
    }
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/expenses/export/csv
// @desc    Export expenses to CSV
// @access  Private
router.get('/export/csv', auth, async (req, res) => {
  try {
    const { project_id, category_id, date_from, date_to } = req.query;
    
    let query = {};
    if (project_id) query.project_id = project_id;
    if (category_id) query.category_id = category_id;
    if (date_from || date_to) {
      query.date = {};
      if (date_from) query.date.$gte = new Date(date_from);
      if (date_to) query.date.$lte = new Date(date_to);
    }
    
    const expenses = await Expense.find(query)
      .populate('project_id', 'name code')
      .populate('supplier_id', 'name')
      .populate('category_id', 'name')
      .sort({ date: -1 });
    
    const csvWriter = createCsvWriter({
      path: 'expenses_export.csv',
      header: [
        { id: 'date', title: 'Date' },
        { id: 'project', title: 'Project' },
        { id: 'supplier', title: 'Supplier' },
        { id: 'category', title: 'Category' },
        { id: 'description', title: 'Description' },
        { id: 'amount', title: 'Amount' },
        { id: 'currency', title: 'Currency' },
        { id: 'invoice_number', title: 'Invoice Number' }
      ]
    });
    
    const records = expenses.map(expense => ({
      date: expense.date.toISOString().split('T')[0],
      project: expense.project_id ? `${expense.project_id.code} - ${expense.project_id.name}` : '',
      supplier: expense.supplier_id ? expense.supplier_id.name : '',
      category: expense.category_id ? expense.category_id.name : '',
      description: expense.description,
      amount: expense.amount,
      currency: expense.currency,
      invoice_number: expense.invoice_number || ''
    }));
    
    await csvWriter.writeRecords(records);
    
    res.download('expenses_export.csv', 'expenses_export.csv', (err) => {
      if (err) {
        console.error('Download error:', err);
      }
      // Clean up the file
      require('fs').unlinkSync('expenses_export.csv');
    });
  } catch (error) {
    console.error('Export CSV error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/expenses/export/excel
// @desc    Export expenses to Excel
// @access  Private
router.get('/export/excel', auth, async (req, res) => {
  try {
    const { project_id, category_id, date_from, date_to } = req.query;
    
    let query = {};
    if (project_id) query.project_id = project_id;
    if (category_id) query.category_id = category_id;
    if (date_from || date_to) {
      query.date = {};
      if (date_from) query.date.$gte = new Date(date_from);
      if (date_to) query.date.$lte = new Date(date_to);
    }
    
    const expenses = await Expense.find(query)
      .populate('project_id', 'name code')
      .populate('supplier_id', 'name')
      .populate('category_id', 'name')
      .sort({ date: -1 });
    
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Expenses');
    
    // Add headers
    worksheet.columns = [
      { header: 'Date', key: 'date', width: 15 },
      { header: 'Project', key: 'project', width: 30 },
      { header: 'Supplier', key: 'supplier', width: 25 },
      { header: 'Category', key: 'category', width: 20 },
      { header: 'Description', key: 'description', width: 40 },
      { header: 'Amount', key: 'amount', width: 15 },
      { header: 'Currency', key: 'currency', width: 10 },
      { header: 'Invoice Number', key: 'invoice_number', width: 20 }
    ];
    
    // Add data
    expenses.forEach(expense => {
      worksheet.addRow({
        date: expense.date.toISOString().split('T')[0],
        project: expense.project_id ? `${expense.project_id.code} - ${expense.project_id.name}` : '',
        supplier: expense.supplier_id ? expense.supplier_id.name : '',
        category: expense.category_id ? expense.category_id.name : '',
        description: expense.description,
        amount: expense.amount,
        currency: expense.currency,
        invoice_number: expense.invoice_number || ''
      });
    });
    
    // Style the header row
    worksheet.getRow(1).font = { bold: true };
    worksheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFE0E0E0' }
    };
    
    const filename = 'expenses_export.xlsx';
    await workbook.xlsx.writeFile(filename);
    
    res.download(filename, filename, (err) => {
      if (err) {
        console.error('Download error:', err);
      }
      // Clean up the file
      require('fs').unlinkSync(filename);
    });
  } catch (error) {
    console.error('Export Excel error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/expenses/stats/totals
// @desc    Get expense totals by project and category
// @access  Private
router.get('/stats/totals', auth, async (req, res) => {
  try {
    const { date_from, date_to } = req.query;
    
    let matchStage = {};
    if (date_from || date_to) {
      matchStage.date = {};
      if (date_from) matchStage.date.$gte = new Date(date_from);
      if (date_to) matchStage.date.$lte = new Date(date_to);
    }
    
    const [projectTotals, categoryTotals, totalAmount] = await Promise.all([
      // Total by project
      Expense.aggregate([
        { $match: matchStage },
        {
          $lookup: {
            from: 'projects',
            localField: 'project_id',
            foreignField: '_id',
            as: 'project'
          }
        },
        { $unwind: '$project' },
        {
          $group: {
            _id: '$project_id',
            projectName: { $first: '$project.name' },
            projectCode: { $first: '$project.code' },
            total: { $sum: '$amount' },
            count: { $sum: 1 }
          }
        },
        { $sort: { total: -1 } }
      ]),
      
      // Total by category
      Expense.aggregate([
        { $match: matchStage },
        {
          $lookup: {
            from: 'categories',
            localField: 'category_id',
            foreignField: '_id',
            as: 'category'
          }
        },
        { $unwind: '$category' },
        {
          $group: {
            _id: '$category_id',
            categoryName: { $first: '$category.name' },
            total: { $sum: '$amount' },
            count: { $sum: 1 }
          }
        },
        { $sort: { total: -1 } }
      ]),
      
      // Overall total
      Expense.aggregate([
        { $match: matchStage },
        {
          $group: {
            _id: null,
            total: { $sum: '$amount' },
            count: { $sum: 1 }
          }
        }
      ])
    ]);
    
    res.json({
      projectTotals,
      categoryTotals,
      overallTotal: totalAmount[0] || { total: 0, count: 0 }
    });
  } catch (error) {
    console.error('Get expense stats error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router; 