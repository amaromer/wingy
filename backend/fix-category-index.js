const mongoose = require('mongoose');

async function fixCategoryIndex() {
  try {
    // Connect to MongoDB directly
    await mongoose.connect('mongodb://localhost:27017/construction_erp');
    console.log('Connected to MongoDB');

    // Get the categories collection
    const db = mongoose.connection.db;
    const categoriesCollection = db.collection('categories');

    // Drop the existing unique index on code
    try {
      await categoriesCollection.dropIndex('code_1');
      console.log('Dropped existing code index');
    } catch (error) {
      console.log('Index might not exist or already dropped:', error.message);
    }

    // Create a new sparse unique index that allows null values
    await categoriesCollection.createIndex({ code: 1 }, { 
      unique: true, 
      sparse: true 
    });
    console.log('Created new sparse unique index on code field');

    console.log('Category index fix completed successfully');
    process.exit(0);
  } catch (error) {
    console.error('Error fixing category index:', error);
    process.exit(1);
  }
}

fixCategoryIndex(); 