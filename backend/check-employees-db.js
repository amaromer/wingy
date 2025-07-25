const mongoose = require('mongoose');
require('dotenv').config();

async function checkEmployeesDB() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    const Employee = require('./models/Employee');

    // Check all employees
    const allEmployees = await Employee.find({});
    console.log('All employees in database:', allEmployees.length);
    
    if (allEmployees.length > 0) {
      console.log('First employee:', allEmployees[0]);
    }

    // Check active employees
    const activeEmployees = await Employee.find({ is_active: true });
    console.log('Active employees in database:', activeEmployees.length);
    
    if (activeEmployees.length > 0) {
      console.log('First active employee:', activeEmployees[0]);
    }

    // Check inactive employees
    const inactiveEmployees = await Employee.find({ is_active: false });
    console.log('Inactive employees in database:', inactiveEmployees.length);

    // Check employees without is_active field
    const employeesWithoutActive = await Employee.find({ is_active: { $exists: false } });
    console.log('Employees without is_active field:', employeesWithoutActive.length);

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.disconnect();
  }
}

checkEmployeesDB(); 