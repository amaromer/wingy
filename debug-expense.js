// Debug script for expense creation
// Run this with: node debug-expense.js

const axios = require('axios');

// Configuration
const API_BASE_URL = 'http://localhost:3000/api'; // Adjust if your backend runs on different port
const TEST_TOKEN = 'your-jwt-token-here'; // Replace with actual token

// Test data
const testExpense = {
  project_id: '507f1f77bcf86cd799439011', // Replace with actual project ID
  supplier_id: '507f1f77bcf86cd799439012', // Replace with actual supplier ID
  category_id: '507f1f77bcf86cd799439013', // Replace with actual category ID
  amount: 100.50,
  currency: 'USD',
  date: '2024-01-15',
  description: 'Test expense for debugging',
  invoice_number: 'INV-001'
};

async function testExpenseCreation() {
  try {
    console.log('Testing expense creation...');
    console.log('Test data:', testExpense);
    
    const response = await axios.post(`${API_BASE_URL}/expenses`, testExpense, {
      headers: {
        'Authorization': `Bearer ${TEST_TOKEN}`,
        'Content-Type': 'application/json'
      }
    });
    
    console.log('✅ Success! Expense created:', response.data);
  } catch (error) {
    console.error('❌ Error creating expense:');
    console.error('Status:', error.response?.status);
    console.error('Status Text:', error.response?.statusText);
    console.error('Response Data:', error.response?.data);
    console.error('Error Message:', error.message);
    
    if (error.response?.status === 401) {
      console.log('🔐 Authentication error - check your JWT token');
    } else if (error.response?.status === 403) {
      console.log('🚫 Authorization error - user may not have accountant role');
    } else if (error.response?.status === 400) {
      console.log('📝 Validation error - check the error details above');
    } else if (error.response?.status === 500) {
      console.log('💥 Server error - check backend logs');
    }
  }
}

async function testAuthentication() {
  try {
    console.log('\nTesting authentication...');
    
    const response = await axios.get(`${API_BASE_URL}/auth/me`, {
      headers: {
        'Authorization': `Bearer ${TEST_TOKEN}`
      }
    });
    
    console.log('✅ Authentication successful:', response.data);
    console.log('User role:', response.data.role);
  } catch (error) {
    console.error('❌ Authentication failed:', error.response?.data);
  }
}

async function testEntities() {
  try {
    console.log('\nTesting entity existence...');
    
    const [projects, suppliers, categories] = await Promise.all([
      axios.get(`${API_BASE_URL}/projects`, {
        headers: { 'Authorization': `Bearer ${TEST_TOKEN}` }
      }),
      axios.get(`${API_BASE_URL}/suppliers`, {
        headers: { 'Authorization': `Bearer ${TEST_TOKEN}` }
      }),
      axios.get(`${API_BASE_URL}/categories`, {
        headers: { 'Authorization': `Bearer ${TEST_TOKEN}` }
      })
    ]);
    
    console.log('✅ Projects found:', projects.data.length);
    console.log('✅ Suppliers found:', suppliers.data.length);
    console.log('✅ Categories found:', categories.data.length);
    
    if (projects.data.length > 0) {
      console.log('First project ID:', projects.data[0]._id);
    }
    if (suppliers.data.length > 0) {
      console.log('First supplier ID:', suppliers.data[0]._id);
    }
    if (categories.data.length > 0) {
      console.log('First category ID:', categories.data[0]._id);
    }
  } catch (error) {
    console.error('❌ Error fetching entities:', error.response?.data);
  }
}

// Run tests
async function runTests() {
  console.log('🔍 Expense Creation Debug Tool');
  console.log('================================');
  
  await testAuthentication();
  await testEntities();
  await testExpenseCreation();
  
  console.log('\n📋 Instructions:');
  console.log('1. Replace TEST_TOKEN with your actual JWT token');
  console.log('2. Replace the IDs in testExpense with actual IDs from your database');
  console.log('3. Make sure your backend is running on the correct port');
  console.log('4. Check the console output for detailed error information');
}

runTests().catch(console.error); 