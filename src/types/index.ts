// Type definitions for the Oxygen Refilling Center POS system

export interface Product {
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

export interface Category {
  id: string;
  name: string;
  description: string;
  color: string;
  icon?: string;
}

export interface SaleItem {
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

export interface Sale {
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

export interface User {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'cashier' | 'manager';
  avatar?: string;
  isActive: boolean;
  createdAt: string;
}

export interface Customer {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  loyaltyPoints: number;
  totalCredit: number;
  bottlesInHand: number;
  createdAt: string;
}

// ============ OXYGEN REFILLING CENTER TYPES ============

// Supplier who provides liquid oxygen
export interface Supplier {
  id: string;
  name: string;
  phone: string;
  email?: string;
  address?: string;
  totalSupplied: number; // Total liters supplied
  totalPaid: number;
  totalOutstanding: number;
  createdAt: string;
}

// Supplier transaction for liquid oxygen delivery
export interface SupplierTransaction {
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

// Main tank status
export interface MainTank {
  id: string;
  name: string;
  capacityLiters: number;
  currentLevelLiters: number;
  lastRefillDate: string;
  lastRefillAmount: number;
}

// Small oxygen bottles/cylinders
export interface OxygenBottle {
  id: string;
  serialNumber: string;
  capacityLiters: number; // Size of the bottle (e.g., 10L, 20L, 40L)
  status: 'empty' | 'filled' | 'with_customer';
  customerId?: string;
  customerName?: string;
  filledDate?: string;
  issuedDate?: string;
}

// Bottle type/size configuration
export interface BottleType {
  id: string;
  name: string;
  capacityLiters: number;
  pricePerFill: number;
  depositAmount: number;
}

// Customer bottle transaction
export interface CustomerTransaction {
  id: string;
  customerId: string;
  customerName: string;
  transactionType: 'issue' | 'return' | 'refill';
  bottleIds: string[];
  bottleCount: number;
  bottleType: string;
  totalAmount: number;
  amountPaid: number;
  creditAmount: number;
  paymentStatus: 'full' | 'partial' | 'credit';
  notes?: string;
  createdAt: string;
}

// Tank refill record (from main tank to bottles)
export interface TankRefillRecord {
  id: string;
  bottlesFilled: number;
  litersUsed: number;
  bottleType: string;
  filledBy: string;
  createdAt: string;
}

// Bottle fill history (individual bottle fills)
export interface BottleFillHistory {
  id: string;
  bottleId: string;
  bottleSerialNumber: string;
  bottleCapacity: number;
  litersUsed: number;
  filledBy?: string;
  createdAt: string;
}

// Tank fill history (supplier deliveries to main tank)
export interface TankFillHistory {
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
  createdAt: string;
}

// Dashboard stats for oxygen center
export interface OxygenDashboardStats {
  mainTankLevel: number;
  mainTankCapacity: number;
  filledBottles: number;
  emptyBottles: number;
  bottlesWithCustomers: number;
  todayRefills: number;
  totalOutstandingFromCustomers: number;
  totalOutstandingToSuppliers: number;
  recentSupplierTransactions: SupplierTransaction[];
  recentCustomerTransactions: CustomerTransaction[];
}

export interface DashboardStats {
  todaySales: number;
  totalOrders: number;
  averageOrder: number;
  topProducts: { product: Product; quantity: number }[];
  recentSales: Sale[];
}

// API Response types
export interface ApiResponse<T> {
  data: T;
  success: boolean;
  message?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
