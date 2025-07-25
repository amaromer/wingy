const mongoose = require('mongoose');
const axios = require('axios');
require('dotenv').config();

async function testQuickExpenseWithEmployee() {
  try {
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
    let employee = employeesResponse.data.employees?.[0];
    
    if (!employee || employeesResponse.data.employees.length === 0) {
      console.log('No employees found. Creating a test employee...');
      
      // Create a test employee
      const createEmployeeResponse = await axios.post('http://localhost:3000/api/employees', {
        name: 'Quick Test Employee',
        job: 'Worker',
        salary: 5000,
        is_active: true
      }, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      console.log('Created test employee:', createEmployeeResponse.data);
      employee = createEmployeeResponse.data;
    }
    
    console.log('Using employee:', employee.name);

    // Get projects
    const projectsResponse = await axios.get('http://localhost:3000/api/projects', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    console.log('Projects available:', projectsResponse.data.projects?.length || 0);
    const project = projectsResponse.data.projects?.[0];
    if (!project) {
      console.log('No project available for testing');
      return;
    }
    
    console.log('Using project:', project.name);

    // Get suppliers
    const suppliersResponse = await axios.get('http://localhost:3000/api/suppliers', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    console.log('Suppliers available:', suppliersResponse.data.suppliers?.length || 0);
    const supplier = suppliersResponse.data.suppliers?.[0];

    // Get categories
    const categoriesResponse = await axios.get('http://localhost:3000/api/categories', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    console.log('Categories available:', categoriesResponse.data.categories?.length || 0);
    const category = categoriesResponse.data.categories?.[0];

    // Create quick expense with employee (simulating quick expense form)
    const expenseData = {
      project_id: project._id,
      supplier_id: supplier?._id || '',
      employee_id: employee._id,
      category_id: category?._id || '',
      amount: 15,
      currency: 'AED',
      date: new Date().toISOString().split('T')[0],
      description: 'Quick expense test with employee deduction',
      invoice_number: 'QUICK-001',
      is_vat: false
    };

    console.log('Creating quick expense with employee:', expenseData);

    try {
      const expenseResponse = await axios.post('http://localhost:3000/api/expenses', expenseData, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      console.log('Quick expense created successfully:', expenseResponse.data._id);
    } catch (expenseError) {
      console.error('Quick expense creation failed:');
      console.error('Status:', expenseError.response?.status);
      console.error('Data:', expenseError.response?.data);
      console.error('Message:', expenseError.message);
      return;
    }

    // Check petty cash balance after deduction
    const balancesResponse = await axios.get('http://localhost:3000/api/petty-cash/balances', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    const employeeBalance = balancesResponse.data.find(b => b.employee._id === employee._id);
    console.log('Employee balance after quick expense deduction:', employeeBalance?.currentBalance);

    // Check petty cash transactions
    const transactionsResponse = await axios.get('http://localhost:3000/api/petty-cash', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    const recentTransaction = transactionsResponse.data.transactions?.[0];
    if (recentTransaction) {
      console.log('Recent petty cash transaction from quick expense:', {
        type: recentTransaction.type,
        amount: recentTransaction.amount,
        description: recentTransaction.description,
        reference_type: recentTransaction.reference_type
      });
    }

    console.log('✅ Quick expense with employee deduction test completed successfully!');

  } catch (error) {
    console.error('Test failed:');
    console.error('Status:', error.response?.status);
    console.error('Status Text:', error.response?.statusText);
    console.error('Data:', error.response?.data);
    console.error('Message:', error.message);
  }
}

testQuickExpenseWithEmployee(); 