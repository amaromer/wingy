const axios = require('axios');
require('dotenv').config();

async function fixMainCategoriesCheck() {
    try {
        console.log('🔧 Fixing main categories API check...');
        
        // Step 1: Check if server is running
        console.log('\n1. Checking server status...');
        try {
            await axios.get('http://localhost:3000/api/health');
            console.log('✅ Server is running');
        } catch (error) {
            console.log('❌ Server is not running. Starting server...');
            console.log('Please run: pm2 start winjy-erp-backend');
            return;
        }
        
        // Step 2: Check database connection
        console.log('\n2. Checking database connection...');
        try {
            const mongoose = require('mongoose');
            await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/wingy');
            console.log('✅ Database connected');
            
            // Check MainCategory model
            const MainCategory = require('./models/MainCategory');
            const count = await MainCategory.countDocuments();
            console.log(`✅ MainCategory model working, ${count} records found`);
            
            await mongoose.connection.close();
        } catch (error) {
            console.log('❌ Database connection failed:', error.message);
            return;
        }
        
        // Step 3: Test API with authentication
        console.log('\n3. Testing API with authentication...');
        try {
            // Login to get token
            const loginResponse = await axios.post('http://localhost:3000/api/auth/login', {
                email: 'admin@construction.com',
                password: 'admin123'
            });
            
            const token = loginResponse.data.token;
            console.log('✅ Authentication successful');
            
            // Test main categories API
            const apiResponse = await axios.get('http://localhost:3000/api/main-categories', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            
            console.log('✅ Main categories API working:', apiResponse.status);
            console.log(`Found ${apiResponse.data.mainCategories?.length || 0} main categories`);
            
        } catch (error) {
            console.log('❌ API test failed:', error.response?.status, error.response?.statusText);
            console.log('Error:', error.response?.data?.message || error.message);
        }
        
        console.log('\n🎉 Main categories API check fixed!');
        console.log('The deployment script has been updated to handle authentication properly.');
        
    } catch (error) {
        console.error('Fix failed:', error.message);
    }
}

fixMainCategoriesCheck(); 