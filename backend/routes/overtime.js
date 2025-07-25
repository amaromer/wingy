const express = require('express');
const router = express.Router();
const Overtime = require('../models/Overtime');
const Employee = require('../models/Employee');
const { auth } = require('../middleware/auth');

// Get all overtime records
router.get('/', auth, async (req, res) => {
  try {
    const { page = 1, limit = 10, employee_id, is_approved, is_processed, date } = req.query;
    
    const query = {};
    if (employee_id) query.employee_id = employee_id;
    if (is_approved !== undefined) query.is_approved = is_approved === 'true';
    if (is_processed !== undefined) query.is_processed = is_processed === 'true';
    if (date) {
      const startDate = new Date(date);
      const endDate = new Date(date);
      endDate.setDate(endDate.getDate() + 1);
      query.date = { $gte: startDate, $lt: endDate };
    }

    const overtimes = await Overtime.find(query)
      .populate('employee_id', 'name job')
      .populate('approved_by', 'name')
      .sort({ date: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .exec();

    const count = await Overtime.countDocuments(query);

    res.json({
      overtimes,
      totalPages: Math.ceil(count / limit),
      currentPage: page,
      total: count
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get single overtime record
router.get('/:id', auth, async (req, res) => {
  try {
    const overtime = await Overtime.findById(req.params.id)
      .populate('employee_id', 'name job salary')
      .populate('approved_by', 'name');
    
    if (!overtime) {
      return res.status(404).json({ message: 'Overtime record not found' });
    }
    res.json(overtime);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Create overtime record
router.post('/', auth, async (req, res) => {
  try {
    const { employee_id, date, hours, rate, description } = req.body;

    if (!employee_id || !date || !hours) {
      return res.status(400).json({ message: 'Employee, date, and hours are required' });
    }

    // Check if employee exists
    const employee = await Employee.findById(employee_id);
    if (!employee) {
      return res.status(404).json({ message: 'Employee not found' });
    }

    const overtime = new Overtime({
      employee_id,
      date: new Date(date),
      hours: parseFloat(hours),
      rate: rate || 1.5,
      description
    });

    const savedOvertime = await overtime.save();
    const populatedOvertime = await Overtime.findById(savedOvertime._id)
      .populate('employee_id', 'name job');

    res.status(201).json(populatedOvertime);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Update overtime record
router.put('/:id', auth, async (req, res) => {
  try {
    const { hours, rate, description } = req.body;

    const updateData = {};
    if (hours !== undefined) updateData.hours = parseFloat(hours);
    if (rate !== undefined) updateData.rate = parseFloat(rate);
    if (description !== undefined) updateData.description = description;

    const overtime = await Overtime.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    ).populate('employee_id', 'name job');

    if (!overtime) {
      return res.status(404).json({ message: 'Overtime record not found' });
    }

    res.json(overtime);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Delete overtime record
router.delete('/:id', auth, async (req, res) => {
  try {
    const overtime = await Overtime.findByIdAndDelete(req.params.id);
    if (!overtime) {
      return res.status(404).json({ message: 'Overtime record not found' });
    }
    res.json({ message: 'Overtime record deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Approve overtime
router.patch('/:id/approve', auth, async (req, res) => {
  try {
    const overtime = await Overtime.findByIdAndUpdate(
      req.params.id,
      { 
        is_approved: true, 
        approved_by: req.user.id,
        approved_at: new Date()
      },
      { new: true }
    ).populate('employee_id', 'name job')
     .populate('approved_by', 'name');

    if (!overtime) {
      return res.status(404).json({ message: 'Overtime record not found' });
    }

    res.json(overtime);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Reject overtime
router.patch('/:id/reject', auth, async (req, res) => {
  try {
    const overtime = await Overtime.findByIdAndUpdate(
      req.params.id,
      { 
        is_approved: false, 
        approved_by: null,
        approved_at: null
      },
      { new: true }
    ).populate('employee_id', 'name job');

    if (!overtime) {
      return res.status(404).json({ message: 'Overtime record not found' });
    }

    res.json(overtime);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get overtime summary for an employee
router.get('/employee/:employee_id/summary', auth, async (req, res) => {
  try {
    const { employee_id } = req.params;
    const { month, year } = req.query;

    const query = { employee_id };
    if (month && year) {
      const startDate = new Date(parseInt(year), parseInt(month) - 1, 1);
      const endDate = new Date(parseInt(year), parseInt(month), 0);
      query.date = { $gte: startDate, $lte: endDate };
    }

    const overtimes = await Overtime.find(query)
      .populate('employee_id', 'name job');

    const summary = {
      employee: overtimes[0]?.employee_id || null,
      totalHours: overtimes.reduce((sum, o) => sum + o.hours, 0),
      totalAmount: overtimes.reduce((sum, o) => sum + (o.hours * o.rate), 0),
      approvedCount: overtimes.filter(o => o.is_approved).length,
      pendingCount: overtimes.filter(o => !o.is_approved).length,
      processedCount: overtimes.filter(o => o.is_processed).length,
      overtimes
    };

    res.json(summary);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router; 