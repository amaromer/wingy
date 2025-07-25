const express = require('express');
const router = express.Router();
const PettyCash = require('../models/PettyCash');
const Employee = require('../models/Employee');
const { auth } = require('../middleware/auth');

// Get all petty cash transactions
router.get('/', auth, async (req, res) => {
  try {
    const { page = 1, limit = 10, employee_id, type, reference_type } = req.query;
    
    const query = {};
    if (employee_id) query.employee_id = employee_id;
    if (type) query.type = type;
    if (reference_type) query.reference_type = reference_type;

    const transactions = await PettyCash.find(query)
      .populate('employee_id', 'name job')
      .populate('transfer_to_employee', 'name')
      .populate('transfer_from_employee', 'name')
      .populate('processed_by', 'name')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .exec();

    const count = await PettyCash.countDocuments(query);

    res.json({
      transactions,
      totalPages: Math.ceil(count / limit),
      currentPage: page,
      total: count
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get all employee balances
router.get('/balances', auth, async (req, res) => {
  try {
    console.log('Fetching employee balances...');
    
    const employees = await Employee.find({ is_active: true });
    console.log('Found employees:', employees.length);
    
    const balances = [];

    for (const employee of employees) {
      console.log('Processing employee:', employee.name);
      
      const lastTransaction = await PettyCash.findOne({ employee_id: employee._id })
        .sort({ createdAt: -1 });

      const currentBalance = lastTransaction ? lastTransaction.balance_after : 0;
      console.log('Current balance for', employee.name, ':', currentBalance);

      // Get total expenses for this employee
      const Expense = require('../models/Expense');
      const totalExpenses = await Expense.aggregate([
        { $match: { employee_id: employee._id } },
        { $group: { _id: null, total: { $sum: '$amount' } } }
      ]);
      
      const totalExpensesAmount = totalExpenses.length > 0 ? totalExpenses[0].total : 0;
      console.log('Total expenses for', employee.name, ':', totalExpensesAmount);

      // Calculate the difference between total expenses and current balance
      // Positive difference means expenses exceed credit (employee owes money)
      // Negative difference means credit exceeds expenses (employee has surplus)
      const expenseCreditDifference = totalExpensesAmount - currentBalance;
      console.log('Expense-Credit difference for', employee.name, ':', expenseCreditDifference);

      // Get recent transactions for this employee
      const recentTransactions = await PettyCash.find({ employee_id: employee._id })
        .sort({ createdAt: -1 })
        .limit(5)
        .populate('transfer_to_employee', 'name')
        .populate('transfer_from_employee', 'name')
        .populate('processed_by', 'name');

      console.log('Recent transactions for', employee.name, ':', recentTransactions.length);

      balances.push({
        employee,
        currentBalance,
        totalExpenses: totalExpensesAmount,
        expenseCreditDifference,
        recentTransactions
      });
    }

    console.log('Sending balances response:', balances.length, 'employees');
    res.json(balances);
  } catch (error) {
    console.error('Error in /balances endpoint:', error);
    res.status(500).json({ message: error.message });
  }
});

// Get single transaction
router.get('/:id', auth, async (req, res) => {
  try {
    const transaction = await PettyCash.findById(req.params.id)
      .populate('employee_id', 'name job')
      .populate('transfer_to_employee', 'name')
      .populate('transfer_from_employee', 'name')
      .populate('processed_by', 'name');
    
    if (!transaction) {
      return res.status(404).json({ message: 'Transaction not found' });
    }
    res.json(transaction);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Add credit to employee
router.post('/credit', auth, async (req, res) => {
  try {
    const { employee_id, amount, description } = req.body;

    if (!employee_id || !amount || !description) {
      return res.status(400).json({ message: 'Employee, amount, and description are required' });
    }

    // Check if employee exists
    const employee = await Employee.findById(employee_id);
    if (!employee) {
      return res.status(404).json({ message: 'Employee not found' });
    }

    // Get current balance
    const lastTransaction = await PettyCash.findOne({ employee_id })
      .sort({ createdAt: -1 });

    const currentBalance = lastTransaction ? lastTransaction.balance_after : 0;
    const newBalance = currentBalance + parseFloat(amount);

    const transaction = new PettyCash({
      employee_id,
      type: 'credit',
      amount: parseFloat(amount),
      balance_after: newBalance,
      description,
      reference_type: 'manual',
      processed_by: req.user.id
    });

    const savedTransaction = await transaction.save();
    const populatedTransaction = await PettyCash.findById(savedTransaction._id)
      .populate('employee_id', 'name job')
      .populate('processed_by', 'name');

    res.status(201).json(populatedTransaction);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Deduct from employee
router.post('/debit', auth, async (req, res) => {
  try {
    const { employee_id, amount, description } = req.body;

    if (!employee_id || !amount || !description) {
      return res.status(400).json({ message: 'Employee, amount, and description are required' });
    }

    // Check if employee exists
    const employee = await Employee.findById(employee_id);
    if (!employee) {
      return res.status(404).json({ message: 'Employee not found' });
    }

    // Get current balance
    const lastTransaction = await PettyCash.findOne({ employee_id })
      .sort({ createdAt: -1 });

    const currentBalance = lastTransaction ? lastTransaction.balance_after : 0;
    
    if (currentBalance < parseFloat(amount)) {
      return res.status(400).json({ message: 'Insufficient balance' });
    }

    const newBalance = currentBalance - parseFloat(amount);

    const transaction = new PettyCash({
      employee_id,
      type: 'debit',
      amount: parseFloat(amount),
      balance_after: newBalance,
      description,
      reference_type: 'manual',
      processed_by: req.user.id
    });

    const savedTransaction = await transaction.save();
    const populatedTransaction = await PettyCash.findById(savedTransaction._id)
      .populate('employee_id', 'name job')
      .populate('processed_by', 'name');

    res.status(201).json(populatedTransaction);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Transfer between employees
router.post('/transfer', auth, async (req, res) => {
  try {
    const { from_employee_id, to_employee_id, amount, description } = req.body;

    if (!from_employee_id || !to_employee_id || !amount || !description) {
      return res.status(400).json({ message: 'From employee, to employee, amount, and description are required' });
    }

    if (from_employee_id === to_employee_id) {
      return res.status(400).json({ message: 'Cannot transfer to the same employee' });
    }

    // Check if employees exist
    const fromEmployee = await Employee.findById(from_employee_id);
    const toEmployee = await Employee.findById(to_employee_id);
    
    if (!fromEmployee || !toEmployee) {
      return res.status(404).json({ message: 'Employee not found' });
    }

    // Get current balance of from employee
    const lastFromTransaction = await PettyCash.findOne({ employee_id: from_employee_id })
      .sort({ createdAt: -1 });

    const fromCurrentBalance = lastFromTransaction ? lastFromTransaction.balance_after : 0;
    
    if (fromCurrentBalance < parseFloat(amount)) {
      return res.status(400).json({ message: 'Insufficient balance for transfer' });
    }

    // Get current balance of to employee
    const lastToTransaction = await PettyCash.findOne({ employee_id: to_employee_id })
      .sort({ createdAt: -1 });

    const toCurrentBalance = lastToTransaction ? lastToTransaction.balance_after : 0;

    // Create transfer out transaction
    const transferOut = new PettyCash({
      employee_id: from_employee_id,
      type: 'transfer_out',
      amount: parseFloat(amount),
      balance_after: fromCurrentBalance - parseFloat(amount),
      description: `Transfer to ${toEmployee.name}: ${description}`,
      reference_type: 'transfer',
      transfer_to_employee: to_employee_id,
      processed_by: req.user.id
    });

    // Create transfer in transaction
    const transferIn = new PettyCash({
      employee_id: to_employee_id,
      type: 'transfer_in',
      amount: parseFloat(amount),
      balance_after: toCurrentBalance + parseFloat(amount),
      description: `Transfer from ${fromEmployee.name}: ${description}`,
      reference_type: 'transfer',
      transfer_from_employee: from_employee_id,
      processed_by: req.user.id
    });

    const savedTransferOut = await transferOut.save();
    const savedTransferIn = await transferIn.save();

    const populatedTransferOut = await PettyCash.findById(savedTransferOut._id)
      .populate('employee_id', 'name job')
      .populate('transfer_to_employee', 'name')
      .populate('processed_by', 'name');

    res.status(201).json({
      transferOut: populatedTransferOut,
      transferIn: savedTransferIn
    });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

module.exports = router; 