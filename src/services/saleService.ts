import { Sale, SaleItem, ApiResponse, PaginatedResponse } from '@/types';
import { sales as mockSales } from '@/data';
import { API_CONFIG, getApiUrl } from './config';

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const saleService = {
  // Get all sales
  async getAll(): Promise<Sale[]> {
    if (API_CONFIG.USE_MOCK_DATA) {
      await delay(300);
      return mockSales;
    }

    const response = await fetch(getApiUrl(API_CONFIG.ENDPOINTS.SALES));
    const data: ApiResponse<Sale[]> = await response.json();
    return data.data;
  },

  // Get sales with pagination
  async getPaginated(page: number = 1, limit: number = 10): Promise<PaginatedResponse<Sale>> {
    if (API_CONFIG.USE_MOCK_DATA) {
      await delay(300);
      const sortedSales = [...mockSales].sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
      const start = (page - 1) * limit;
      const paginatedSales = sortedSales.slice(start, start + limit);
      return {
        data: paginatedSales,
        total: mockSales.length,
        page,
        limit,
        totalPages: Math.ceil(mockSales.length / limit),
      };
    }

    const response = await fetch(
      getApiUrl(`${API_CONFIG.ENDPOINTS.SALES}?page=${page}&limit=${limit}`)
    );
    return response.json();
  },

  // Get sale by ID
  async getById(id: string): Promise<Sale | null> {
    if (API_CONFIG.USE_MOCK_DATA) {
      await delay(200);
      return mockSales.find(s => s.id === id) || null;
    }

    const response = await fetch(getApiUrl(`${API_CONFIG.ENDPOINTS.SALES}/${id}`));
    const data: ApiResponse<Sale> = await response.json();
    return data.data;
  },

  // Get today's sales
  async getTodaySales(): Promise<Sale[]> {
    if (API_CONFIG.USE_MOCK_DATA) {
      await delay(300);
      const today = new Date().toISOString().split('T')[0];
      return mockSales.filter(s => s.createdAt.startsWith(today));
    }

    const response = await fetch(getApiUrl(`${API_CONFIG.ENDPOINTS.SALES}/today`));
    const data: ApiResponse<Sale[]> = await response.json();
    return data.data;
  },

  // Get sales by date range
  async getByDateRange(startDate: string, endDate: string): Promise<Sale[]> {
    if (API_CONFIG.USE_MOCK_DATA) {
      await delay(300);
      const start = new Date(startDate).getTime();
      const end = new Date(endDate).getTime();
      return mockSales.filter(s => {
        const saleDate = new Date(s.createdAt).getTime();
        return saleDate >= start && saleDate <= end;
      });
    }

    const response = await fetch(
      getApiUrl(`${API_CONFIG.ENDPOINTS.SALES}?startDate=${startDate}&endDate=${endDate}`)
    );
    const data: ApiResponse<Sale[]> = await response.json();
    return data.data;
  },

  // Create new sale
  async create(items: SaleItem[], paymentMethod: Sale['paymentMethod'], discount: number = 0): Promise<Sale> {
    if (API_CONFIG.USE_MOCK_DATA) {
      await delay(500);
      const subtotal = items.reduce((sum, item) => {
        const itemTotal = item.total || (item.price || 0) * (item.quantity || 1);
        return sum + itemTotal;
      }, 0);
      const tax = subtotal * 0.1; // 10% tax
      const newSale: Sale = {
        id: `sale-${Date.now()}`,
        items,
        subtotal,
        tax,
        discount,
        total: subtotal + tax - discount,
        paymentMethod,
        status: 'completed',
        userId: 'user-003', // Current user
        createdAt: new Date().toISOString(),
      };
      return newSale;
    }

    const response = await fetch(getApiUrl(API_CONFIG.ENDPOINTS.SALES), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ items, paymentMethod, discount }),
    });
    const data: ApiResponse<Sale> = await response.json();
    return data.data;
  },

  // Cancel/void sale
  async cancel(id: string): Promise<Sale> {
    if (API_CONFIG.USE_MOCK_DATA) {
      await delay(400);
      const sale = mockSales.find(s => s.id === id);
      if (!sale) throw new Error('Sale not found');
      return { ...sale, status: 'cancelled' };
    }

    const response = await fetch(getApiUrl(`${API_CONFIG.ENDPOINTS.SALES}/${id}/cancel`), {
      method: 'POST',
    });
    const data: ApiResponse<Sale> = await response.json();
    return data.data;
  },

  // Get sales statistics
  async getStats(): Promise<{
    todayTotal: number;
    todayCount: number;
    weekTotal: number;
    monthTotal: number;
  }> {
    if (API_CONFIG.USE_MOCK_DATA) {
      await delay(300);
      const completedSales = mockSales.filter(s => s.status === 'completed');
      const todayTotal = completedSales.reduce((sum, s) => sum + s.total, 0);
      return {
        todayTotal,
        todayCount: completedSales.length,
        weekTotal: todayTotal * 5, // Simulated
        monthTotal: todayTotal * 22, // Simulated
      };
    }

    const response = await fetch(getApiUrl(`${API_CONFIG.ENDPOINTS.SALES}/stats`));
    return response.json();
  },
};
