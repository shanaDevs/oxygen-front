# Oxygen Refilling Center POS - Frontend API Specification

## 📋 Overview

This document provides a comprehensive specification for the backend API required by the Oxygen Refilling Center POS frontend application. The frontend is built with **Next.js 16.1.3** (Turbopack) and currently uses dummy data from `src/data/` directory.

---

## 🛠️ Tech Stack

- **Framework:** Next.js 16.1.3 with App Router
- **Language:** TypeScript
- **UI Components:** shadcn/ui (Radix UI primitives)
- **Styling:** Tailwind CSS v4 with dark theme support
- **Icons:** lucide-react
- **State:** React useState/useEffect (client components)

---

## 🔧 API Configuration

The frontend is configured to connect to a backend API. Configuration is in `src/services/config.ts`:

```typescript
export const API_CONFIG = {
  USE_MOCK_DATA: true,  // Set to false when backend is ready
  BASE_URL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api',
  ENDPOINTS: {
    PRODUCTS: '/products',
    CATEGORIES: '/categories',
    SALES: '/sales',
    USERS: '/users',
    CUSTOMERS: '/customers',
    DASHBOARD: '/dashboard',
    AUTH: '/auth',
  },
  TIMEOUT: 10000,
};
```

---

## 📊 Data Types (TypeScript Interfaces)

### Core Business Types

#### Customer
```typescript
interface Customer {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  loyaltyPoints: number;
  totalCredit: number;        // Outstanding balance owed by customer
  bottlesInHand: number;      // Number of bottles currently with customer
  createdAt: string;          // ISO date string
}
```

#### Supplier
```typescript
interface Supplier {
  id: string;
  name: string;
  phone: string;
  email?: string;
  address?: string;
  totalSupplied: number;      // Total liters supplied historically
  totalPaid: number;          // Total amount paid to supplier
  totalOutstanding: number;   // Amount still owed to supplier
  createdAt: string;
}
```

#### OxygenBottle
```typescript
interface OxygenBottle {
  id: string;
  serialNumber: string;
  capacityLiters: number;     // Size: 10L, 20L, 40L, etc.
  status: 'empty' | 'filled' | 'with_customer';
  customerId?: string;        // Set when status is 'with_customer'
  customerName?: string;
  filledDate?: string;
  issuedDate?: string;
}
```

#### BottleType
```typescript
interface BottleType {
  id: string;
  name: string;               // e.g., "Small", "Medium", "Large"
  capacityLiters: number;     // 10, 20, 40, etc.
  pricePerFill: number;       // Price to fill this bottle type
  depositAmount: number;      // Deposit required for new bottle
}
```

#### MainTank
```typescript
interface MainTank {
  id: string;
  name: string;
  capacityLiters: number;     // Max capacity
  currentLevelLiters: number; // Current oxygen level
  lastRefillDate: string;
  lastRefillAmount: number;
}
```

### Transaction Types

#### CustomerTransaction
```typescript
interface CustomerTransaction {
  id: string;
  customerId: string;
  customerName: string;
  transactionType: 'issue' | 'return' | 'refill';
  bottleIds: string[];        // Array of bottle IDs involved
  bottleCount: number;
  bottleType: string;         // e.g., "Small 10L"
  totalAmount: number;
  amountPaid: number;
  creditAmount: number;       // Amount added to customer credit
  paymentStatus: 'full' | 'partial' | 'credit';
  notes?: string;
  createdAt: string;
}
```

#### SupplierTransaction
```typescript
interface SupplierTransaction {
  id: string;
  supplierId: string;
  supplierName: string;
  litersSupplied: number;
  pricePerLiter: number;
  totalAmount: number;
  amountPaid: number;
  outstanding: number;
  paymentStatus: 'full' | 'partial' | 'outstanding';
  notes?: string;
  createdAt: string;
}
```

### Legacy Types (for Products/Sales)

#### Product
```typescript
interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  categoryId: string;
  stock: number;
  sku: string;
  image?: string;
  createdAt: string;
  updatedAt: string;
}
```

#### Sale
```typescript
interface Sale {
  id: string;
  items: SaleItem[];
  subtotal: number;
  tax: number;
  discount: number;
  total: number;
  paymentMethod: 'cash' | 'card' | 'mobile';
  status: 'completed' | 'pending' | 'cancelled';
  customerId?: string;
  userId: string;
  createdAt: string;
}
```

---

## 📡 Required API Endpoints

### Customers

| Method | Endpoint | Description | Request Body | Response |
|--------|----------|-------------|--------------|----------|
| GET | `/api/customers` | List all customers | - | `Customer[]` |
| GET | `/api/customers/:id` | Get single customer | - | `Customer` |
| POST | `/api/customers` | Create customer | `{name, phone?, email?, address?}` | `Customer` |
| PUT | `/api/customers/:id` | Update customer | `Partial<Customer>` | `Customer` |
| DELETE | `/api/customers/:id` | Delete customer | - | `{success: boolean}` |

### Customer Transactions

| Method | Endpoint | Description | Request Body | Response |
|--------|----------|-------------|--------------|----------|
| GET | `/api/customer-transactions` | List all transactions | - | `CustomerTransaction[]` |
| GET | `/api/customer-transactions?customerId=:id` | Get by customer | - | `CustomerTransaction[]` |
| POST | `/api/customer-transactions/issue` | Issue bottles to customer | See below | `CustomerTransaction` |
| POST | `/api/customer-transactions/return` | Return bottles from customer | See below | `CustomerTransaction` |
| POST | `/api/customer-transactions/payment` | Collect payment | See below | `CustomerTransaction` |

**Issue Bottles Request:**
```json
{
  "customerId": "cust-1",
  "bottleIds": ["bot-1", "bot-2"],
  "totalAmount": 2000,
  "amountPaid": 1500,
  "paymentStatus": "partial"
}
```

**Return Bottles Request:**
```json
{
  "customerId": "cust-1",
  "bottleIds": ["bot-1", "bot-2"],
  "notes": "Optional return notes"
}
```

**Collect Payment Request:**
```json
{
  "customerId": "cust-1",
  "amount": 500,
  "notes": "Monthly payment"
}
```

### Suppliers

| Method | Endpoint | Description | Request Body | Response |
|--------|----------|-------------|--------------|----------|
| GET | `/api/suppliers` | List all suppliers | - | `Supplier[]` |
| GET | `/api/suppliers/:id` | Get single supplier | - | `Supplier` |
| POST | `/api/suppliers` | Create supplier | `{name, phone, email?, address?}` | `Supplier` |
| PUT | `/api/suppliers/:id` | Update supplier | `Partial<Supplier>` | `Supplier` |
| DELETE | `/api/suppliers/:id` | Delete supplier | - | `{success: boolean}` |

### Supplier Transactions (Tank Refills)

| Method | Endpoint | Description | Request Body | Response |
|--------|----------|-------------|--------------|----------|
| GET | `/api/supplier-transactions` | List all transactions | - | `SupplierTransaction[]` |
| GET | `/api/supplier-transactions?supplierId=:id` | Get by supplier | - | `SupplierTransaction[]` |
| POST | `/api/supplier-transactions` | Add supplier delivery | See below | `SupplierTransaction` |

**Add Supplier Delivery Request:**
```json
{
  "supplierId": "sup-1",
  "litersSupplied": 5000,
  "pricePerLiter": 15,
  "amountPaid": 50000,
  "paymentStatus": "partial",
  "notes": "Monthly delivery"
}
```

### Bottles

| Method | Endpoint | Description | Request Body | Response |
|--------|----------|-------------|--------------|----------|
| GET | `/api/bottles` | List all bottles | - | `OxygenBottle[]` |
| GET | `/api/bottles?status=:status` | Filter by status | - | `OxygenBottle[]` |
| POST | `/api/bottles` | Add new bottle | `{serialNumber, capacityLiters}` | `OxygenBottle` |
| PUT | `/api/bottles/:id` | Update bottle | `Partial<OxygenBottle>` | `OxygenBottle` |
| POST | `/api/bottles/fill` | Fill multiple bottles | `{bottleIds: string[]}` | `OxygenBottle[]` |
| GET | `/api/bottles/fill-history` | Get bottle fill history | - | `BottleFillHistory[]` |
| GET | `/api/bottles/fill-history?limit=:n` | Get limited fill history | - | `BottleFillHistory[]` |

**BottleFillHistory Response:**
```typescript
interface BottleFillHistory {
  id: string;
  bottleId: string;
  bottleSerialNumber: string;
  bottleCapacity: number;
  litersUsed: number;
  filledBy?: string;
  createdAt: string;  // ISO date string
}
```

### Bottle Types

| Method | Endpoint | Description | Request Body | Response |
|--------|----------|-------------|--------------|----------|
| GET | `/api/bottle-types` | List all bottle types | - | `BottleType[]` |
| POST | `/api/bottle-types` | Create bottle type | `{name, capacityLiters, pricePerFill, depositAmount}` | `BottleType` |
| PUT | `/api/bottle-types/:id` | Update bottle type | `Partial<BottleType>` | `BottleType` |

### Tank

| Method | Endpoint | Description | Request Body | Response |
|--------|----------|-------------|--------------|----------|
| GET | `/api/tank` | Get tank status | - | `MainTank` |
| PUT | `/api/tank` | Update tank level | `{currentLevelLiters}` | `MainTank` |
| POST | `/api/tank/refill` | Refill tank (with supplier tx) | See supplier transactions | `MainTank` |
| GET | `/api/tank/fill-history` | Get tank fill history | - | `TankFillHistory[]` |
| GET | `/api/tank/fill-history?limit=:n` | Get limited fill history | - | `TankFillHistory[]` |

**TankFillHistory Response:**
```typescript
interface TankFillHistory {
  id: string;
  supplierId: string;
  supplierName: string;
  litersAdded: number;
  previousLevel: number;
  newLevel: number;
  pricePerLiter: number;
  totalAmount: number;
  amountPaid: number;
  outstanding: number;
  paymentStatus: 'full' | 'partial' | 'outstanding';
  notes?: string;
  createdAt: string;  // ISO date string
}
```

### Dashboard

| Method | Endpoint | Description | Response |
|--------|----------|-------------|----------|
| GET | `/api/dashboard/stats` | Get dashboard statistics | See below |

**Dashboard Stats Response:**
```json
{
  "mainTankLevel": 15000,
  "mainTankCapacity": 20000,
  "filledBottles": 45,
  "emptyBottles": 12,
  "bottlesWithCustomers": 78,
  "todayRefills": 5,
  "totalOutstandingFromCustomers": 125000,
  "totalOutstandingToSuppliers": 50000,
  "recentSupplierTransactions": [...],
  "recentCustomerTransactions": [...]
}
```

### Sales (Legacy POS)

| Method | Endpoint | Description | Request Body | Response |
|--------|----------|-------------|--------------|----------|
| GET | `/api/sales` | List all sales | - | `Sale[]` |
| GET | `/api/sales?status=:status` | Filter by status | - | `Sale[]` |
| POST | `/api/sales` | Create sale | `Sale` | `Sale` |

---

## 📱 Frontend Pages & Features

### 1. Dashboard (`/`)
- Tank level gauge (percentage, color-coded)
- Filled/Empty/With Customer bottle counts
- Today's transactions count
- Total outstanding from customers
- Total outstanding to suppliers
- Quick links to all sections
- Recent transactions tables

### 2. Tank Management (`/tank`)
- Real-time tank visualization with fill animation
- Refill tank modal (select supplier, enter liters, payment info)
- Fill bottles from tank modal
- Recent supplier transaction history
- Tank statistics (capacity, current level, last refill)

### 3. Bottle Management (`/bottles`)
- Grid view of all bottles with status indicators
- Filter by status (empty/filled/with customer)
- Filter by bottle type/size
- Add new bottle modal
- Fill selected bottles modal
- Bottle statistics by size

### 4. Customer Management (`/customers`)
- Customer cards with key info
- Issue bottles modal (select filled bottles, payment)
- Return bottles modal (select bottles to return)
- Collect payment modal
- Customer transaction history table
- Add new customer modal
- Statistics: total customers, bottles out, total credit

### 5. Supplier Management (`/suppliers`)
- Supplier cards with contact info
- Add new supplier modal
- Supplier transaction history table
- Statistics: total supplied, paid, outstanding

### 6. POS (`/pos`)
- Select customer
- Select filled bottles to issue
- Cart management
- Payment method selection (cash/credit/partial)
- Checkout confirmation

### 7. Sales History (`/sales`)
- Sales table with filters
- Filter by status, payment method, date
- View sale details
- Statistics: total sales, completed, pending

### 8. Settings (`/settings`)
- Store name configuration
- Tax rate setting
- Currency selection
- API connection toggle (mock data vs real backend)
- API URL configuration

---

## 🔄 Business Logic Notes

### Bottle Flow
1. **Empty** → Filled (from tank): Reduces tank level
2. **Filled** → With Customer (issue): Customer pays or adds to credit
3. **With Customer** → Empty (return): Bottle comes back for refilling

### Financial Tracking
- **Customer Credit**: Track amount owed by customers
- **Supplier Outstanding**: Track amount owed to suppliers
- All transactions should update running totals

### Tank Operations
- Refill from supplier: Increases tank level, creates supplier transaction
- Fill bottles: Decreases tank level proportionally

---

## 🔐 Authentication (Future)

```typescript
interface User {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'cashier' | 'manager';
  avatar?: string;
  isActive: boolean;
  createdAt: string;
}
```

Expected endpoints:
- `POST /api/auth/login` - Login with email/password
- `POST /api/auth/logout` - Logout
- `GET /api/auth/me` - Get current user
- `POST /api/auth/refresh` - Refresh token

---

## 📝 API Response Format

### Success Response
```json
{
  "success": true,
  "data": { ... },
  "message": "Operation successful"
}
```

### Error Response
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid input data",
    "details": [...]
  }
}
```

### Paginated Response
```json
{
  "data": [...],
  "total": 100,
  "page": 1,
  "limit": 20,
  "totalPages": 5
}
```

---

## 🚀 Getting Started for Backend

1. Implement all endpoints listed above
2. Use the TypeScript interfaces for data validation
3. Set up CORS for `http://localhost:3000`
4. Update frontend `.env.local` file with your backend URL:
   ```
   NEXT_PUBLIC_API_URL=http://localhost:5000/api
   ```
5. The frontend is already configured to connect to the backend (USE_MOCK_DATA is set to `false`)
6. Restart the frontend dev server after changing environment variables

### API Services Available

The frontend has these service modules ready to call your backend:
- `customerService` - Customer CRUD + transactions (issue/return/payment)
- `supplierService` - Supplier CRUD + transactions
- `bottleService` - Bottle CRUD + fill operations
- `tankService` - Tank status, refill, deduct liters

### Testing the Connection

1. Start your backend server on port 5000 (or update the URL)
2. Start the frontend: `npm run dev`
3. Open the dashboard - it will show a connection error if the backend is not running
4. If connected successfully, data will be fetched from your API

---

## 📁 Current Dummy Data Files

Located in `src/data/`:
- `bottles.ts` - Sample bottles and bottle types
- `customers.ts` - Sample customers
- `customerTransactions.ts` - Sample customer transactions
- `suppliers.ts` - Sample suppliers
- `supplierTransactions.ts` - Sample supplier transactions
- `mainTank.ts` - Tank configuration and history
- `products.ts`, `sales.ts`, `categories.ts` - Legacy POS data

---

*Generated: January 19, 2026*
