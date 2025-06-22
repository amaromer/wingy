# Construction ERP System

A comprehensive Enterprise Resource Planning (ERP) system designed specifically for construction companies, featuring a full-featured Expense Module with modern web technologies.

## 🏗️ Features

### Core Modules
- **Projects Management** - Create, track, and manage construction projects
- **Suppliers Management** - Manage vendor relationships and contact information
- **Expense Categories** - Organize expenses by categories
- **Expense Management** - Complete expense tracking with file attachments
- **User Management** - Role-based access control (Admin/Accountant)
- **Dashboard** - Analytics and reporting with charts

### Key Features
- 🔐 **JWT Authentication** - Secure login with role-based access
- 📊 **Real-time Dashboard** - Charts and analytics for expense tracking
- 📁 **File Upload** - Invoice and receipt attachments
- 🔍 **Advanced Filtering** - Search and filter expenses by multiple criteria
- 📈 **Export Functionality** - CSV and Excel export capabilities
- 📱 **Responsive Design** - Mobile and desktop optimized
- 🎨 **Modern UI** - Clean, professional interface with SCSS styling

## 🛠️ Technology Stack

### Backend
- **Node.js** - Runtime environment
- **Express.js** - Web framework
- **MongoDB** - NoSQL database
- **Mongoose** - MongoDB ODM
- **JWT** - Authentication
- **bcryptjs** - Password hashing
- **multer** - File upload handling
- **express-validator** - Input validation

### Frontend
- **Angular 17** - Modern frontend framework
- **SCSS** - Advanced CSS styling
- **Chart.js** - Data visualization
- **RxJS** - Reactive programming
- **TypeScript** - Type-safe development

## 📋 Prerequisites

Before running this application, make sure you have the following installed:

- **Node.js** (v18 or higher)
- **MongoDB** (v5 or higher)
- **npm** or **yarn**

## 🚀 Installation & Setup

### 1. Clone the Repository
```bash
git clone <repository-url>
cd construction-erp
```

### 2. Install Dependencies
```bash
# Install root dependencies
npm install

# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../frontend
npm install
```

### 3. Environment Configuration

#### Backend Configuration
Create a `.env` file in the `backend` directory:
```bash
cd backend
cp env.example .env
```

Edit the `.env` file with your configuration:
```env
# Server Configuration
PORT=3000
NODE_ENV=development

# MongoDB Configuration
MONGODB_URI=mongodb://localhost:27017/construction_erp

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_EXPIRES_IN=24h

# File Upload Configuration
UPLOAD_PATH=./uploads
MAX_FILE_SIZE=10485760

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

### 4. Database Setup
Make sure MongoDB is running on your system:
```bash
# Start MongoDB (Ubuntu/Debian)
sudo systemctl start mongod

# Start MongoDB (macOS with Homebrew)
brew services start mongodb-community

# Start MongoDB (Windows)
net start MongoDB
```

### 5. Start the Application

#### Development Mode (Both Backend and Frontend)
```bash
# From the root directory
npm run dev
```

#### Individual Services
```bash
# Start backend only
npm run server

# Start frontend only
npm run client
```

### 6. Access the Application
- **Frontend**: http://localhost:4200
- **Backend API**: http://localhost:3000/api
- **API Health Check**: http://localhost:3000/api/health

## 👤 Default Users

The system comes with default users for testing:

### Admin User
- **Email**: admin@construction.com
- **Password**: admin123
- **Role**: Admin

### Accountant User
- **Email**: accountant@construction.com
- **Password**: accountant123
- **Role**: Accountant

## 📊 API Endpoints

### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/register` - Register new user (Admin only)
- `GET /api/auth/me` - Get current user profile
- `PUT /api/auth/me` - Update user profile

### Projects
- `GET /api/projects` - Get all projects
- `GET /api/projects/:id` - Get project by ID
- `POST /api/projects` - Create new project (Admin only)
- `PUT /api/projects/:id` - Update project (Admin only)
- `DELETE /api/projects/:id` - Delete project (Admin only)

### Suppliers
- `GET /api/suppliers` - Get all suppliers
- `GET /api/suppliers/:id` - Get supplier by ID
- `POST /api/suppliers` - Create new supplier (Admin only)
- `PUT /api/suppliers/:id` - Update supplier (Admin only)
- `DELETE /api/suppliers/:id` - Delete supplier (Admin only)

### Categories
- `GET /api/categories` - Get all categories
- `GET /api/categories/:id` - Get category by ID
- `POST /api/categories` - Create new category (Admin only)
- `PUT /api/categories/:id` - Update category (Admin only)
- `DELETE /api/categories/:id` - Delete category (Admin only)

### Expenses
- `GET /api/expenses` - Get all expenses with filtering
- `GET /api/expenses/:id` - Get expense by ID
- `POST /api/expenses` - Create new expense (Admin/Accountant)
- `PUT /api/expenses/:id` - Update expense (Admin/Accountant)
- `DELETE /api/expenses/:id` - Delete expense (Admin/Accountant)
- `GET /api/expenses/export/csv` - Export expenses to CSV
- `GET /api/expenses/export/excel` - Export expenses to Excel

### Dashboard
- `GET /api/dashboard/overview` - Get dashboard overview
- `GET /api/dashboard/expenses-by-project` - Get expenses by project
- `GET /api/dashboard/expenses-by-category` - Get expenses by category
- `GET /api/dashboard/monthly-trend` - Get monthly expense trend

### Users (Admin only)
- `GET /api/users` - Get all users
- `GET /api/users/:id` - Get user by ID
- `PUT /api/users/:id` - Update user
- `DELETE /api/users/:id` - Delete user

## 🔐 Security Features

- **JWT Authentication** - Secure token-based authentication
- **Role-based Access Control** - Admin and Accountant roles
- **Password Hashing** - bcrypt for secure password storage
- **Input Validation** - Server-side validation for all inputs
- **Rate Limiting** - Protection against brute force attacks
- **CORS Configuration** - Secure cross-origin requests
- **File Upload Security** - Restricted file types and sizes

## 📱 User Roles & Permissions

### Admin
- Full access to all modules
- User management
- System configuration
- Create/edit/delete projects, suppliers, categories
- View all expenses and reports

### Accountant
- View projects, suppliers, categories
- Create and edit expenses
- View expense reports and analytics
- Export expense data

## 🎨 UI/UX Features

- **Responsive Design** - Works on desktop, tablet, and mobile
- **Modern Interface** - Clean, professional design
- **Interactive Charts** - Visual data representation
- **Real-time Updates** - Live data synchronization
- **Intuitive Navigation** - Easy-to-use sidebar navigation
- **Form Validation** - Client and server-side validation
- **Loading States** - User feedback during operations
- **Error Handling** - Graceful error messages

## 📈 Dashboard Features

- **Overview Statistics** - Key metrics at a glance
- **Expense Charts** - Visual representation of expense data
- **Project Analytics** - Project-wise expense breakdown
- **Category Analysis** - Expense distribution by category
- **Monthly Trends** - Historical expense tracking
- **Recent Activity** - Latest transactions and updates

## 🔧 Development

### Project Structure
```
construction-erp/
├── backend/                 # Node.js/Express backend
│   ├── models/             # MongoDB schemas
│   ├── routes/             # API routes
│   ├── middleware/         # Custom middleware
│   ├── uploads/            # File uploads
│   └── server.js           # Main server file
├── frontend/               # Angular frontend
│   ├── src/
│   │   ├── app/
│   │   │   ├── core/       # Core services, guards, models
│   │   │   ├── features/   # Feature modules
│   │   │   └── shared/     # Shared components
│   │   ├── assets/         # Static assets
│   │   └── styles.scss     # Global styles
│   └── angular.json        # Angular configuration
└── package.json            # Root package.json
```

### Available Scripts

#### Root Directory
```bash
npm run dev          # Start both backend and frontend
npm run server       # Start backend only
npm run client       # Start frontend only
npm run build        # Build frontend for production
npm run install-all  # Install all dependencies
```

#### Backend Directory
```bash
npm run dev          # Start development server with nodemon
npm start           # Start production server
npm test            # Run tests
```

#### Frontend Directory
```bash
npm start           # Start development server
npm run build       # Build for production
npm test            # Run tests
```

## 🚀 Deployment

### Backend Deployment
1. Set `NODE_ENV=production` in environment variables
2. Configure production MongoDB connection
3. Set secure JWT secret
4. Configure proper CORS origins
5. Set up reverse proxy (nginx recommended)

### Frontend Deployment
1. Build the application: `npm run build`
2. Deploy the `dist/construction-erp` folder to your web server
3. Configure proper API URL in environment files

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

## 🆘 Support

For support and questions:
- Create an issue in the repository
- Contact the development team
- Check the documentation

## 🔄 Version History

- **v1.0.0** - Initial release with core ERP functionality
  - Project management
  - Supplier management
  - Expense tracking
  - User management
  - Dashboard analytics 