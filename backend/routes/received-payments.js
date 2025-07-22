const express = require('express');
const router = express.Router();
const ReceivedPayment = require('../models/ReceivedPayment');
const Project = require('../models/Project');
const { auth } = require('../middleware/auth');
const { upload } = require('../middleware/upload');

// Get all received payments with filters
router.get('/', auth, async (req, res) => {
  try {
    const {
      project_id,
      payment_method,
      date_from,
      date_to,
      amount_min,
      amount_max,
      currency,
      search,
      sort = 'date',
      order = 'desc',
      limit = 10,
      skip = 0
    } = req.query;

    // Build filter object
    const filter = {};

    if (project_id) filter.project_id = project_id;
    if (payment_method) filter.payment_method = payment_method;
    if (currency) filter.currency = currency;

    // Date range filter
    if (date_from || date_to) {
      filter.date = {};
      if (date_from) filter.date.$gte = new Date(date_from);
      if (date_to) filter.date.$lte = new Date(date_to);
    }

    // Amount range filter
    if (amount_min || amount_max) {
      filter.amount = {};
      if (amount_min) filter.amount.$gte = parseFloat(amount_min);
      if (amount_max) filter.amount.$lte = parseFloat(amount_max);
    }

    // Search filter
    if (search) {
      filter.$or = [
        { invoice_number: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { client_name: { $regex: search, $options: 'i' } },
        { reference_number: { $regex: search, $options: 'i' } }
      ];
    }

    // Build sort object
    const sortObj = {};
    sortObj[sort] = order === 'asc' ? 1 : -1;

    // Execute query
    const receivedPayments = await ReceivedPayment.find(filter)
      .populate('project_id', 'name code')
      .sort(sortObj)
      .limit(parseInt(limit))
      .skip(parseInt(skip));

    const total = await ReceivedPayment.countDocuments(filter);
    const pages = Math.ceil(total / parseInt(limit));
    const page = Math.floor(parseInt(skip) / parseInt(limit)) + 1;

    res.json({
      receivedPayments,
      total,
      page,
      pages
    });
  } catch (error) {
    console.error('Error fetching received payments:', error);
    res.status(500).json({ message: 'Error fetching received payments' });
  }
});

// Get received payment by ID
router.get('/:id', auth, async (req, res) => {
  try {
    const receivedPayment = await ReceivedPayment.findById(req.params.id)
      .populate('project_id', 'name code');

    if (!receivedPayment) {
      return res.status(404).json({ message: 'Received payment not found' });
    }

    res.json({ receivedPayment });
  } catch (error) {
    console.error('Error fetching received payment:', error);
    res.status(500).json({ message: 'Error fetching received payment' });
  }
});

// Create new received payment
router.post('/', auth, upload.single('payment_attachment'), async (req, res) => {
  try {
    const paymentData = {
      ...req.body,
      amount: parseFloat(req.body.amount),
      vat_amount: parseFloat(req.body.vat_amount),
      is_vat_applicable: req.body.is_vat_applicable === 'true'
    };

    if (req.file) {
      paymentData.payment_attachment = req.file.path;
    }

    const receivedPayment = new ReceivedPayment(paymentData);
    await receivedPayment.save();

    const populatedPayment = await ReceivedPayment.findById(receivedPayment._id)
      .populate('project_id', 'name code');

    res.status(201).json({ receivedPayment: populatedPayment });
  } catch (error) {
    console.error('Error creating received payment:', error);
    res.status(400).json({ message: error.message });
  }
});

// Update received payment
router.put('/:id', auth, upload.single('payment_attachment'), async (req, res) => {
  try {
    const updateData = { ...req.body };
    
    if (req.body.amount) updateData.amount = parseFloat(req.body.amount);
    if (req.body.vat_amount) updateData.vat_amount = parseFloat(req.body.vat_amount);
    if (req.body.is_vat_applicable !== undefined) {
      updateData.is_vat_applicable = req.body.is_vat_applicable === 'true';
    }

    if (req.file) {
      updateData.payment_attachment = req.file.path;
    }

    const receivedPayment = await ReceivedPayment.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    ).populate('project_id', 'name code');

    if (!receivedPayment) {
      return res.status(404).json({ message: 'Received payment not found' });
    }

    res.json({ receivedPayment });
  } catch (error) {
    console.error('Error updating received payment:', error);
    res.status(400).json({ message: error.message });
  }
});

// Delete received payment
router.delete('/:id', auth, async (req, res) => {
  try {
    const receivedPayment = await ReceivedPayment.findByIdAndDelete(req.params.id);
    
    if (!receivedPayment) {
      return res.status(404).json({ message: 'Received payment not found' });
    }

    res.json({ message: 'Received payment deleted successfully' });
  } catch (error) {
    console.error('Error deleting received payment:', error);
    res.status(500).json({ message: 'Error deleting received payment' });
  }
});

// Bulk delete received payments
router.post('/bulk-delete', auth, async (req, res) => {
  try {
    const { ids } = req.body;
    
    if (!ids || !Array.isArray(ids)) {
      return res.status(400).json({ message: 'Received payment IDs are required' });
    }

    const result = await ReceivedPayment.deleteMany({ _id: { $in: ids } });
    
    res.json({ 
      message: `${result.deletedCount} received payments deleted successfully` 
    });
  } catch (error) {
    console.error('Error bulk deleting received payments:', error);
    res.status(500).json({ message: 'Error deleting received payments' });
  }
});

// Get received payment statistics
router.get('/stats/overview', auth, async (req, res) => {
  try {
    const stats = await ReceivedPayment.aggregate([
      {
        $group: {
          _id: null,
          totalPayments: { $sum: 1 },
          totalAmount: { $sum: '$amount' },
          vatTotal: { $sum: '$vat_amount' }
        }
      }
    ]);

    const paymentMethodStats = await ReceivedPayment.aggregate([
      {
        $group: {
          _id: '$payment_method',
          count: { $sum: 1 },
          total: { $sum: '$amount' }
        }
      }
    ]);

    const result = {
      totalPayments: stats[0]?.totalPayments || 0,
      totalAmount: stats[0]?.totalAmount || 0,
      vatTotal: stats[0]?.vatTotal || 0,
      paymentMethodBreakdown: paymentMethodStats
    };

    res.json(result);
  } catch (error) {
    console.error('Error fetching received payment stats:', error);
    res.status(500).json({ message: 'Error fetching received payment statistics' });
  }
});

module.exports = router; 