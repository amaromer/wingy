const mongoose = require('mongoose');
const axios = require('axios');
require('dotenv').config();

async function testAPI() {
  try {
    // First, get a token by logging in
    const loginResponse = await axios.post('http://localhost:3000/api/auth/login', {
      email: 'admin@construction.com',
      password: 'admin123'
    });

    const token = loginResponse.data.token;
    console.log('Got token:', token ? 'Yes' : 'No');

    // Test the petty cash balances endpoint
    const balancesResponse = await axios.get('http://localhost:3000/api/petty-cash/balances', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    console.log('Balances response:', balancesResponse.data);
    console.log('Number of employees with balances:', balancesResponse.data.length);

  } catch (error) {
    console.error('API test failed:');
    console.error('Status:', error.response?.status);
    console.error('Status Text:', error.response?.statusText);
    console.error('Data:', error.response?.data);
    console.error('Message:', error.message);
  }
}

testAPI(); 