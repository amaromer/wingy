const axios = require('axios');
const mongoose = require('mongoose');
require('dotenv').config();

async function testEmployeeAPI() {
  try {
    console.log('Testing Employee API...');
    
    // First, get a token by logging in
    const loginResponse = await axios.post('http://localhost:3000/api/auth/login', {
      email: 'admin@construction.com',
      password: 'admin123'
    });

    const token = loginResponse.data.token;
    console.log('Got token:', token ? 'Yes' : 'No');

    // Test direct database query
    console.log('\nTesting direct database query...');
    await mongoose.connect(process.env.MONGODB_URI);
    const Employee = require('./models/Employee');
    
    const allEmployees = await Employee.find({});
    console.log('Direct DB query - All employees:', allEmployees.length);
    
    const activeEmployees = await Employee.find({ is_active: true });
    console.log('Direct DB query - Active employees:', activeEmployees.length);
    
    await mongoose.disconnect();

    // Test the employees API
    console.log('\nCalling employees API...');
    const employeesResponse = await axios.get('http://localhost:3000/api/employees', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    console.log('Employees API response status:', employeesResponse.status);
    console.log('Employees API response data:', employeesResponse.data);
    console.log('Number of employees:', employeesResponse.data.employees?.length || 0);
    
    if (employeesResponse.data.employees && employeesResponse.data.employees.length > 0) {
      console.log('First employee:', employeesResponse.data.employees[0]);
    }

    // Test with active=false to see all employees
    console.log('\nTesting employees API with active=false...');
    const allEmployeesResponse = await axios.get('http://localhost:3000/api/employees?active=false', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    console.log('All employees API response status:', allEmployeesResponse.status);
    console.log('All employees API response data:', allEmployeesResponse.data);
    console.log('Number of all employees:', allEmployeesResponse.data.employees?.length || 0);

    // Test without active filter
    console.log('\nTesting employees API without active filter...');
    const noFilterResponse = await axios.get('http://localhost:3000/api/employees?active=', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    console.log('No filter API response status:', noFilterResponse.status);
    console.log('No filter API response data:', noFilterResponse.data);
    console.log('Number of employees without filter:', noFilterResponse.data.employees?.length || 0);

    // Test the API URL that the frontend is using
    console.log('\nTesting frontend API URL...');
    const frontendResponse = await axios.get('http://localhost:3000/api/employees', {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    console.log('Frontend API response status:', frontendResponse.status);
    console.log('Frontend API response data:', frontendResponse.data);

    // Test the API URL that the frontend should be using with interceptor
    console.log('\nTesting frontend API URL with interceptor...');
    const interceptorResponse = await axios.get('http://localhost:3000/api/employees?active=', {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    console.log('Interceptor API response status:', interceptorResponse.status);
    console.log('Interceptor API response data:', interceptorResponse.data);
    console.log('Number of employees with interceptor:', interceptorResponse.data.employees?.length || 0);

    // Test without authentication to see if that's the issue
    console.log('\nTesting employees API without authentication...');
    try {
      const noAuthResponse = await axios.get('http://localhost:3000/api/employees');
      console.log('No auth API response status:', noAuthResponse.status);
      console.log('No auth API response data:', noAuthResponse.data);
    } catch (error) {
      console.log('No auth API error:', error.response?.data);
    }

    // Test the health endpoint to see if the server is working
    console.log('\nTesting health endpoint...');
    try {
      const healthResponse = await axios.get('http://localhost:3000/api/health');
      console.log('Health API response status:', healthResponse.status);
      console.log('Health API response data:', healthResponse.data);
    } catch (error) {
      console.log('Health API error:', error.response?.data);
    }

    // Test the employee test route
    console.log('\nTesting employee test route...');
    try {
      const testResponse = await axios.get('http://localhost:3000/api/employees/test', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      console.log('Test route response status:', testResponse.status);
      console.log('Test route response data:', testResponse.data);
    } catch (error) {
      console.log('Test route error:', error.response?.data);
    }

  } catch (error) {
    console.error('Test failed:');
    console.error('Status:', error.response?.status);
    console.error('Status Text:', error.response?.statusText);
    console.error('Data:', error.response?.data);
    console.error('Message:', error.message);
    console.error('URL:', error.config?.url);
    console.error('Headers:', error.config?.headers);
  }
}

testEmployeeAPI(); 