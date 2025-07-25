const express = require('express');
const router = express.Router();
const Employee = require('../models/Employee');
const { auth } = require('../middleware/auth');

// Test route to debug employee API
router.get('/test', auth, async (req, res) => {
  try {
    console.log('Employee test route called');
    const allEmployees = await Employee.find({});
    console.log('Test route - All employees:', allEmployees.length);
    res.json({ 
      message: 'Test route working',
      employeeCount: allEmployees.length,
      employees: allEmployees
    });
  } catch (error) {
    console.error('Test route error:', error);
    res.status(500).json({ message: error.message });
  }
});

// Get all employees
router.get('/', auth, async (req, res) => {
  try {
    const { page = 1, limit = 10, search = '', active } = req.query;
    
    console.log('Employee API - Query params:', { page, limit, search, active });
    
    const query = {};
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { job: { $regex: search, $options: 'i' } }
      ];
    }
    
    // Only apply active filter if explicitly provided
    if (active !== undefined && active !== '') {
      query.is_active = active === 'true';
    }

    console.log('Employee API - Final query:', query);

    const employees = await Employee.find(query)
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .exec();

    const count = await Employee.countDocuments(query);

    console.log('Employee API - Found employees:', employees.length);
    console.log('Employee API - Total count:', count);

    res.json({
      employees,
      totalPages: Math.ceil(count / limit),
      currentPage: page,
      total: count
    });
  } catch (error) {
    console.error('Employee API - Error:', error);
    res.status(500).json({ message: error.message });
  }
});

// Get single employee
router.get('/:id', auth, async (req, res) => {
  try {
    const employee = await Employee.findById(req.params.id);
    if (!employee) {
      return res.status(404).json({ message: 'Employee not found' });
    }
    res.json(employee);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Create employee
router.post('/', auth, async (req, res) => {
  try {
    const { name, job, salary, is_active } = req.body;

    if (!name || !job || !salary) {
      return res.status(400).json({ message: 'Name, job, and salary are required' });
    }

    const employee = new Employee({
      name,
      job,
      salary: parseFloat(salary),
      is_active: is_active !== undefined ? is_active : true
    });

    const savedEmployee = await employee.save();
    res.status(201).json(savedEmployee);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Update employee
router.put('/:id', auth, async (req, res) => {
  try {
    const { name, job, salary, is_active } = req.body;

    const updateData = {};
    if (name !== undefined) updateData.name = name;
    if (job !== undefined) updateData.job = job;
    if (salary !== undefined) updateData.salary = parseFloat(salary);
    if (is_active !== undefined) updateData.is_active = is_active;

    const employee = await Employee.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    );

    if (!employee) {
      return res.status(404).json({ message: 'Employee not found' });
    }

    res.json(employee);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Delete employee
router.delete('/:id', auth, async (req, res) => {
  try {
    const employee = await Employee.findByIdAndDelete(req.params.id);
    if (!employee) {
      return res.status(404).json({ message: 'Employee not found' });
    }
    res.json({ message: 'Employee deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get employee statistics
router.get('/:id/stats', auth, async (req, res) => {
  try {
    const employee = await Employee.findById(req.params.id);
    if (!employee) {
      return res.status(404).json({ message: 'Employee not found' });
    }

    // You can add more statistics here as needed
    const stats = {
      employee: employee,
      totalSalary: employee.salary,
      // Add more stats as you implement payroll and petty cash
    };

    res.json(stats);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router; 