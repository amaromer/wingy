const express = require('express');
const { body, validationResult } = require('express-validator');
const Project = require('../models/Project');
const { auth, requireAdmin } = require('../middleware/auth');

const router = express.Router();

// Validation middleware
const projectValidation = [
  // Temporarily simplified validation for debugging
  body('code').optional().trim().isLength({ max: 50 }).withMessage('Project code must be less than 50 characters'),
  body('name').optional().trim(),
  body('description').optional().trim(),
  body('start_date').optional(),
  body('end_date').optional(),
  body('budget').optional(),
  body('status').optional(),
  body('priority').optional(),
  body('location').optional().trim(),
  body('client_name').optional().trim(),
  body('project_manager').optional().trim(),
  body('phases').optional(),
  body('team_members').optional()
];

// @route   GET /api/projects
// @desc    Get all projects
// @access  Private
router.get('/', /* auth, */ async (req, res) => {
  try {
    const { status, search, sort = 'createdAt', order = 'desc' } = req.query;
    
    let query = {};
    
    // Filter by status
    if (status) {
      query.status = status;
    }
    
    // Search by name, description, location, or client name
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { location: { $regex: search, $options: 'i' } },
        { client_name: { $regex: search, $options: 'i' } }
      ];
    }
    
    // Sorting
    const sortOrder = order === 'desc' ? -1 : 1;
    const sortOptions = {};
    sortOptions[sort] = sortOrder;
    
    const projects = await Project.find(query)
      .sort(sortOptions)
      .limit(parseInt(req.query.limit) || 50)
      .skip(parseInt(req.query.skip) || 0);
    
    const total = await Project.countDocuments(query);
    
    res.json({
      projects,
      total,
      page: Math.floor(parseInt(req.query.skip) / parseInt(req.query.limit)) + 1 || 1,
      pages: Math.ceil(total / (parseInt(req.query.limit) || 50))
    });
  } catch (error) {
    console.error('Get projects error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/projects/:id
// @desc    Get project by ID
// @access  Private
router.get('/:id', /* auth, */ async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }
    
    res.json(project);
  } catch (error) {
    console.error('Get project error:', error);
    if (error.kind === 'ObjectId') {
      return res.status(404).json({ message: 'Project not found' });
    }
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/projects
// @desc    Create a new project
// @access  Private (Admin)
router.post('/', /* auth, requireAdmin, */ projectValidation, async (req, res) => {
  try {
    console.log('Received project data:', req.body);
    
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.log('Validation errors:', errors.array());
      return res.status(400).json({ errors: errors.array() });
    }

    // Generate unique project code
    const generateCode = async () => {
      const timestamp = Date.now().toString().slice(-6);
      const random = Math.random().toString(36).substring(2, 5).toUpperCase();
      const code = `PRJ-${timestamp}-${random}`;
      
      // Check if code already exists
      const existingProject = await Project.findOne({ code });
      if (existingProject) {
        return generateCode(); // Recursively generate new code
      }
      return code;
    };

    const projectCode = await generateCode();

    // Simplified project creation for debugging
    const projectData = {
      code: projectCode,
      name: req.body.name || 'Untitled Project',
      description: req.body.description || '',
      start_date: new Date(),
      budget: 0,
      status: 'Active',
      location: '',
      client_name: '',
      manager: ''
    };
    
    console.log('Creating project with data:', projectData);
    
    const project = new Project(projectData);
    
    await project.save();
    
    console.log('Project created successfully:', project);
    res.status(201).json(project);
  } catch (error) {
    console.error('Create project error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   PUT /api/projects/:id
// @desc    Update project
// @access  Private (Admin)
router.put('/:id', /* auth, requireAdmin, */ projectValidation, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { 
      name, 
      description, 
      start_date, 
      end_date, 
      budget, 
      status, 
      priority, 
      location, 
      client_name, 
      project_manager, 
      phases, 
      team_members 
    } = req.body;
    
    const project = await Project.findById(req.params.id);
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }
    
    // Validate dates if both are provided
    if (start_date && end_date && new Date(start_date) >= new Date(end_date)) {
      return res.status(400).json({ message: 'End date must be after start date' });
    }
    
    // Update fields if provided
    if (name !== undefined) project.name = name;
    if (description !== undefined) project.description = description;
    if (start_date !== undefined) project.start_date = new Date(start_date);
    if (end_date !== undefined) project.end_date = end_date ? new Date(end_date) : null;
    if (budget !== undefined) project.budget = budget;
    if (status !== undefined) project.status = status;
    if (priority !== undefined) project.priority = priority;
    if (location !== undefined) project.location = location;
    if (client_name !== undefined) project.client_name = client_name;
    if (project_manager !== undefined) project.manager = project_manager;
    if (phases !== undefined) project.phases = phases;
    if (team_members !== undefined) project.team_members = team_members;
    
    await project.save();
    
    res.json(project);
  } catch (error) {
    console.error('Update project error:', error);
    if (error.kind === 'ObjectId') {
      return res.status(404).json({ message: 'Project not found' });
    }
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   DELETE /api/projects/:id
// @desc    Delete project
// @access  Private (Admin)
router.delete('/:id', /* auth, requireAdmin, */ async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }
    
    // Check if project has associated expenses
    const Expense = require('../models/Expense');
    const expenseCount = await Expense.countDocuments({ project_id: req.params.id });
    
    if (expenseCount > 0) {
      return res.status(400).json({ 
        message: `Cannot delete project. It has ${expenseCount} associated expenses.` 
      });
    }
    
    await Project.findByIdAndDelete(req.params.id);
    
    res.json({ message: 'Project deleted successfully' });
  } catch (error) {
    console.error('Delete project error:', error);
    if (error.kind === 'ObjectId') {
      return res.status(404).json({ message: 'Project not found' });
    }
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/projects/stats/overview
// @desc    Get project statistics
// @access  Private
router.get('/stats/overview', /* auth, */ async (req, res) => {
  try {
    const stats = await Project.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);
    
    const totalProjects = await Project.countDocuments();
    const activeProjects = await Project.countDocuments({ 
      status: { $in: ['Planning', 'In Progress'] } 
    });
    
    res.json({
      statusBreakdown: stats,
      totalProjects,
      activeProjects
    });
  } catch (error) {
    console.error('Get project stats error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router; 