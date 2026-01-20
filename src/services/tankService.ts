import { MainTank, SupplierTransaction, ApiResponse, TankFillHistory } from '@/types';
import { mainTank as mockTank, suppliers as mockSuppliers } from '@/data';
import { API_CONFIG, apiFetch } from './config';

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const tankService = {
  // Get tank status
  async getStatus(): Promise<MainTank> {
    if (API_CONFIG.USE_MOCK_DATA) {
      await delay(200);
      return mockTank;
    }
    const response = await apiFetch<ApiResponse<MainTank>>(API_CONFIG.ENDPOINTS.TANK);
    return response.data;
  },

  // Update tank level directly
  async updateLevel(currentLevelLiters: number): Promise<MainTank> {
    if (API_CONFIG.USE_MOCK_DATA) {
      await delay(400);
      return { ...mockTank, currentLevelLiters };
    }
    const response = await apiFetch<ApiResponse<MainTank>>(API_CONFIG.ENDPOINTS.TANK, {
      method: 'PUT',
      body: JSON.stringify({ currentLevelLiters }),
    });
    return response.data;
  },

  // Refill tank from supplier
  async refill(data: {
    supplierId: string;
    litersSupplied: number;
    pricePerLiter: number;
    amountPaid: number;
    paymentStatus: 'full' | 'partial' | 'outstanding';
    notes?: string;
  }): Promise<{ tank: MainTank; transaction: SupplierTransaction }> {
    if (API_CONFIG.USE_MOCK_DATA) {
      await delay(500);
      const supplier = mockSuppliers.find(s => s.id === data.supplierId);
      const newLevel = mockTank.currentLevelLiters + data.litersSupplied;
      
      return {
        tank: {
          ...mockTank,
          currentLevelLiters: newLevel,
          lastRefillDate: new Date().toISOString(),
          lastRefillAmount: data.litersSupplied,
        },
        transaction: {
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
        },
      };
    }
    const response = await apiFetch<ApiResponse<{ tank: MainTank; transaction: SupplierTransaction }>>(
      `${API_CONFIG.ENDPOINTS.TANK}/refill`,
      { method: 'POST', body: JSON.stringify(data) }
    );
    return response.data;
  },

  // Get tank fill history
  async getFillHistory(limit?: number): Promise<TankFillHistory[]> {
    if (API_CONFIG.USE_MOCK_DATA) {
      await delay(300);
      // Generate mock fill history from mock tank data
      const mockHistory: TankFillHistory[] = [
        {
          id: 'tfh-1',
          supplierId: mockSuppliers[0]?.id || 's-1',
          supplierName: mockSuppliers[0]?.name || 'Sri Lanka Oxygen Ltd',
          litersAdded: mockTank.lastRefillAmount,
          previousLevel: mockTank.currentLevelLiters - mockTank.lastRefillAmount,
          newLevel: mockTank.currentLevelLiters,
          pricePerLiter: 5,
          totalAmount: mockTank.lastRefillAmount * 5,
          amountPaid: mockTank.lastRefillAmount * 5,
          outstanding: 0,
          paymentStatus: 'full',
          createdAt: mockTank.lastRefillDate,
        },
      ];
      return limit ? mockHistory.slice(0, limit) : mockHistory;
    }
    const url = limit 
      ? `${API_CONFIG.ENDPOINTS.TANK_FILL_HISTORY}?limit=${limit}` 
      : API_CONFIG.ENDPOINTS.TANK_FILL_HISTORY;
    const response = await apiFetch<ApiResponse<TankFillHistory[]>>(url);
    return response.data;
  },
};
