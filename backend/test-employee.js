const mongoose = require('mongoose');
require('dotenv').config();

const Employee = require('./models/Employee');
const PettyCash = require('./models/PettyCash');

async function testEmployee() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Check if employees exist
    const employees = await Employee.find({});
    console.log('Current employees:', employees.length);

    if (employees.length === 0) {
      // Create a test employee
      const testEmployee = new Employee({
        name: 'Test Employee',
        job: 'Worker',
        salary: 5000,
        is_active: true
      });
      
      await testEmployee.save();
      console.log('Created test employee:', testEmployee.name);
    }

    // Test the balances logic
    const activeEmployees = await Employee.find({ is_active: true });
    console.log('Active employees:', activeEmployees.length);

    for (const employee of activeEmployees) {
      console.log('Employee:', employee.name, '- Job:', employee.job);
      
      const lastTransaction = await PettyCash.findOne({ employee_id: employee._id })
        .sort({ createdAt: -1 });

      const currentBalance = lastTransaction ? lastTransaction.balance_after : 0;
      console.log('Balance:', currentBalance);
    }

    console.log('Test completed successfully');
  } catch (error) {
    console.error('Test failed:', error);
  } finally {
    await mongoose.disconnect();
  }
}

testEmployee(); 