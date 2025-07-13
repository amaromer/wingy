const express = require('express');
const router = express.Router();
const Payment = require('../models/Payment');
const Project = require('../models/Project');
const Supplier = require('../models/Supplier');
const { auth } = require('../middleware/auth');
const { upload } = require('../middleware/upload');

// Get all payments with filters
router.get('/', auth, async (req, res) => {
  try {
    const {
      project_id,
      supplier_id,
      payment_type,
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
    if (supplier_id) filter.supplier_id = supplier_id;
    if (payment_type) filter.payment_type = payment_type;
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
        { description: { $regex: search, $options: 'i' } }
      ];
    }

    // Build sort object
    const sortObj = {};
    sortObj[sort] = order === 'asc' ? 1 : -1;

    // Execute query
    const payments = await Payment.find(filter)
      .populate('project_id', 'name code')
      .populate('supplier_id', 'name')
      .sort(sortObj)
      .limit(parseInt(limit))
      .skip(parseInt(skip));

    const total = await Payment.countDocuments(filter);
    const pages = Math.ceil(total / parseInt(limit));
    const page = Math.floor(parseInt(skip) / parseInt(limit)) + 1;

    res.json({
      payments,
      total,
      page,
      pages
    });
  } catch (error) {
    console.error('Error fetching payments:', error);
    res.status(500).json({ message: 'Error fetching payments' });
  }
});

// Get payment by ID
router.get('/:id', auth, async (req, res) => {
  try {
    const payment = await Payment.findById(req.params.id)
      .populate('project_id', 'name code')
      .populate('supplier_id', 'name');

    if (!payment) {
      return res.status(404).json({ message: 'Payment not found' });
    }

    res.json({ payment });
  } catch (error) {
    console.error('Error fetching payment:', error);
    res.status(500).json({ message: 'Error fetching payment' });
  }
});

// Create new payment
router.post('/', auth, upload.single('receipt_attachment'), async (req, res) => {
  try {
    const paymentData = {
      ...req.body,
      amount: parseFloat(req.body.amount),
      vat_amount: parseFloat(req.body.vat_amount),
      is_vat_included: req.body.is_vat_included === 'true'
    };

    if (req.file) {
      paymentData.receipt_attachment = req.file.path;
    }

    const payment = new Payment(paymentData);
    await payment.save();

    const populatedPayment = await Payment.findById(payment._id)
      .populate('project_id', 'name code')
      .populate('supplier_id', 'name');

    res.status(201).json({ payment: populatedPayment });
  } catch (error) {
    console.error('Error creating payment:', error);
    res.status(400).json({ message: error.message });
  }
});

// Update payment
router.put('/:id', auth, upload.single('receipt_attachment'), async (req, res) => {
  try {
    const updateData = { ...req.body };
    
    if (req.body.amount) updateData.amount = parseFloat(req.body.amount);
    if (req.body.vat_amount) updateData.vat_amount = parseFloat(req.body.vat_amount);
    if (req.body.is_vat_included !== undefined) {
      updateData.is_vat_included = req.body.is_vat_included === 'true';
    }

    if (req.file) {
      updateData.receipt_attachment = req.file.path;
    }

    const payment = await Payment.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    ).populate('project_id', 'name code')
     .populate('supplier_id', 'name');

    if (!payment) {
      return res.status(404).json({ message: 'Payment not found' });
    }

    res.json({ payment });
  } catch (error) {
    console.error('Error updating payment:', error);
    res.status(400).json({ message: error.message });
  }
});

// Delete payment
router.delete('/:id', auth, async (req, res) => {
  try {
    const payment = await Payment.findByIdAndDelete(req.params.id);
    
    if (!payment) {
      return res.status(404).json({ message: 'Payment not found' });
    }

    res.json({ message: 'Payment deleted successfully' });
  } catch (error) {
    console.error('Error deleting payment:', error);
    res.status(500).json({ message: 'Error deleting payment' });
  }
});

// Bulk delete payments
router.post('/bulk-delete', auth, async (req, res) => {
  try {
    const { ids } = req.body;
    
    if (!ids || !Array.isArray(ids)) {
      return res.status(400).json({ message: 'Payment IDs are required' });
    }

    const result = await Payment.deleteMany({ _id: { $in: ids } });
    
    res.json({ 
      message: `${result.deletedCount} payments deleted successfully` 
    });
  } catch (error) {
    console.error('Error bulk deleting payments:', error);
    res.status(500).json({ message: 'Error deleting payments' });
  }
});

// Get payment statistics
router.get('/stats/overview', auth, async (req, res) => {
  try {
    const stats = await Payment.aggregate([
      {
        $group: {
          _id: null,
          totalPayments: { $sum: 1 },
          totalAmount: { $sum: '$amount' },
          vatTotal: { $sum: '$vat_amount' }
        }
      }
    ]);

    const paymentTypeStats = await Payment.aggregate([
      {
        $group: {
          _id: '$payment_type',
          count: { $sum: 1 },
          total: { $sum: '$amount' }
        }
      }
    ]);

    const result = {
      totalPayments: stats[0]?.totalPayments || 0,
      totalAmount: stats[0]?.totalAmount || 0,
      vatTotal: stats[0]?.vatTotal || 0,
      paymentTypeBreakdown: paymentTypeStats
    };

    res.json(result);
  } catch (error) {
    console.error('Error fetching payment stats:', error);
    res.status(500).json({ message: 'Error fetching payment statistics' });
  }
});

module.exports = router; 