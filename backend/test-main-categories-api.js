const axios = require('axios');
require('dotenv').config();

async function testMainCategoriesAPI() {
    try {
        console.log('Testing main categories API...');
        
        // Test 1: Check if server is running
        console.log('\n1. Testing server health...');
        try {
            const healthResponse = await axios.get('http://localhost:3000/api/health');
            console.log('✅ Server health check passed:', healthResponse.status);
        } catch (error) {
            console.log('❌ Server health check failed:', error.message);
            return;
        }
        
        // Test 2: Test main categories without authentication
        console.log('\n2. Testing main categories API without authentication...');
        try {
            const response = await axios.get('http://localhost:3000/api/main-categories');
            console.log('✅ Main categories API accessible without auth:', response.status);
            console.log('Response data:', response.data);
        } catch (error) {
            console.log('❌ Main categories API failed:', error.response?.status, error.response?.statusText);
            console.log('Error message:', error.response?.data?.message || error.message);
        }
        
        // Test 3: Test with authentication
        console.log('\n3. Testing main categories API with authentication...');
        try {
            // First, get a token by logging in
            const loginResponse = await axios.post('http://localhost:3000/api/auth/login', {
                email: 'admin@construction.com',
                password: 'admin123'
            });
            
            const token = loginResponse.data.token;
            console.log('✅ Login successful, got token');
            
            // Now test main categories with token
            const authResponse = await axios.get('http://localhost:3000/api/main-categories', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            
            console.log('✅ Main categories API with auth:', authResponse.status);
            console.log('Response data:', authResponse.data);
            
        } catch (error) {
            console.log('❌ Main categories API with auth failed:', error.response?.status, error.response?.statusText);
            console.log('Error message:', error.response?.data?.message || error.message);
        }
        
        // Test 4: Check database connection
        console.log('\n4. Testing database connection...');
        try {
            const mongoose = require('mongoose');
            await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/wingy');
            console.log('✅ Database connection successful');
            
            // Check if MainCategory model exists
            const MainCategory = require('./models/MainCategory');
            const count = await MainCategory.countDocuments();
            console.log(`✅ MainCategory model accessible, count: ${count}`);
            
            await mongoose.connection.close();
        } catch (error) {
            console.log('❌ Database connection failed:', error.message);
        }
        
        console.log('\n✅ Main categories API test completed');
        
    } catch (error) {
        console.error('Test failed:', error.message);
    }
}

testMainCategoriesAPI(); 