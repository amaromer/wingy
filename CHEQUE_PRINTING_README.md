# Cheque Printing System

## Overview

This cheque printing system allows users to create, manage, and print cheques with automatic amount-to-words conversion in both English and Arabic. The system is designed based on the ADCB Islamic cheque sample and provides a complete workflow for cheque management.

## Features

### 🏦 Core Functionality
- **Cheque Creation**: Create new cheques with payee name and amount
- **Automatic Amount-to-Words**: Converts numerical amounts to words in English and Arabic
- **Multi-Currency Support**: Supports AED, USD, EUR, GBP, SAR, QAR, KWD, BHD, OMR, JOD
- **Status Management**: Draft, Issued, Cleared, Cancelled, Void
- **Approval Workflow**: Approve and void cheques with audit trail
- **Bank Information**: Pre-configured with ADCB Islamic bank details

### 📝 Key Features
- **Real-time Preview**: See amount in words as you type
- **Bilingual Support**: Full English and Arabic interface
- **Responsive Design**: Works on desktop and mobile devices
- **Search & Filter**: Find cheques by payee, status, currency, date range
- **Pagination**: Handle large numbers of cheques efficiently
- **Export & Print**: Ready for cheque printing functionality

## Architecture

### Backend Components

#### 1. Cheque Model (`backend/models/Cheque.js`)
```javascript
{
  cheque_number: String,        // Unique cheque number
  payee_name: String,          // Payee name
  amount: Number,              // Amount in numbers
  amount_in_words: String,     // Amount in words (auto-generated)
  currency: String,            // Currency code
  cheque_date: Date,           // Cheque date
  bank_name: String,           // Bank name (default: ADCB Islamic)
  branch_name: String,         // Branch name
  account_number: String,      // Account number
  iban: String,               // IBAN
  account_holder: String,      // Account holder name
  status: String,             // Draft/Issued/Cleared/Cancelled/Void
  // ... additional fields
}
```

#### 2. Number-to-Words Utility (`backend/utils/numberToWords.js`)
- Converts numbers to words in English and Arabic
- Supports decimal amounts (cents/halalah)
- Handles large numbers (billions)
- Currency-specific formatting

#### 3. API Routes (`backend/routes/cheques.js`)
- `GET /api/cheques` - List cheques with pagination and filtering
- `POST /api/cheques` - Create new cheque
- `PUT /api/cheques/:id` - Update cheque
- `DELETE /api/cheques/:id` - Delete cheque
- `PATCH /api/cheques/:id/approve` - Approve cheque
- `PATCH /api/cheques/:id/void` - Void cheque
- `GET /api/cheques/next-number` - Get next cheque number
- `GET /api/cheques/stats/overview` - Get cheque statistics

### Frontend Components

#### 1. Cheque Form Component
- **Location**: `frontend/src/app/features/cheques/cheque-form/`
- **Features**: 
  - Real-time amount-to-words conversion
  - Form validation
  - Project and supplier selection
  - Bilingual interface

#### 2. Cheque List Component
- **Location**: `frontend/src/app/features/cheques/cheque-list/`
- **Features**:
  - Search and filtering
  - Status-based actions
  - Pagination
  - Responsive design

#### 3. Services and Models
- **Cheque Service**: `frontend/src/app/core/services/cheque.service.ts`
- **Cheque Models**: `frontend/src/app/core/models/cheque.model.ts`

## Installation & Setup

### 1. Backend Setup
```bash
# Navigate to backend directory
cd backend

# Install dependencies (if not already installed)
npm install

# The cheque routes are automatically loaded in server.js
# No additional setup required
```

### 2. Frontend Setup
```bash
# Navigate to frontend directory
cd frontend

# Install dependencies (if not already installed)
npm install

# The cheque components are standalone and ready to use
```

### 3. Database
The cheque model will be automatically created when the application starts. No manual database setup required.

## Usage

### Creating a Cheque

1. **Navigate to Cheques**: Go to the cheques section in the application
2. **Click "Create New Cheque"**: Opens the cheque creation form
3. **Fill in Details**:
   - **Cheque Number**: Auto-generated or manual entry
   - **Payee Name**: Name of the person/company receiving the cheque
   - **Amount**: Enter the numerical amount
   - **Currency**: Select from supported currencies
   - **Date**: Cheque date
   - **Description**: Optional description
   - **Project/Supplier**: Optional linking to projects or suppliers
4. **Review Amount in Words**: The system automatically converts the amount to words
5. **Save**: Creates the cheque in "Draft" status

### Managing Cheques

#### Status Workflow
1. **Draft**: Initial state, can be edited
2. **Issued**: Approved and ready for printing
3. **Cleared**: Cheque has been cashed
4. **Cancelled**: Cheque cancelled before issuance
5. **Void**: Cheque voided after issuance

#### Actions Available
- **View**: View cheque details
- **Edit**: Edit draft cheques only
- **Approve**: Move from Draft to Issued
- **Void**: Void any non-void cheque
- **Delete**: Delete draft cheques only

### Amount-to-Words Conversion

The system automatically converts amounts to words based on the current language:

#### English Example
- **Amount**: 132,300 AED
- **Words**: "One Hundred Thirty-Two Thousand Three Hundred Dirhams"

#### Arabic Example
- **Amount**: 132,300 AED
- **Words**: "مائة واثنان وثلاثون ألف وثلاثمائة درهم"

## Testing

### Test the Number-to-Words Conversion
```bash
# Run the test script
node test-number-to-words.js
```

This will test various amounts and currencies to ensure proper conversion.

### Sample Test Results
```
🧪 Testing Number to Words Conversion

📝 English Conversion Tests:
✅ Test 1: 0 -> "Zero"
✅ Test 2: 1 -> "One"
✅ Test 3: 10 -> "Ten"
...

💰 Currency Tests:
✅ Test 1: 132300 AED (en) -> "One Hundred Thirty-Two Thousand Three Hundred Dirhams"
✅ Test 2: 132300 AED (ar) -> "مائة واثنان وثلاثون ألف وثلاثمائة درهم"
...
```

## Configuration

### Bank Information
Default bank details are configured in the Cheque model:
- **Bank**: ADCB Islamic
- **Branch**: IBD-AL RIGGAH ROAD BRANCH, DUBAI
- **Account**: 13946153820001
- **IBAN**: AE50 0030 0139 4615 3820 001
- **Account Holder**: WINJY BUILDING CONTRACTING LLC

### Supported Currencies
- AED (UAE Dirham)
- USD (US Dollar)
- EUR (Euro)
- GBP (British Pound)
- SAR (Saudi Riyal)
- QAR (Qatar Riyal)
- KWD (Kuwaiti Dinar)
- BHD (Bahraini Dinar)
- OMR (Omani Rial)
- JOD (Jordanian Dinar)

## API Documentation

### Create Cheque
```http
POST /api/cheques
Content-Type: application/json

{
  "cheque_number": "001",
  "payee_name": "John Doe",
  "amount": 132300,
  "currency": "AED",
  "cheque_date": "2024-01-15",
  "description": "Payment for services",
  "project_id": "optional-project-id",
  "supplier_id": "optional-supplier-id",
  "language": "en"
}
```

### Response
```json
{
  "_id": "cheque-id",
  "cheque_number": "001",
  "payee_name": "John Doe",
  "amount": 132300,
  "amount_in_words": "One Hundred Thirty-Two Thousand Three Hundred Dirhams",
  "currency": "AED",
  "status": "Draft",
  "createdAt": "2024-01-15T10:30:00.000Z"
}
```

## Translation Keys

The system includes comprehensive translation keys for both English and Arabic:

### English Keys
- `CHEQUE.LIST_TITLE`: "Cheques"
- `CHEQUE.CREATE_TITLE`: "Create Cheque"
- `CHEQUE.FIELDS.PAYEE_NAME`: "Payee Name"
- `CHEQUE.FIELDS.AMOUNT_IN_WORDS`: "Amount in Words"
- `CHEQUE.STATUSES.DRAFT`: "Draft"
- `CHEQUE.ACTIONS.APPROVE`: "Approve"

### Arabic Keys
- `CHEQUE.LIST_TITLE`: "الشيكات"
- `CHEQUE.CREATE_TITLE`: "إنشاء شيك"
- `CHEQUE.FIELDS.PAYEE_NAME`: "اسم المستفيد"
- `CHEQUE.FIELDS.AMOUNT_IN_WORDS`: "المبلغ بالكلمات"
- `CHEQUE.STATUSES.DRAFT`: "مسودة"
- `CHEQUE.ACTIONS.APPROVE`: "موافقة"

## Future Enhancements

### Planned Features
1. **Cheque Printing**: Generate printable cheque templates
2. **Digital Signatures**: Add digital signature support
3. **Bulk Operations**: Create multiple cheques at once
4. **Advanced Filtering**: More sophisticated search options
5. **Reports**: Cheque summary reports and analytics
6. **Integration**: Connect with accounting systems
7. **Notifications**: Email/SMS notifications for cheque status changes

### Technical Improvements
1. **Performance**: Optimize for large datasets
2. **Caching**: Implement Redis caching for better performance
3. **Audit Trail**: Enhanced logging and audit features
4. **API Rate Limiting**: Implement proper rate limiting
5. **Validation**: Enhanced input validation and sanitization

## Troubleshooting

### Common Issues

1. **Amount not converting to words**
   - Check if the amount is a valid number
   - Ensure the currency is supported
   - Verify the language setting

2. **Cheque number already exists**
   - Use the "Get Next Number" API to get the next available number
   - Check existing cheques for conflicts

3. **Cannot edit cheque**
   - Only draft cheques can be edited
   - Check the cheque status

4. **Translation not working**
   - Ensure translation files are properly loaded
   - Check browser language settings
   - Verify translation keys exist

## Support

For technical support or feature requests, please refer to the main project documentation or contact the development team.

## License

This cheque printing system is part of the larger Wingy ERP system and follows the same licensing terms. 