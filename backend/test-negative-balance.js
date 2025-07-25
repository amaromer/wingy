const axios = require('axios');
require('dotenv').config();

async function testNegativeBalance() {
  try {
    console.log('Testing negative balance functionality...');
    
    // First, get a token by logging in
    const loginResponse = await axios.post('http://localhost:3000/api/auth/login', {
      email: 'admin@construction.com',
      password: 'admin123'
    });

    const token = loginResponse.data.token;
    console.log('Got token:', token ? 'Yes' : 'No');

    // Get employees
    const employeesResponse = await axios.get('http://localhost:3000/api/employees', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    console.log('Employees available:', employeesResponse.data.employees?.length || 0);
    const employee = employeesResponse.data.employees?.[0];
    
    if (!employee) {
      console.log('No employees found for testing');
      return;
    }

    console.log('Using employee:', employee.name);

    // Get projects
    const projectsResponse = await axios.get('http://localhost:3000/api/projects', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    const project = projectsResponse.data.projects?.[0];
    if (!project) {
      console.log('No project available for testing');
      return;
    }

    console.log('Using project:', project.name);

    // Check current petty cash balance
    console.log('\nChecking current petty cash balance...');
    const balancesResponse = await axios.get('http://localhost:3000/api/petty-cash/balances', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    const employeeBalance = balancesResponse.data.find(b => b.employee._id === employee._id);
    console.log('Current balance for', employee.name, ':', employeeBalance?.currentBalance || 0);

    // Create expense that will result in negative balance
    const expenseAmount = 1500; // Amount that will exceed current balance
    console.log(`\nCreating expense of ${expenseAmount} AED for ${employee.name}...`);

    const expenseData = {
      project_id: project._id,
      employee_id: employee._id,
      amount: expenseAmount,
      currency: 'AED',
      date: new Date().toISOString().split('T')[0],
      description: 'Test expense to create negative balance',
      invoice_number: 'NEG-TEST-001',
      is_vat: false
    };

    try {
      const expenseResponse = await axios.post('http://localhost:3000/api/expenses', expenseData, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      console.log('✅ Expense created successfully:', expenseResponse.data._id);
    } catch (expenseError) {
      console.error('❌ Expense creation failed:');
      console.error('Status:', expenseError.response?.status);
      console.error('Data:', expenseError.response?.data);
      return;
    }

    // Check petty cash balance after deduction
    console.log('\nChecking petty cash balance after deduction...');
    const newBalancesResponse = await axios.get('http://localhost:3000/api/petty-cash/balances', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    const newEmployeeBalance = newBalancesResponse.data.find(b => b.employee._id === employee._id);
    console.log('New balance for', employee.name, ':', newEmployeeBalance?.currentBalance || 0);
    
    if (newEmployeeBalance?.currentBalance < 0) {
      console.log('✅ SUCCESS: Employee now has negative balance!');
    } else {
      console.log('❌ FAILED: Employee does not have negative balance');
    }

    // Check petty cash transactions
    console.log('\nChecking petty cash transactions...');
    const transactionsResponse = await axios.get('http://localhost:3000/api/petty-cash', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    const recentTransaction = transactionsResponse.data.transactions?.[0];
    if (recentTransaction) {
      console.log('Recent petty cash transaction:', {
        type: recentTransaction.type,
        amount: recentTransaction.amount,
        balance_after: recentTransaction.balance_after,
        description: recentTransaction.description
      });
    }

    console.log('\n✅ Negative balance test completed!');

  } catch (error) {
    console.error('Test failed:');
    console.error('Status:', error.response?.status);
    console.error('Status Text:', error.response?.statusText);
    console.error('Data:', error.response?.data);
    console.error('Message:', error.message);
  }
}

testNegativeBalance(); 