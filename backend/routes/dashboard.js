const express = require('express');
const Expense = require('../models/Expense');
const Project = require('../models/Project');
const Supplier = require('../models/Supplier');
const Category = require('../models/Category');
const User = require('../models/User');
const Payment = require('../models/Payment');
const { auth } = require('../middleware/auth');

const router = express.Router();

// @route   GET /api/dashboard/overview
// @desc    Get dashboard overview statistics
// @access  Private
router.get('/overview', auth, async (req, res) => {
  try {
    const { date_from, date_to } = req.query;
    
    let matchStage = {};
    if (date_from || date_to) {
      matchStage.date = {};
      if (date_from) matchStage.date.$gte = new Date(date_from);
      if (date_to) matchStage.date.$lte = new Date(date_to);
    }
    
    const [
      totalExpenses,
      totalProjects,
      totalSuppliers,
      totalCategories,
      totalUsers,
      totalPayments,
      vatStats,
      expenseStats,
      projectStats,
      recentExpenses
    ] = await Promise.all([
      // Total expenses
      Expense.aggregate([
        { $match: matchStage },
        {
          $group: {
            _id: null,
            total: { $sum: '$amount' },
            count: { $sum: 1 }
          }
        }
      ]),
      
      // Total projects
      Project.countDocuments(),
      
      // Total suppliers
      Supplier.countDocuments(),
      
      // Total categories
      Category.countDocuments(),
      
      // Total users
      User.countDocuments({ is_active: true }),
      
      // Total payments
      Payment.aggregate([
        { $match: matchStage },
        {
          $group: {
            _id: null,
            total: { $sum: '$amount' },
            count: { $sum: 1 }
          }
        }
      ]),
      
      // VAT statistics
      Promise.all([
        // Expenses VAT - Use stored VAT amount
        Expense.aggregate([
          { $match: { ...matchStage, is_vat: true } },
          {
            $group: {
              _id: null,
              total: { $sum: '$vat_amount' }
            }
          }
        ]),
        // Payments VAT
        Payment.aggregate([
          { $match: matchStage },
          {
            $group: {
              _id: null,
              total: { $sum: '$vat_amount' }
            }
          }
        ])
      ]),
      
      // Expense statistics by month
      Expense.aggregate([
        { $match: matchStage },
        {
          $group: {
            _id: {
              year: { $year: '$date' },
              month: { $month: '$date' }
            },
            total: { $sum: '$amount' },
            count: { $sum: 1 }
          }
        },
        { $sort: { '_id.year': 1, '_id.month': 1 } },
        { $limit: 12 }
      ]),
      
      // Project statistics
      Project.aggregate([
        {
          $group: {
            _id: '$status',
            count: { $sum: 1 }
          }
        }
      ]),
      
      // Recent expenses
      Expense.find(matchStage)
        .populate('project_id', 'name code')
        .populate('supplier_id', 'name')
        .populate('category_id', 'name')
        .sort({ date: -1 })
        .limit(5)
    ]);
    
    // Calculate VAT totals
    const expensesVAT = vatStats[0][0]?.total || 0;
    const paymentsVAT = vatStats[1][0]?.total || 0;
    const totalVAT = expensesVAT + paymentsVAT;
    const netVAT = paymentsVAT - expensesVAT;

    res.json({
      overview: {
        totalExpenses: totalExpenses[0]?.total || 0,
        totalExpenseCount: totalExpenses[0]?.count || 0,
        totalProjects,
        totalSuppliers,
        totalCategories,
        totalUsers,
        totalPayments: totalPayments[0]?.total || 0,
        totalVAT,
        netVAT
      },
      expenseStats: expenseStats.map(stat => ({
        period: `${stat._id.year}-${String(stat._id.month).padStart(2, '0')}`,
        total: stat.total,
        count: stat.count
      })),
      projectStats,
      recentExpenses,
      vatStats: {
        currentCycle: 'June-August 2024', // This should be calculated based on current date
        expensesVAT,
        paymentsVAT,
        netVAT
      }
    });
  } catch (error) {
    console.error('Get dashboard overview error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/dashboard/expenses-by-project
// @desc    Get expenses breakdown by project
// @access  Private
router.get('/expenses-by-project', auth, async (req, res) => {
  try {
    const { date_from, date_to, limit = 10 } = req.query;
    
    let matchStage = {};
    if (date_from || date_to) {
      matchStage.date = {};
      if (date_from) matchStage.date.$gte = new Date(date_from);
      if (date_to) matchStage.date.$lte = new Date(date_to);
    }
    
    const projectExpenses = await Expense.aggregate([
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
      { $sort: { total: -1 } },
      { $limit: parseInt(limit) }
    ]);
    
    res.json(projectExpenses);
  } catch (error) {
    console.error('Get expenses by project error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/dashboard/expenses-by-category
// @desc    Get expenses breakdown by category
// @access  Private
router.get('/expenses-by-category', auth, async (req, res) => {
  try {
    const { date_from, date_to } = req.query;
    
    let matchStage = {};
    if (date_from || date_to) {
      matchStage.date = {};
      if (date_from) matchStage.date.$gte = new Date(date_from);
      if (date_to) matchStage.date.$lte = new Date(date_to);
    }
    
    const categoryExpenses = await Expense.aggregate([
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
    ]);
    
    res.json(categoryExpenses);
  } catch (error) {
    console.error('Get expenses by category error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/dashboard/monthly-trend
// @desc    Get monthly expense trend
// @access  Private
router.get('/monthly-trend', auth, async (req, res) => {
  try {
    const { months = 12, date_from, date_to } = req.query;
    
    let startDate, endDate;
    
    if (date_from || date_to) {
      // Use provided date range
      startDate = date_from ? new Date(date_from) : new Date(0);
      endDate = date_to ? new Date(date_to) : new Date();
    } else {
      // Use months parameter
      endDate = new Date();
      startDate = new Date();
      startDate.setFullYear(endDate.getFullYear());
      startDate.setMonth(endDate.getMonth() - parseInt(months) + 1);
      startDate.setDate(1);
      startDate.setHours(0, 0, 0, 0);
    }
    
    const monthlyTrend = await Expense.aggregate([
      {
        $match: {
          date: { $gte: startDate, $lte: endDate }
        }
      },
      {
        $group: {
          _id: {
            year: { $year: '$date' },
            month: { $month: '$date' }
          },
          total: { $sum: '$amount' },
          count: { $sum: 1 }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } }
    ]);
    
    // Fill in missing months with zero values
    const trendData = [];
    const currentDate = new Date(startDate);
    
    for (let i = 0; i < parseInt(months); i++) {
      const year = currentDate.getFullYear();
      const month = currentDate.getMonth() + 1;
      
      const existingData = monthlyTrend.find(
        item => item._id.year === year && item._id.month === month
      );
      
      trendData.push({
        period: `${year}-${String(month).padStart(2, '0')}`,
        total: existingData ? existingData.total : 0,
        count: existingData ? existingData.count : 0
      });
      
      currentDate.setMonth(currentDate.getMonth() + 1);
    }
    
    res.json(trendData);
  } catch (error) {
    console.error('Get monthly trend error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/dashboard/top-suppliers
// @desc    Get top suppliers by expense amount
// @access  Private
router.get('/top-suppliers', auth, async (req, res) => {
  try {
    const { date_from, date_to, limit = 10 } = req.query;
    
    let matchStage = {};
    if (date_from || date_to) {
      matchStage.date = {};
      if (date_from) matchStage.date.$gte = new Date(date_from);
      if (date_to) matchStage.date.$lte = new Date(date_to);
    }
    
    const topSuppliers = await Expense.aggregate([
      { $match: matchStage },
      {
        $lookup: {
          from: 'suppliers',
          localField: 'supplier_id',
          foreignField: '_id',
          as: 'supplier'
        }
      },
      { $unwind: '$supplier' },
      {
        $group: {
          _id: '$supplier_id',
          supplierName: { $first: '$supplier.name' },
          contactPerson: { $first: '$supplier.contact_person' },
          total: { $sum: '$amount' },
          count: { $sum: 1 }
        }
      },
      { $sort: { total: -1 } },
      { $limit: parseInt(limit) }
    ]);
    
    res.json(topSuppliers);
  } catch (error) {
    console.error('Get top suppliers error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/dashboard/currency-breakdown
// @desc    Get expenses breakdown by currency
// @access  Private
router.get('/currency-breakdown', auth, async (req, res) => {
  try {
    const { date_from, date_to } = req.query;
    
    let matchStage = {};
    if (date_from || date_to) {
      matchStage.date = {};
      if (date_from) matchStage.date.$gte = new Date(date_from);
      if (date_to) matchStage.date.$lte = new Date(date_to);
    }
    
    const currencyBreakdown = await Expense.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: '$currency',
          total: { $sum: '$amount' },
          count: { $sum: 1 }
        }
      },
      { $sort: { total: -1 } }
    ]);
    
    res.json(currencyBreakdown);
  } catch (error) {
    console.error('Get currency breakdown error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/dashboard/recent-activity
// @desc    Get recent activity (expenses, projects, etc.)
// @access  Private
router.get('/recent-activity', auth, async (req, res) => {
  try {
    const { limit = 20 } = req.query;
    
    const [recentExpenses, recentProjects] = await Promise.all([
      // Recent expenses
      Expense.find()
        .populate('project_id', 'name code')
        .populate('supplier_id', 'name')
        .populate('category_id', 'name')
        .sort({ createdAt: -1 })
        .limit(parseInt(limit) / 2),
      
      // Recent projects
      Project.find()
        .sort({ createdAt: -1 })
        .limit(parseInt(limit) / 2)
    ]);
    
    // Combine and sort by creation date
    const activities = [
      ...recentExpenses.map(expense => ({
        type: 'expense',
        id: expense._id,
        title: `Expense: ${expense.description}`,
        subtitle: `${expense.project_id?.name || 'Unknown Project'} - ${expense.formattedAmount}`,
        date: expense.createdAt,
        data: expense
      })),
      ...recentProjects.map(project => ({
        type: 'project',
        id: project._id,
        title: `Project: ${project.name}`,
        subtitle: `${project.code} - ${project.status}`,
        date: project.createdAt,
        data: project
      }))
    ].sort((a, b) => b.date - a.date).slice(0, parseInt(limit));
    
    res.json(activities);
  } catch (error) {
    console.error('Get recent activity error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/dashboard/first-expense-date
// @desc    Get the date of the first expense
// @access  Private
router.get('/first-expense-date', auth, async (req, res) => {
  try {
    const firstExpense = await Expense.findOne().sort({ date: 1 }).select('date');
    
    if (firstExpense) {
      res.json({ 
        firstExpenseDate: firstExpense.date.toISOString().split('T')[0] 
      });
    } else {
      res.json({ firstExpenseDate: null });
    }
  } catch (error) {
    console.error('Get first expense date error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router; 