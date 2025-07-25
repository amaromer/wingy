const axios = require('axios');
require('dotenv').config();

async function testTotalExpenses() {
  try {
    console.log('Testing total expenses feature...');
    
    // First, get a token by logging in
    const loginResponse = await axios.post('http://localhost:3000/api/auth/login', {
      email: 'admin@construction.com',
      password: 'admin123'
    });

    const token = loginResponse.data.token;
    console.log('Got token:', token ? 'Yes' : 'No');

    // Test the petty cash balances endpoint
    console.log('\nTesting petty cash balances with total expenses...');
    const balancesResponse = await axios.get('http://localhost:3000/api/petty-cash/balances', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    console.log('Balances response status:', balancesResponse.status);
    console.log('Number of employees with balances:', balancesResponse.data.length);

    // Display total expenses for each employee
    balancesResponse.data.forEach(balance => {
      console.log(`\nEmployee: ${balance.employee.name}`);
      console.log(`Current Balance: ${balance.currentBalance} AED`);
      console.log(`Total Expenses: ${balance.totalExpenses} AED`);
      console.log(`Recent Transactions: ${balance.recentTransactions.length}`);
    });

    // Test creating an expense to see if total expenses updates
    console.log('\nTesting expense creation to verify total expenses update...');
    
    // Get employees and projects for testing
    const employeesResponse = await axios.get('http://localhost:3000/api/employees', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    const projectsResponse = await axios.get('http://localhost:3000/api/projects', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    const employee = employeesResponse.data.employees[0];
    const project = projectsResponse.data.projects[0];

    if (employee && project) {
      console.log(`Creating test expense for ${employee.name}...`);
      
      const expenseData = {
        project_id: project._id,
        employee_id: employee._id,
        amount: 500,
        currency: 'AED',
        date: new Date().toISOString().split('T')[0],
        description: 'Test expense for total expenses feature',
        invoice_number: 'TEST-EXP-001',
        is_vat: false
      };

      try {
        const expenseResponse = await axios.post('http://localhost:3000/api/expenses', expenseData, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        console.log('✅ Test expense created successfully:', expenseResponse.data._id);

        // Check updated balances
        console.log('\nChecking updated balances...');
        const updatedBalancesResponse = await axios.get('http://localhost:3000/api/petty-cash/balances', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        const updatedBalance = updatedBalancesResponse.data.find(b => b.employee._id === employee._id);
        if (updatedBalance) {
          console.log(`Updated total expenses for ${employee.name}: ${updatedBalance.totalExpenses} AED`);
        }

      } catch (expenseError) {
        console.error('❌ Test expense creation failed:', expenseError.response?.data);
      }
    }

    console.log('\n✅ Total expenses feature test completed!');

  } catch (error) {
    console.error('Test failed:');
    console.error('Status:', error.response?.status);
    console.error('Status Text:', error.response?.statusText);
    console.error('Data:', error.response?.data);
    console.error('Message:', error.message);
  }
}

testTotalExpenses(); 