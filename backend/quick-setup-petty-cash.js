const mongoose = require('mongoose');
require('dotenv').config();

async function quickSetupPettyCash() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    const Employee = require('./models/Employee');
    const PettyCash = require('./models/PettyCash');

    // Get all employees
    const employees = await Employee.find({});
    console.log('Found employees:', employees.length);

    // Add petty cash credit to each employee
    for (const employee of employees) {
      console.log(`Adding petty cash credit to ${employee.name}...`);
      
      try {
        const pettyCashTransaction = new PettyCash({
          employee_id: employee._id,
          type: 'credit',
          amount: 1000, // Add 1000 AED to each employee
          balance_after: 1000, // Initial balance
          description: 'Initial petty cash credit',
          reference_type: 'initial',
          reference_id: null,
          processed_by: null // System generated
        });

        await pettyCashTransaction.save();
        console.log(`✅ Added petty cash credit to ${employee.name}: 1000 AED`);
      } catch (error) {
        console.error(`❌ Failed to add petty cash credit to ${employee.name}:`, error.message);
      }
    }

    // Check petty cash balances
    console.log('\nChecking petty cash balances...');
    const balances = await PettyCash.aggregate([
      {
        $lookup: {
          from: 'employees',
          localField: 'employee_id',
          foreignField: '_id',
          as: 'employee'
        }
      },
      {
        $unwind: '$employee'
      },
      {
        $sort: { 'employee_id': 1, 'createdAt': -1 }
      },
      {
        $group: {
          _id: '$employee_id',
          employee: { $first: '$employee' },
          currentBalance: { $first: '$balance_after' }
        }
      }
    ]);

    console.log('Petty cash balances:');
    balances.forEach(balance => {
      console.log(`- ${balance.employee.name}: ${balance.currentBalance} AED`);
    });

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.disconnect();
  }
}

quickSetupPettyCash(); 