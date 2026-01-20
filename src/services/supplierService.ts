import { Supplier, SupplierTransaction, ApiResponse } from '@/types';
import { suppliers as mockSuppliers, supplierTransactions as mockTransactions } from '@/data';
import { API_CONFIG, apiFetch } from './config';

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const supplierService = {
  // Get all suppliers
  async getAll(): Promise<Supplier[]> {
    if (API_CONFIG.USE_MOCK_DATA) {
      await delay(300);
      return mockSuppliers;
    }
    const response = await apiFetch<ApiResponse<Supplier[]>>(API_CONFIG.ENDPOINTS.SUPPLIERS);
    return response.data;
  },

  // Get supplier by ID
  async getById(id: string): Promise<Supplier | null> {
    if (API_CONFIG.USE_MOCK_DATA) {
      await delay(200);
      return mockSuppliers.find(s => s.id === id) || null;
    }
    const response = await apiFetch<ApiResponse<Supplier>>(`${API_CONFIG.ENDPOINTS.SUPPLIERS}/${id}`);
    return response.data;
  },

  // Create supplier
  async create(supplier: Omit<Supplier, 'id' | 'createdAt' | 'totalSupplied' | 'totalPaid' | 'totalOutstanding'>): Promise<Supplier> {
    if (API_CONFIG.USE_MOCK_DATA) {
      await delay(500);
      return {
        ...supplier,
        id: `sup-${Date.now()}`,
        totalSupplied: 0,
        totalPaid: 0,
        totalOutstanding: 0,
        createdAt: new Date().toISOString(),
      };
    }
    const response = await apiFetch<ApiResponse<Supplier>>(API_CONFIG.ENDPOINTS.SUPPLIERS, {
      method: 'POST',
      body: JSON.stringify(supplier),
    });
    return response.data;
  },

  // Update supplier
  async update(id: string, data: Partial<Supplier>): Promise<Supplier> {
    if (API_CONFIG.USE_MOCK_DATA) {
      await delay(400);
      const supplier = mockSuppliers.find(s => s.id === id);
      if (!supplier) throw new Error('Supplier not found');
      return { ...supplier, ...data };
    }
    const response = await apiFetch<ApiResponse<Supplier>>(`${API_CONFIG.ENDPOINTS.SUPPLIERS}/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
    return response.data;
  },

  // Delete supplier
  async delete(id: string): Promise<void> {
    if (API_CONFIG.USE_MOCK_DATA) {
      await delay(300);
      return;
    }
    await apiFetch(`${API_CONFIG.ENDPOINTS.SUPPLIERS}/${id}`, { method: 'DELETE' });
  },

  // Get all transactions
  async getTransactions(supplierId?: string): Promise<SupplierTransaction[]> {
    if (API_CONFIG.USE_MOCK_DATA) {
      await delay(300);
      return supplierId 
        ? mockTransactions.filter(t => t.supplierId === supplierId)
        : mockTransactions;
    }
    const endpoint = supplierId 
      ? `${API_CONFIG.ENDPOINTS.SUPPLIER_TRANSACTIONS}?supplierId=${supplierId}`
      : API_CONFIG.ENDPOINTS.SUPPLIER_TRANSACTIONS;
    const response = await apiFetch<ApiResponse<SupplierTransaction[]>>(endpoint);
    return response.data;
  },

  // Add supplier delivery (refill tank)
  async addDelivery(data: {
    supplierId: string;
    litersSupplied: number;
    pricePerLiter: number;
    amountPaid: number;
    paymentStatus: 'full' | 'partial' | 'outstanding';
    notes?: string;
  }): Promise<SupplierTransaction> {
    if (API_CONFIG.USE_MOCK_DATA) {
      await delay(500);
      const supplier = mockSuppliers.find(s => s.id === data.supplierId);
      return {
        id: `st-${Date.now()}`,
        supplierId: data.supplierId,
        supplierName: supplier?.name || 'Unknown Supplier',
        litersSupplied: data.litersSupplied,
        pricePerLiter: data.pricePerLiter,
        totalAmount: data.litersSupplied * data.pricePerLiter,
        amountPaid: data.amountPaid,
        outstanding: (data.litersSupplied * data.pricePerLiter) - data.amountPaid,
        paymentStatus: data.paymentStatus,
        notes: data.notes,
        createdAt: new Date().toISOString(),
      };
    }
    const response = await apiFetch<ApiResponse<SupplierTransaction>>(
      API_CONFIG.ENDPOINTS.SUPPLIER_TRANSACTIONS,
      { method: 'POST', body: JSON.stringify(data) }
    );
    return response.data;
  },
};
