import { OxygenBottle, BottleType, ApiResponse, BottleFillHistory } from '@/types';
import { oxygenBottles as mockBottles, bottleTypes as mockTypes } from '@/data';
import { API_CONFIG, apiFetch } from './config';

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const bottleService = {
  // Get all bottles
  async getAll(): Promise<OxygenBottle[]> {
    if (API_CONFIG.USE_MOCK_DATA) {
      await delay(300);
      return mockBottles;
    }
    const response = await apiFetch<ApiResponse<OxygenBottle[]>>(API_CONFIG.ENDPOINTS.BOTTLES);
    return response.data;
  },

  // Get bottles by status
  async getByStatus(status: 'empty' | 'filled' | 'with_customer'): Promise<OxygenBottle[]> {
    if (API_CONFIG.USE_MOCK_DATA) {
      await delay(300);
      return mockBottles.filter(b => b.status === status);
    }
    const response = await apiFetch<ApiResponse<OxygenBottle[]>>(
      `${API_CONFIG.ENDPOINTS.BOTTLES}?status=${status}`
    );
    return response.data;
  },

  // Get bottle by ID
  async getById(id: string): Promise<OxygenBottle | null> {
    if (API_CONFIG.USE_MOCK_DATA) {
      await delay(200);
      return mockBottles.find(b => b.id === id) || null;
    }
    const response = await apiFetch<ApiResponse<OxygenBottle>>(`${API_CONFIG.ENDPOINTS.BOTTLES}/${id}`);
    return response.data;
  },

  // Create bottle
  async create(bottle: { serialNumber: string; capacityLiters: number }): Promise<OxygenBottle> {
    if (API_CONFIG.USE_MOCK_DATA) {
      await delay(500);
      return {
        id: `bot-${Date.now()}`,
        serialNumber: bottle.serialNumber,
        capacityLiters: bottle.capacityLiters,
        status: 'empty',
      };
    }
    const response = await apiFetch<ApiResponse<OxygenBottle>>(API_CONFIG.ENDPOINTS.BOTTLES, {
      method: 'POST',
      body: JSON.stringify(bottle),
    });
    return response.data;
  },

  // Update bottle
  async update(id: string, data: Partial<OxygenBottle>): Promise<OxygenBottle> {
    if (API_CONFIG.USE_MOCK_DATA) {
      await delay(400);
      const bottle = mockBottles.find(b => b.id === id);
      if (!bottle) throw new Error('Bottle not found');
      return { ...bottle, ...data };
    }
    const response = await apiFetch<ApiResponse<OxygenBottle>>(`${API_CONFIG.ENDPOINTS.BOTTLES}/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
    return response.data;
  },

  // Fill multiple bottles (from tank)
  async fillBottles(bottleIds: string[]): Promise<OxygenBottle[]> {
    if (API_CONFIG.USE_MOCK_DATA) {
      await delay(500);
      return mockBottles
        .filter(b => bottleIds.includes(b.id))
        .map(b => ({ ...b, status: 'filled' as const, filledDate: new Date().toISOString() }));
    }
    const response = await apiFetch<ApiResponse<OxygenBottle[]>>(
      `${API_CONFIG.ENDPOINTS.BOTTLES}/fill`,
      { method: 'POST', body: JSON.stringify({ bottleIds }) }
    );
    return response.data;
  },

  // Delete bottle
  async delete(id: string): Promise<void> {
    if (API_CONFIG.USE_MOCK_DATA) {
      await delay(300);
      return;
    }
    await apiFetch(`${API_CONFIG.ENDPOINTS.BOTTLES}/${id}`, { method: 'DELETE' });
  },

  // Get all bottle types
  async getTypes(): Promise<BottleType[]> {
    if (API_CONFIG.USE_MOCK_DATA) {
      await delay(200);
      return mockTypes;
    }
    const response = await apiFetch<ApiResponse<BottleType[]>>(API_CONFIG.ENDPOINTS.BOTTLE_TYPES);
    return response.data;
  },

  // Create bottle type
  async createType(type: Omit<BottleType, 'id'>): Promise<BottleType> {
    if (API_CONFIG.USE_MOCK_DATA) {
      await delay(500);
      return {
        id: `bt-${Date.now()}`,
        ...type,
      };
    }
    const response = await apiFetch<ApiResponse<BottleType>>(API_CONFIG.ENDPOINTS.BOTTLE_TYPES, {
      method: 'POST',
      body: JSON.stringify(type),
    });
    return response.data;
  },

  // Update bottle type
  async updateType(id: string, data: Partial<BottleType>): Promise<BottleType> {
    if (API_CONFIG.USE_MOCK_DATA) {
      await delay(400);
      const type = mockTypes.find(t => t.id === id);
      if (!type) throw new Error('Bottle type not found');
      return { ...type, ...data };
    }
    const response = await apiFetch<ApiResponse<BottleType>>(`${API_CONFIG.ENDPOINTS.BOTTLE_TYPES}/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
    return response.data;
  },

  // Get bottle fill history
  async getFillHistory(limit?: number): Promise<BottleFillHistory[]> {
    if (API_CONFIG.USE_MOCK_DATA) {
      await delay(300);
      // Generate mock fill history
      const mockHistory: BottleFillHistory[] = mockBottles
        .filter(b => b.filledDate)
        .map(b => ({
          id: `bfh-${b.id}`,
          bottleId: b.id,
          bottleSerialNumber: b.serialNumber,
          bottleCapacity: b.capacityLiters,
          litersUsed: b.capacityLiters,
          createdAt: b.filledDate || new Date().toISOString(),
        }))
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      return limit ? mockHistory.slice(0, limit) : mockHistory;
    }
    const url = limit 
      ? `${API_CONFIG.ENDPOINTS.BOTTLE_FILL_HISTORY}?limit=${limit}` 
      : API_CONFIG.ENDPOINTS.BOTTLE_FILL_HISTORY;
    const response = await apiFetch<ApiResponse<BottleFillHistory[]>>(url);
    return response.data;
  },
};
