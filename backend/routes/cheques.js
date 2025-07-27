const express = require('express');
const router = express.Router();
const Cheque = require('../models/Cheque');
const { numberToWords } = require('../utils/numberToWords');
const { auth } = require('../middleware/auth');

// Get all cheques with pagination and filtering
router.get('/', auth, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    // Build filter object
    const filter = {};
    
    if (req.query.payee_name) {
      filter.payee_name = { $regex: req.query.payee_name, $options: 'i' };
    }
    
    if (req.query.status) {
      filter.status = req.query.status;
    }
    
    if (req.query.currency) {
      filter.currency = req.query.currency;
    }
    
    if (req.query.date_from) {
      filter.cheque_date = { $gte: new Date(req.query.date_from) };
    }
    
    if (req.query.date_to) {
      if (filter.cheque_date) {
        filter.cheque_date.$lte = new Date(req.query.date_to);
      } else {
        filter.cheque_date = { $lte: new Date(req.query.date_to) };
      }
    }

    // Build sort object
    const sort = {};
    if (req.query.sort_by) {
      sort[req.query.sort_by] = req.query.sort_order === 'desc' ? -1 : 1;
    } else {
      sort.createdAt = -1; // Default sort by creation date descending
    }

    const cheques = await Cheque.find(filter)
      .populate('project_id', 'name')
      .populate('supplier_id', 'name')
      .populate('created_by', 'name')
      .populate('approved_by', 'name')
      .sort(sort)
      .skip(skip)
      .limit(limit);

    const total = await Cheque.countDocuments(filter);

    res.json({
      cheques,
      pagination: {
        current_page: page,
        total_pages: Math.ceil(total / limit),
        total_items: total,
        items_per_page: limit
      }
    });
  } catch (error) {
    console.error('Error fetching cheques:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Get cheque statistics
router.get('/stats/overview', auth, async (req, res) => {
  try {
    const totalCheques = await Cheque.countDocuments();
    const draftCheques = await Cheque.countDocuments({ status: 'Draft' });
    const issuedCheques = await Cheque.countDocuments({ status: 'Issued' });
    const clearedCheques = await Cheque.countDocuments({ status: 'Cleared' });
    const voidCheques = await Cheque.countDocuments({ status: 'Void' });

    // Calculate total amount by status
    const totalAmount = await Cheque.aggregate([
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);

    const issuedAmount = await Cheque.aggregate([
      { $match: { status: 'Issued' } },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);

    const clearedAmount = await Cheque.aggregate([
      { $match: { status: 'Cleared' } },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);

    res.json({
      overview: {
        totalCheques,
        draftCheques,
        issuedCheques,
        clearedCheques,
        voidCheques,
        totalAmount: totalAmount[0]?.total || 0,
        issuedAmount: issuedAmount[0]?.total || 0,
        clearedAmount: clearedAmount[0]?.total || 0
      }
    });
  } catch (error) {
    console.error('Error fetching cheque statistics:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Generate next cheque number
router.get('/next-number', auth, async (req, res) => {
  try {
    const lastCheque = await Cheque.findOne().sort({ cheque_number: -1 });
    
    let nextNumber = '001';
    if (lastCheque) {
      const lastNumber = parseInt(lastCheque.cheque_number);
      nextNumber = (lastNumber + 1).toString().padStart(3, '0');
    }

    res.json({ next_number: nextNumber });
  } catch (error) {
    console.error('Error generating next cheque number:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Get a single cheque by ID
router.get('/:id', auth, async (req, res) => {
  try {
    const cheque = await Cheque.findById(req.params.id)
      .populate('project_id', 'name')
      .populate('supplier_id', 'name')
      .populate('created_by', 'name')
      .populate('approved_by', 'name');

    if (!cheque) {
      return res.status(404).json({ message: 'Cheque not found' });
    }

    res.json(cheque);
  } catch (error) {
    console.error('Error fetching cheque:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Create a new cheque
router.post('/', auth, async (req, res) => {
  try {
    const {
      cheque_number,
      payee_name,
      amount,
      currency,
      cheque_date,
      description,
      project_id,
      supplier_id,
      language = 'en'
    } = req.body;

    // Generate amount in words
    const amount_in_words = numberToWords(amount, language, currency);

    const cheque = new Cheque({
      cheque_number,
      payee_name,
      amount,
      amount_in_words,
      currency,
      cheque_date: cheque_date || new Date(),
      description,
      project_id,
      supplier_id,
      created_by: req.user.id
    });

    await cheque.save();

    // Populate references
    await cheque.populate('project_id', 'name');
    await cheque.populate('supplier_id', 'name');
    await cheque.populate('created_by', 'name');

    res.status(201).json(cheque);
  } catch (error) {
    console.error('Error creating cheque:', error);
    if (error.code === 11000) {
      return res.status(400).json({ message: 'Cheque number already exists' });
    }
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Update a cheque
router.put('/:id', auth, async (req, res) => {
  try {
    const {
      cheque_number,
      payee_name,
      amount,
      currency,
      cheque_date,
      description,
      project_id,
      supplier_id,
      status,
      language = 'en'
    } = req.body;

    const updateData = {
      cheque_number,
      payee_name,
      amount,
      currency,
      cheque_date,
      description,
      project_id,
      supplier_id,
      status
    };

    // Generate amount in words if amount is provided
    if (amount) {
      updateData.amount_in_words = numberToWords(amount, language, currency);
    }

    const cheque = await Cheque.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    )
    .populate('project_id', 'name')
    .populate('supplier_id', 'name')
    .populate('created_by', 'name')
    .populate('approved_by', 'name');

    if (!cheque) {
      return res.status(404).json({ message: 'Cheque not found' });
    }

    res.json(cheque);
  } catch (error) {
    console.error('Error updating cheque:', error);
    if (error.code === 11000) {
      return res.status(400).json({ message: 'Cheque number already exists' });
    }
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Delete a cheque
router.delete('/:id', auth, async (req, res) => {
  try {
    const cheque = await Cheque.findByIdAndDelete(req.params.id);
    
    if (!cheque) {
      return res.status(404).json({ message: 'Cheque not found' });
    }

    res.json({ message: 'Cheque deleted successfully' });
  } catch (error) {
    console.error('Error deleting cheque:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Approve a cheque
router.patch('/:id/approve', auth, async (req, res) => {
  try {
    const cheque = await Cheque.findByIdAndUpdate(
      req.params.id,
      {
        status: 'Issued',
        approved_by: req.user.id,
        approved_at: new Date()
      },
      { new: true, runValidators: true }
    )
    .populate('project_id', 'name')
    .populate('supplier_id', 'name')
    .populate('created_by', 'name')
    .populate('approved_by', 'name');

    if (!cheque) {
      return res.status(404).json({ message: 'Cheque not found' });
    }

    res.json(cheque);
  } catch (error) {
    console.error('Error approving cheque:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Void a cheque
router.patch('/:id/void', auth, async (req, res) => {
  try {
    const { void_reason } = req.body;

    const cheque = await Cheque.findByIdAndUpdate(
      req.params.id,
      {
        status: 'Void',
        is_void: true,
        void_reason
      },
      { new: true, runValidators: true }
    )
    .populate('project_id', 'name')
    .populate('supplier_id', 'name')
    .populate('created_by', 'name')
    .populate('approved_by', 'name');

    if (!cheque) {
      return res.status(404).json({ message: 'Cheque not found' });
    }

    res.json(cheque);
  } catch (error) {
    console.error('Error voiding cheque:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

module.exports = router; 