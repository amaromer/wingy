const express = require('express');
const { body, validationResult } = require('express-validator');
const Project = require('../models/Project');
const { auth, requireAdmin } = require('../middleware/auth');

const router = express.Router();

// Validation middleware
const projectValidation = [
  body('name').optional().trim().isLength({ min: 1, max: 200 }).withMessage('Project name must be less than 200 characters'),
  body('description').optional().trim().isLength({ max: 1000 }).withMessage('Description must be less than 1000 characters'),
  body('start_date').optional().custom((value) => {
    if (value && !Date.parse(value)) {
      throw new Error('Start date must be a valid date');
    }
    return true;
  }),
  body('end_date').optional().custom((value) => {
    if (value && !Date.parse(value)) {
      throw new Error('End date must be a valid date');
    }
    return true;
  }),
  body('budget').optional().isFloat({ min: 0 }).withMessage('Budget must be a positive number'),
  body('status').optional().isIn(['Active', 'Completed', 'On Hold']).withMessage('Invalid status'),
  body('priority').optional().isIn(['Low', 'Medium', 'High', 'Critical']).withMessage('Invalid priority'),
  body('location').optional().trim().isLength({ max: 200 }).withMessage('Location must be less than 200 characters'),
  body('client_name').optional().trim().isLength({ max: 200 }).withMessage('Client name must be less than 200 characters'),
  body('project_manager').optional().trim().isLength({ max: 100 }).withMessage('Project manager name must be less than 100 characters'),
  body('phases').optional().isArray().withMessage('Phases must be an array'),
  body('team_members').optional().isArray().withMessage('Team members must be an array')
];

// @route   GET /api/projects
// @desc    Get all projects
// @access  Private
router.get('/', auth, async (req, res) => {
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
router.get('/:id', auth, async (req, res) => {
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
router.post('/', auth, requireAdmin, projectValidation, async (req, res) => {
  try {
    console.log('Received project data:', req.body);
    
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.log('Validation errors:', errors.array());
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
    
    // Validate dates if both are provided
    if (start_date && end_date && new Date(start_date) >= new Date(end_date)) {
      return res.status(400).json({ message: 'End date must be after start date' });
    }
    
    const projectData = {
      name: name || 'Untitled Project',
      description: description || '',
      start_date: start_date ? new Date(start_date) : new Date(),
      budget: budget || 0,
      status: status || 'Active',
      location: location || '',
      client_name: client_name || '',
      manager: project_manager || ''
    };

    // Add optional fields if provided
    if (end_date) projectData.end_date = new Date(end_date);
    if (priority) projectData.priority = priority;
    if (phases) projectData.phases = phases;
    if (team_members) projectData.team_members = team_members;
    
    console.log('Creating project with data:', projectData);
    
    const project = new Project(projectData);
    
    await project.save();
    
    console.log('Project created successfully:', project);
    res.status(201).json(project);
  } catch (error) {
    console.error('Create project error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/projects/:id
// @desc    Update project
// @access  Private (Admin)
router.put('/:id', auth, requireAdmin, projectValidation, async (req, res) => {
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
router.delete('/:id', auth, requireAdmin, async (req, res) => {
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
router.get('/stats/overview', auth, async (req, res) => {
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