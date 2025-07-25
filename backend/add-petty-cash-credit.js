const mongoose = require('mongoose');
const axios = require('axios');
require('dotenv').config();

async function addPettyCashCredit() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // First, get a token by logging in
    const loginResponse = await axios.post('http://localhost:3000/api/auth/login', {
      email: 'admin@construction.com',
      password: 'admin123'
    });

    const token = loginResponse.data.token;
    console.log('Got token:', token ? 'Yes' : 'No');

    // Get all employees
    const employeesResponse = await axios.get('http://localhost:3000/api/employees', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    const employees = employeesResponse.data.employees;
    console.log('Found employees:', employees.length);

    // Add petty cash credit to each employee
    for (const employee of employees) {
      console.log(`Adding petty cash credit to ${employee.name}...`);
      
      try {
        const pettyCashResponse = await axios.post('http://localhost:3000/api/petty-cash', {
          employee_id: employee._id,
          type: 'credit',
          amount: 1000, // Add 1000 AED to each employee
          description: 'Initial petty cash credit',
          reference_type: 'initial',
          reference_id: null
        }, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        console.log(`✅ Added petty cash credit to ${employee.name}:`, pettyCashResponse.data.amount);
      } catch (error) {
        console.error(`❌ Failed to add petty cash credit to ${employee.name}:`, error.response?.data || error.message);
      }
    }

    // Check petty cash balances after adding credit
    console.log('\nChecking petty cash balances...');
    const balancesResponse = await axios.get('http://localhost:3000/api/petty-cash/balances', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    console.log('Petty cash balances:');
    balancesResponse.data.forEach(balance => {
      console.log(`- ${balance.employee.name}: ${balance.currentBalance} AED`);
    });

  } catch (error) {
    console.error('Error:', error.response?.data || error.message);
  } finally {
    await mongoose.disconnect();
  }
}

addPettyCashCredit(); 