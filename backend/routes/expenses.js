const express = require('express');
const { body, validationResult } = require('express-validator');
const Expense = require('../models/Expense');
const Project = require('../models/Project');
const Supplier = require('../models/Supplier');
const Category = require('../models/Category');
const { auth, requireAccountant } = require('../middleware/auth');
const { upload, handleUploadError } = require('../middleware/upload');
const createCsvWriter = require('csv-writer').createObjectCsvWriter;
const ExcelJS = require('exceljs');
const path = require('path');

const router = express.Router();

// Validation middleware
const expenseValidation = [
  body('project_id').isMongoId().withMessage('Valid project ID is required'),
  body('supplier_id').isMongoId().withMessage('Valid supplier ID is required'),
  body('category_id').isMongoId().withMessage('Valid category ID is required'),
  body('amount').isFloat({ min: 0 }).withMessage('Amount must be a positive number'),
  body('currency').isIn(['USD', 'EUR', 'GBP', 'CAD', 'AUD']).withMessage('Invalid currency'),
  body('date').isISO8601().withMessage('Date must be a valid date'),
  body('description').trim().isLength({ min: 1, max: 500 }).withMessage('Description is required and must be less than 500 characters'),
  body('invoice_number').optional().trim().isLength({ max: 50 }).withMessage('Invoice number must be less than 50 characters')
];

// @route   GET /api/expenses
// @desc    Get all expenses with filtering
// @access  Private
router.get('/', auth, async (req, res) => {
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
// @access  Private (Accountant)
router.post('/', auth, requireAccountant, upload, handleUploadError, expenseValidation, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { 
      project_id, 
      supplier_id, 
      category_id, 
      amount, 
      currency, 
      date, 
      description, 
      invoice_number 
    } = req.body;
    
    // Validate that referenced entities exist
    const [project, supplier, category] = await Promise.all([
      Project.findById(project_id),
      Supplier.findById(supplier_id),
      Category.findById(category_id)
    ]);
    
    if (!project) {
      return res.status(400).json({ message: 'Project not found' });
    }
    if (!supplier) {
      return res.status(400).json({ message: 'Supplier not found' });
    }
    if (!category) {
      return res.status(400).json({ message: 'Category not found' });
    }
    
    // Handle file upload
    let attachment_url = null;
    if (req.file) {
      attachment_url = `/uploads/${req.file.filename}`;
    }
    
    const expense = new Expense({
      project_id,
      supplier_id,
      category_id,
      amount: parseFloat(amount),
      currency,
      date,
      description,
      invoice_number,
      attachment_url
    });
    
    await expense.save();
    
    // Populate references for response
    await expense.populate('project_id', 'name code');
    await expense.populate('supplier_id', 'name contact_person');
    await expense.populate('category_id', 'name');
    
    res.status(201).json(expense);
  } catch (error) {
    console.error('Create expense error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/expenses/:id
// @desc    Update expense
// @access  Private (Accountant)
router.put('/:id', auth, requireAccountant, upload, handleUploadError, expenseValidation, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { 
      project_id, 
      supplier_id, 
      category_id, 
      amount, 
      currency, 
      date, 
      description, 
      invoice_number 
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
    if (supplier_id) expense.supplier_id = supplier_id;
    if (category_id) expense.category_id = category_id;
    if (amount) expense.amount = parseFloat(amount);
    if (currency) expense.currency = currency;
    if (date) expense.date = date;
    if (description) expense.description = description;
    if (invoice_number !== undefined) expense.invoice_number = invoice_number;
    
    await expense.save();
    
    // Populate references for response
    await expense.populate('project_id', 'name code');
    await expense.populate('supplier_id', 'name contact_person');
    await expense.populate('category_id', 'name');
    
    res.json(expense);
  } catch (error) {
    console.error('Update expense error:', error);
    if (error.kind === 'ObjectId') {
      return res.status(404).json({ message: 'Expense not found' });
    }
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   DELETE /api/expenses/:id
// @desc    Delete expense
// @access  Private (Accountant)
router.delete('/:id', auth, requireAccountant, async (req, res) => {
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