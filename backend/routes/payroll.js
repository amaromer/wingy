const express = require('express');
const router = express.Router();
const Payroll = require('../models/Payroll');
const Employee = require('../models/Employee');
const Overtime = require('../models/Overtime');
const { auth } = require('../middleware/auth');

// Get all payroll records
router.get('/', auth, async (req, res) => {
  try {
    const { page = 1, limit = 10, month, year, employee_id, is_paid } = req.query;
    
    const query = {};
    if (month) query.month = parseInt(month);
    if (year) query.year = parseInt(year);
    if (employee_id) query.employee_id = employee_id;
    if (is_paid !== undefined) query.is_paid = is_paid === 'true';

    const payrolls = await Payroll.find(query)
      .populate('employee_id', 'name job')
      .sort({ year: -1, month: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .exec();
    
    console.log('Payrolls with populated employee_id:', payrolls.map(p => ({
      id: p._id,
      employee_id: p.employee_id,
      employee_name: p.employee_id?.name
    })));

    const count = await Payroll.countDocuments(query);

    res.json({
      payrolls,
      totalPages: Math.ceil(count / limit),
      currentPage: page,
      total: count
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get single payroll record
router.get('/:id', auth, async (req, res) => {
  try {
    const payroll = await Payroll.findById(req.params.id)
      .populate('employee_id', 'name job salary');
    
    if (!payroll) {
      return res.status(404).json({ message: 'Payroll record not found' });
    }
    res.json(payroll);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Create payroll record
router.post('/', auth, async (req, res) => {
  try {
    const { employee_id, month, year, absent_days, overtime_days, deductions, bonuses, notes } = req.body;

    if (!employee_id || !month || !year) {
      return res.status(400).json({ message: 'Employee, month, and year are required' });
    }

    // Check if payroll already exists for this employee and month/year
    const existingPayroll = await Payroll.findOne({ 
      employee_id, 
      month: parseInt(month), 
      year: parseInt(year) 
    });

    if (existingPayroll) {
      return res.status(400).json({ message: 'Payroll record already exists for this employee and month' });
    }

    // Get employee to get base salary
    const employee = await Employee.findById(employee_id);
    if (!employee) {
      return res.status(404).json({ message: 'Employee not found' });
    }

    // Calculate daily rate and net salary
    const dailyRate = employee.salary / 30; // Assuming 30 days per month
    const absentDeduction = dailyRate * (absent_days || 0);
    const overtimeAmount = dailyRate * (overtime_days || 0) * 1.5; // 1.5x for overtime
    const netSalary = employee.salary - absentDeduction + overtimeAmount + (bonuses || 0) - (deductions || 0);

    const payroll = new Payroll({
      employee_id,
      month: parseInt(month),
      year: parseInt(year),
      base_salary: employee.salary,
      absent_days: absent_days || 0,
      overtime_days: overtime_days || 0,
      deductions: deductions || 0,
      bonuses: bonuses || 0,
      net_salary: netSalary,
      notes
    });

    const savedPayroll = await payroll.save();
    const populatedPayroll = await Payroll.findById(savedPayroll._id)
      .populate('employee_id', 'name job');

    res.status(201).json(populatedPayroll);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Update payroll record
router.put('/:id', auth, async (req, res) => {
  try {
    const { absent_days, overtime_days, deductions, bonuses, is_paid, payment_date, notes } = req.body;

    // Get the current payroll to access employee salary
    const currentPayroll = await Payroll.findById(req.params.id).populate('employee_id');
    if (!currentPayroll) {
      return res.status(404).json({ message: 'Payroll record not found' });
    }

    const updateData = {};
    if (absent_days !== undefined) updateData.absent_days = parseInt(absent_days);
    if (overtime_days !== undefined) updateData.overtime_days = parseInt(overtime_days);
    if (deductions !== undefined) updateData.deductions = parseFloat(deductions);
    if (bonuses !== undefined) updateData.bonuses = parseFloat(bonuses);
    if (is_paid !== undefined) updateData.is_paid = is_paid;
    if (payment_date !== undefined) updateData.payment_date = payment_date;
    if (notes !== undefined) updateData.notes = notes;

    // Recalculate net salary if salary-affecting fields are updated
    if (absent_days !== undefined || overtime_days !== undefined || deductions !== undefined || bonuses !== undefined) {
      const dailyRate = currentPayroll.employee_id.salary / 30;
      const absentDeduction = dailyRate * (absent_days !== undefined ? absent_days : currentPayroll.absent_days);
      const overtimeAmount = dailyRate * (overtime_days !== undefined ? overtime_days : currentPayroll.overtime_days) * 1.5;
      const finalDeductions = deductions !== undefined ? deductions : currentPayroll.deductions;
      const finalBonuses = bonuses !== undefined ? bonuses : currentPayroll.bonuses;
      
      updateData.net_salary = currentPayroll.employee_id.salary - absentDeduction + overtimeAmount + finalBonuses - finalDeductions;
    }

    const payroll = await Payroll.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    ).populate('employee_id', 'name job');

    if (!payroll) {
      return res.status(404).json({ message: 'Payroll record not found' });
    }

    res.json(payroll);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Delete payroll record
router.delete('/:id', auth, async (req, res) => {
  try {
    const payroll = await Payroll.findByIdAndDelete(req.params.id);
    if (!payroll) {
      return res.status(404).json({ message: 'Payroll record not found' });
    }
    res.json({ message: 'Payroll record deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Mark payroll as paid
router.patch('/:id/mark-paid', auth, async (req, res) => {
  try {
    const payroll = await Payroll.findByIdAndUpdate(
      req.params.id,
      { 
        is_paid: true, 
        payment_date: new Date() 
      },
      { new: true }
    ).populate('employee_id', 'name job');

    if (!payroll) {
      return res.status(404).json({ message: 'Payroll record not found' });
    }

    res.json(payroll);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get payroll summary for a month
router.get('/summary/:month/:year', auth, async (req, res) => {
  try {
    const { month, year } = req.params;
    
    const payrolls = await Payroll.find({ 
      month: parseInt(month), 
      year: parseInt(year) 
    }).populate('employee_id', 'name job');

    const summary = {
      month: parseInt(month),
      year: parseInt(year),
      totalEmployees: payrolls.length,
      totalSalary: payrolls.reduce((sum, p) => sum + p.net_salary, 0),
      totalAbsentDays: payrolls.reduce((sum, p) => sum + p.absent_days, 0),
      totalOvertimeDays: payrolls.reduce((sum, p) => sum + p.overtime_days, 0),
      paidCount: payrolls.filter(p => p.is_paid).length,
      unpaidCount: payrolls.filter(p => !p.is_paid).length,
      payrolls
    };

    res.json(summary);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router; 