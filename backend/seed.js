const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

// Import models
const User = require('./models/User');
const Project = require('./models/Project');
const Supplier = require('./models/Supplier');
const Category = require('./models/Category');
const Expense = require('./models/Expense');

// Sample data
const users = [
  {
    name: 'Admin User',
    email: 'admin@construction.com',
    password: 'admin123',
    role: 'Admin'
  },
  {
    name: 'Accountant User',
    email: 'accountant@construction.com',
    password: 'accountant123',
    role: 'Accountant'
  }
];

const projects = [
  {
    name: 'Downtown Office Complex',
    code: 'DOC-2025',
    start_date: '2025-01-15',
    end_date: '2025-12-31',
    status: 'Active',
    notes: 'Multi-story office building in downtown area'
  },
  {
    name: 'Residential Complex Phase 1',
    code: 'RCP-2025-01',
    start_date: '2025-03-01',
    end_date: '2025-08-31',
    status: 'active',
    notes: 'First phase of residential complex with 50 units'
  },
  {
    name: 'Highway Bridge Renovation',
    code: 'HBR-2025',
    start_date: '2025-02-01',
    end_date: '2025-06-30',
    status: 'Active',
    notes: 'Renovation of main highway bridge'
  }
];

const suppliers = [
  {
    name: 'ABC Construction Supplies',
    contact_person: 'John Smith',
    phone: '+1234567890',
    email: 'john@abcsupplies.com',
    address: '123 Main St, Construction City, CC 12345',
    notes: 'Primary supplier for construction materials'
  },
  {
    name: 'XYZ Equipment Rental',
    contact_person: 'Sarah Johnson',
    phone: '+1987654321',
    email: 'sarah@xyzrental.com',
    address: '456 Industrial Ave, Equipment Town, ET 67890',
    notes: 'Equipment rental and maintenance services'
  },
  {
    name: 'Quality Steel Co.',
    contact_person: 'Mike Wilson',
    phone: '+1555123456',
    email: 'mike@qualitysteel.com',
    address: '789 Steel Blvd, Metal City, MC 11111',
    notes: 'Steel and metal supplies'
  }
];

const categories = [
  {
    name: 'Materials',
    code: 'MAT',
    description: 'Construction materials and supplies'
  },
  {
    name: 'Equipment',
    code: 'EQUIP',
    description: 'Equipment rental and maintenance'
  },
  {
    name: 'Labor',
    code: 'LAB',
    description: 'Labor costs and wages'
  },
  {
    name: 'Transportation',
    code: 'TRANS',
    description: 'Transportation and logistics costs'
  },
  {
    name: 'Utilities',
    code: 'UTIL',
    description: 'Utility costs for construction sites'
  },
  {
    name: 'Insurance',
    code: 'INS',
    description: 'Insurance and liability costs'
  }
];

async function seedDatabase() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/construction_erp');
    console.log('✅ Connected to MongoDB');

    // Clear existing data
    await User.deleteMany({});
    await Project.deleteMany({});
    await Supplier.deleteMany({});
    await Category.deleteMany({});
    await Expense.deleteMany({});
    console.log('✅ Cleared existing data');

    // Create users
    console.log('👥 Creating users...');
    const createdUsers = [];
    for (const userData of users) {
      const user = new User({
        ...userData,
        password: userData.password // Will be hashed by virtual setter
      });
      await user.save();
      createdUsers.push(user);
    }
    console.log(`✅ Created ${createdUsers.length} users`);

    // Create projects
    console.log('🏗️ Creating projects...');
    const createdProjects = [];
    for (const projectData of projects) {
      const project = new Project(projectData);
      await project.save();
      createdProjects.push(project);
    }
    console.log(`✅ Created ${createdProjects.length} projects`);

    // Create suppliers
    console.log('🏢 Creating suppliers...');
    const createdSuppliers = [];
    for (const supplierData of suppliers) {
      const supplier = new Supplier(supplierData);
      await supplier.save();
      createdSuppliers.push(supplier);
    }
    console.log(`✅ Created ${createdSuppliers.length} suppliers`);

    // Create categories
    console.log('📂 Creating categories...');
    const createdCategories = [];
    for (const categoryData of categories) {
      const category = new Category(categoryData);
      await category.save();
      createdCategories.push(category);
    }
    console.log(`✅ Created ${createdCategories.length} categories`);

    // Create sample expenses
    console.log('💰 Creating sample expenses...');
    const sampleExpenses = [
      {
        project_id: createdProjects[0]._id,
        supplier_id: createdSuppliers[0]._id,
        category_id: createdCategories[0]._id,
        amount: 15000.00,
        currency: 'USD',
        date: '2025-01-20',
        description: 'Concrete and steel supplies for foundation',
        invoice_number: 'INV-001-2025'
      },
      {
        project_id: createdProjects[0]._id,
        supplier_id: createdSuppliers[1]._id,
        category_id: createdCategories[1]._id,
        amount: 5000.00,
        currency: 'USD',
        date: '2025-01-25',
        description: 'Crane rental for foundation work',
        invoice_number: 'INV-002-2025'
      },
      {
        project_id: createdProjects[1]._id,
        supplier_id: createdSuppliers[2]._id,
        category_id: createdCategories[0]._id,
        amount: 8000.00,
        currency: 'USD',
        date: '2025-03-05',
        description: 'Steel beams for residential complex',
        invoice_number: 'INV-003-2025'
      },
      {
        project_id: createdProjects[2]._id,
        supplier_id: createdSuppliers[0]._id,
        category_id: createdCategories[0]._id,
        amount: 12000.00,
        currency: 'USD',
        date: '2025-02-10',
        description: 'Bridge construction materials',
        invoice_number: 'INV-004-2025'
      },
      {
        project_id: createdProjects[0]._id,
        supplier_id: createdSuppliers[1]._id,
        category_id: createdCategories[2]._id,
        amount: 7500.00,
        currency: 'USD',
        date: '2025-04-15',
        description: 'Labor costs for electrical work',
        invoice_number: 'INV-005-2025'
      },
      {
        project_id: createdProjects[1]._id,
        supplier_id: createdSuppliers[0]._id,
        category_id: createdCategories[3]._id,
        amount: 3200.00,
        currency: 'USD',
        date: '2025-05-20',
        description: 'Transportation costs for materials',
        invoice_number: 'INV-006-2025'
      },
      {
        project_id: createdProjects[2]._id,
        supplier_id: createdSuppliers[2]._id,
        category_id: createdCategories[0]._id,
        amount: 9500.00,
        currency: 'USD',
        date: '2025-06-10',
        description: 'Additional steel for bridge reinforcement',
        invoice_number: 'INV-007-2025'
      },
      {
        project_id: createdProjects[0]._id,
        supplier_id: createdSuppliers[1]._id,
        category_id: createdCategories[1]._id,
        amount: 4200.00,
        currency: 'USD',
        date: '2025-07-05',
        description: 'Equipment rental for finishing work',
        invoice_number: 'INV-008-2025'
      },
      {
        project_id: createdProjects[0]._id,
        supplier_id: createdSuppliers[0]._id,
        category_id: createdCategories[0]._id,
        amount: 8500.00,
        currency: 'USD',
        date: '2025-01-15',
        description: 'VAT-applicable construction materials',
        invoice_number: 'INV-009-2025',
        is_vat: true
      },
      {
        project_id: createdProjects[1]._id,
        supplier_id: createdSuppliers[2]._id,
        category_id: createdCategories[0]._id,
        amount: 12000.00,
        currency: 'USD',
        date: '2025-02-20',
        description: 'VAT-applicable steel supplies',
        invoice_number: 'INV-010-2025',
        is_vat: true
      },
      {
        project_id: createdProjects[2]._id,
        supplier_id: createdSuppliers[0]._id,
        category_id: createdCategories[0]._id,
        amount: 6500.00,
        currency: 'USD',
        date: '2025-03-10',
        description: 'VAT-applicable bridge materials',
        invoice_number: 'INV-011-2025',
        is_vat: true
      }
    ];

    const createdExpenses = [];
    for (const expenseData of sampleExpenses) {
      const expense = new Expense(expenseData);
      await expense.save();
      createdExpenses.push(expense);
    }
    console.log(`✅ Created ${createdExpenses.length} expenses`);

    console.log('🎉 Database seeded successfully!');
    console.log('\n📊 Summary:');
    console.log(`   👥 Users: ${createdUsers.length}`);
    console.log(`   🏗️ Projects: ${createdProjects.length}`);
    console.log(`   🏢 Suppliers: ${createdSuppliers.length}`);
    console.log(`   📂 Categories: ${createdCategories.length}`);
    console.log(`   💰 Expenses: ${createdExpenses.length}`);

    console.log('\n🔑 Default Login Credentials:');
    console.log('   Admin: admin@construction.com / admin123');
    console.log('   Accountant: accountant@construction.com / accountant123');

  } catch (error) {
    console.error('❌ Error seeding database:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
  }
}

// Run the seeder
seedDatabase(); 