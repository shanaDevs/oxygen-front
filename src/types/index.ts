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
  bottleId?: string;
  serialNumber?: string;
  bottleTypeId?: string;
  bottleTypeName?: string;
  capacityLiters: number;
  refillKg?: number;
  price: number;
}

export interface Sale {
  id: string;
  invoiceNumber: string;
  customerId?: string;
  customerName?: string;
  customerPhone?: string;
  items: SaleItem[];
  bottleCount: number;
  subtotal: number;
  tax: number;
  taxPercentage: number;
  discount: number;
  discountPercentage: number;
  total: number;
  paymentMethod: 'cash' | 'credit' | 'partial' | 'bank_transfer' | 'card' | 'mobile';
  amountPaid: number;
  creditAmount: number;
  changeAmount: number;
  status: 'pending' | 'completed' | 'cancelled' | 'refunded';
  paymentStatus: 'pending' | 'partial' | 'full';
  userId?: string;
  userName?: string;
  notes?: string;
  saleDate: string;
  createdAt: string;
  customer?: Customer;
  payments?: SalePayment[];
}

export interface SalePayment {
  id: string;
  saleId: string;
  customerId?: string;
  amount: number;
  paymentMethod: 'cash' | 'bank_transfer' | 'cheque' | 'other';
  paymentType: 'sale' | 'outstanding' | 'advance';
  reference?: string;
  notes?: string;
  paymentDate: string;
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
  customerType?: 'regular' | 'wholesale' | 'dealer';
  loyaltyPoints: number;
  totalCredit: number;
  creditLimit?: number;
  bottlesInHand: number;
  ownedBottles?: number;
  totalPurchases?: number;
  totalPaid?: number;
  totalFills?: number;
  isActive?: boolean;
  notes?: string;
  createdAt: string;
}

// ============ OXYGEN REFILLING CENTER TYPES ============

// Supplier who provides liquid oxygen
export interface Supplier {
  id: string;
  name: string;
  phone: string;
  phone2?: string;
  email?: string;
  address?: string;
  totalSupplied: number; // Total kg supplied
  totalPaid: number;
  totalOutstanding: number;
  createdAt: string;
}

// Supplier transaction for liquid oxygen delivery
export interface SupplierTransaction {
  id: string;
  supplierId: string;
  supplierName: string;
  kgSupplied: number;
  litersSupplied?: number;
  pricePerKg: number;
  pricePerLiter?: number;
  totalAmount: number;
  amountPaid: number;
  outstanding: number;
  paymentStatus: 'full' | 'partial' | 'pending';
  notes?: string;
  createdAt: string;
}

export interface SupplierPayment {
  id: string;
  supplierId: string;
  transactionId?: string;
  amount: number;
  paymentMethod: 'cash' | 'bank_transfer' | 'cheque' | 'other';
  reference?: string;
  notes?: string;
  paymentDate: string;
  supplier?: {
    name: string;
  };
}

// Main tank status
export interface MainTank {
  id: string;
  name: string;
  // Primary fields (tons/kg)
  capacityTons: number;
  currentLevelKg: number;
  capacityKg: number;
  percentFull: number | string;
  // Legacy fields
  capacityLiters: number;
  currentLevelLiters: number;
  // Other
  lastRefillDate: string;
  lastRefillAmountKg: number;
  lastRefillAmount: number;
  lowLevelAlertKg: number;
  criticalLevelAlertKg: number;
}

// Small oxygen bottles/cylinders
export interface OxygenBottle {
  id: string;
  serialNumber: string;
  capacityLiters: number;
  bottleTypeId?: string;
  status: 'empty' | 'filled' | 'with_customer' | 'maintenance' | 'retired';
  location: 'center' | 'customer';
  customerId?: string;
  customerName?: string;
  ownerId?: string;
  ownerName?: string;
  receivedDate?: string;
  filledDate?: string;
  issuedDate?: string;
  lastReturnedDate?: string;
  fillCount?: number;
  issueCount?: number;
  notes?: string;
  bottleType?: BottleType;
}

// Bottle type/size configuration
export interface BottleType {
  id: string;
  name: string;
  capacityLiters: number;
  refillKg: number; // KG required to fill this bottle type
  pricePerFill: number;
  depositAmount: number;
  description?: string;
  isActive?: boolean;
}

// Bottle ledger entry
export interface BottleLedgerEntry {
  id: string;
  bottleId: string;
  serialNumber: string;
  operationType: 'received' | 'created' | 'filled' | 'issued' | 'returned' | 'refilled' | 'updated' | 'transferred' | 'maintenance' | 'retired' | 'adjustment';
  previousStatus?: string;
  newStatus?: string;
  previousLocation?: string;
  newLocation?: string;
  customerId?: string;
  customerName?: string;
  transactionId?: string;
  saleId?: string;
  tankHistoryId?: string;
  kgUsed?: number;
  litersUsed?: number;
  amount?: number;
  notes?: string;
  performedBy?: string;
  createdAt: string;
}

// Customer bottle transaction
export interface CustomerPayment {
  id: string;
  customerId: string;
  transactionId?: string;
  amount: number;
  paymentMethod: 'cash' | 'bank_transfer' | 'cheque' | 'card' | 'other';
  paymentType: 'full' | 'partial' | 'advance';
  reference?: string;
  notes?: string;
  paymentDate: string;
}

export interface CustomerTransaction {
  id: string;
  customerId: string;
  customerName: string;
  saleId?: string;
  invoiceNumber?: string;
  transactionType: 'issue' | 'return' | 'refill' | 'payment' | 'sale';
  bottleIds: string[];
  bottleCount: number;
  bottleType: string;
  totalAmount: number;
  amountPaid: number;
  creditAmount: number;
  paymentStatus: 'full' | 'partial' | 'credit';
  notes?: string;
  createdAt: string;
  payments?: CustomerPayment[];
}

// Tank history record
export interface TankHistory {
  id: string;
  mainTankId: string;
  supplierId?: string;
  supplierName?: string;
  operationType: 'refill' | 'fill_bottles' | 'adjustment' | 'loss';
  kgBefore: number;
  kgChanged: number;
  kgAfter: number;
  litersBefore?: number;
  litersChanged?: number;
  litersAfter?: number;
  bottlesFilled?: number;
  totalAmount?: number;
  amountPaid?: number;
  paymentStatus?: 'pending' | 'partial' | 'full';
  notes?: string;
  createdAt: string;
}

// Tank refill record (from main tank to bottles)
export interface TankRefillRecord {
  id: string;
  bottlesFilled: number;
  kgUsed: number;
  litersUsed?: number;
  bottleType: string;
  filledBy: string;
  createdAt: string;
}

// Bottle fill history (individual bottle fills)
export interface BottleFillHistory {
  id: string;
  bottleId: string;
  bottleSerialNumber: string;
  serialNumber?: string;
  bottleCapacity: number;
  capacityLiters?: number;
  kgUsed: number;
  litersUsed?: number;
  filledBy?: string;
  createdAt: string;
}

// Tank fill history (supplier deliveries to main tank)
export interface TankFillHistory {
  id: string;
  supplierId: string;
  supplierName: string;
  kgAdded: number;
  litersAdded?: number;
  previousLevel: number;
  newLevel: number;
  pricePerKg?: number;
  totalAmount: number;
  amountPaid: number;
  outstanding: number;
  paymentStatus: 'full' | 'partial' | 'pending';
  notes?: string;
  createdAt: string;
}

// Notification
export interface Notification {
  id: string;
  type: 'tank_low' | 'tank_critical' | 'bottle_issue' | 'bottle_return' | 'payment_received' | 'payment_due' | 'sale_complete' | 'refill_complete' | 'system';
  title: string;
  message: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  entityType?: string;
  entityId?: string;
  data?: Record<string, unknown>;
  isRead: boolean;
  readAt?: string;
  userId?: string;
  createdAt: string;
}

// Dashboard stats for oxygen center
export interface OxygenDashboardStats {
  mainTankLevelKg: number;
  mainTankCapacityKg: number;
  mainTankPercentFull: number;
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

// Sales statistics
export interface SalesStatistics {
  overall: {
    totalSales: number;
    totalBottles: number;
    totalRevenue: number;
    totalCollected: number;
    totalOutstanding: number;
  };
  today: {
    totalSales: number;
    totalBottles: number;
    totalRevenue: number;
    totalCollected: number;
  };
}

// Tank statistics
export interface TankStatistics {
  tank: MainTank;
  statistics: {
    totalKgRefilled: number;
    refillCount: number;
    totalCost: number;
    totalPaid: number;
    totalOutstanding: number;
    totalKgUsed: number;
    totalBottlesFilled: number;
  };
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
