import { Customer, CustomerTransaction, ApiResponse } from '@/types';
import { customers as mockCustomers, customerTransactions as mockTransactions } from '@/data';
import { API_CONFIG, apiFetch } from './config';

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const customerService = {
  // Get all customers
  async getAll(): Promise<Customer[]> {
    if (API_CONFIG.USE_MOCK_DATA) {
      await delay(300);
      return mockCustomers;
    }
    const response = await apiFetch<ApiResponse<Customer[]>>(API_CONFIG.ENDPOINTS.CUSTOMERS);
    return response.data;
  },

  // Get customer by ID
  async getById(id: string): Promise<Customer | null> {
    if (API_CONFIG.USE_MOCK_DATA) {
      await delay(200);
      return mockCustomers.find(c => c.id === id) || null;
    }
    const response = await apiFetch<ApiResponse<Customer>>(`${API_CONFIG.ENDPOINTS.CUSTOMERS}/${id}`);
    return response.data;
  },

  // Create customer
  async create(customer: Omit<Customer, 'id' | 'createdAt' | 'loyaltyPoints' | 'totalCredit' | 'bottlesInHand'>): Promise<Customer> {
    if (API_CONFIG.USE_MOCK_DATA) {
      await delay(500);
      return {
        ...customer,
        id: `cust-${Date.now()}`,
        loyaltyPoints: 0,
        totalCredit: 0,
        bottlesInHand: 0,
        createdAt: new Date().toISOString(),
      };
    }
    const response = await apiFetch<ApiResponse<Customer>>(API_CONFIG.ENDPOINTS.CUSTOMERS, {
      method: 'POST',
      body: JSON.stringify(customer),
    });
    return response.data;
  },

  // Update customer
  async update(id: string, data: Partial<Customer>): Promise<Customer> {
    if (API_CONFIG.USE_MOCK_DATA) {
      await delay(400);
      const customer = mockCustomers.find(c => c.id === id);
      if (!customer) throw new Error('Customer not found');
      return { ...customer, ...data };
    }
    const response = await apiFetch<ApiResponse<Customer>>(`${API_CONFIG.ENDPOINTS.CUSTOMERS}/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
    return response.data;
  },

  // Delete customer
  async delete(id: string): Promise<void> {
    if (API_CONFIG.USE_MOCK_DATA) {
      await delay(300);
      return;
    }
    await apiFetch(`${API_CONFIG.ENDPOINTS.CUSTOMERS}/${id}`, { method: 'DELETE' });
  },

  // Get all transactions
  async getTransactions(customerId?: string): Promise<CustomerTransaction[]> {
    if (API_CONFIG.USE_MOCK_DATA) {
      await delay(300);
      return customerId 
        ? mockTransactions.filter(t => t.customerId === customerId)
        : mockTransactions;
    }
    const endpoint = customerId 
      ? `${API_CONFIG.ENDPOINTS.CUSTOMER_TRANSACTIONS}?customerId=${customerId}`
      : API_CONFIG.ENDPOINTS.CUSTOMER_TRANSACTIONS;
    const response = await apiFetch<ApiResponse<CustomerTransaction[]>>(endpoint);
    return response.data;
  },

  // Issue bottles to customer
  async issueBottles(data: {
    customerId: string;
    bottleIds: string[];
    totalAmount: number;
    amountPaid: number;
    paymentStatus: 'full' | 'partial' | 'credit';
  }): Promise<CustomerTransaction> {
    if (API_CONFIG.USE_MOCK_DATA) {
      await delay(500);
      return {
        id: `ct-${Date.now()}`,
        customerId: data.customerId,
        customerName: 'Mock Customer',
        transactionType: 'issue',
        bottleIds: data.bottleIds,
        bottleCount: data.bottleIds.length,
        bottleType: 'Mixed',
        totalAmount: data.totalAmount,
        amountPaid: data.amountPaid,
        creditAmount: data.totalAmount - data.amountPaid,
        paymentStatus: data.paymentStatus,
        createdAt: new Date().toISOString(),
      };
    }
    const response = await apiFetch<ApiResponse<CustomerTransaction>>(
      `${API_CONFIG.ENDPOINTS.CUSTOMER_TRANSACTIONS}/issue`,
      { method: 'POST', body: JSON.stringify(data) }
    );
    return response.data;
  },

  // Return bottles from customer
  async returnBottles(data: {
    customerId: string;
    bottleIds: string[];
    notes?: string;
  }): Promise<CustomerTransaction> {
    if (API_CONFIG.USE_MOCK_DATA) {
      await delay(500);
      return {
        id: `ct-${Date.now()}`,
        customerId: data.customerId,
        customerName: 'Mock Customer',
        transactionType: 'return',
        bottleIds: data.bottleIds,
        bottleCount: data.bottleIds.length,
        bottleType: 'Mixed',
        totalAmount: 0,
        amountPaid: 0,
        creditAmount: 0,
        paymentStatus: 'full',
        notes: data.notes,
        createdAt: new Date().toISOString(),
      };
    }
    const response = await apiFetch<ApiResponse<CustomerTransaction>>(
      `${API_CONFIG.ENDPOINTS.CUSTOMER_TRANSACTIONS}/return`,
      { method: 'POST', body: JSON.stringify(data) }
    );
    return response.data;
  },

  // Collect payment from customer
  async collectPayment(data: {
    customerId: string;
    amount: number;
    notes?: string;
  }): Promise<CustomerTransaction> {
    if (API_CONFIG.USE_MOCK_DATA) {
      await delay(500);
      return {
        id: `ct-${Date.now()}`,
        customerId: data.customerId,
        customerName: 'Mock Customer',
        transactionType: 'refill',
        bottleIds: [],
        bottleCount: 0,
        bottleType: 'Payment',
        totalAmount: data.amount,
        amountPaid: data.amount,
        creditAmount: -data.amount,
        paymentStatus: 'full',
        notes: data.notes,
        createdAt: new Date().toISOString(),
      };
    }
    const response = await apiFetch<ApiResponse<CustomerTransaction>>(
      `${API_CONFIG.ENDPOINTS.CUSTOMER_TRANSACTIONS}/payment`,
      { method: 'POST', body: JSON.stringify(data) }
    );
    return response.data;
  },
};
