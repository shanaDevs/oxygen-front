import { API_CONFIG, apiFetch } from './config';
import { OxygenBottle, BottleType, BottleLedgerEntry, BottleFillHistory, ApiResponse } from '@/types';

// Bottle API
export const bottleService = {
  // Get all bottles
  getAll: async (params?: { status?: string; location?: string; customerId?: string }): Promise<ApiResponse<OxygenBottle[]>> => {
    if (API_CONFIG.USE_MOCK_DATA) {
      const mockBottles: OxygenBottle[] = [
        { id: '1', serialNumber: 'BOT-001', capacityLiters: 40, status: 'filled', location: 'center', fillCount: 5, issueCount: 4 },
        { id: '2', serialNumber: 'BOT-002', capacityLiters: 40, status: 'empty', location: 'center', fillCount: 3, issueCount: 3 },
        { id: '3', serialNumber: 'BOT-003', capacityLiters: 20, status: 'with_customer', location: 'customer', customerId: 'cust-1', customerName: 'Test Customer', fillCount: 10, issueCount: 10 },
      ];
      const filtered = mockBottles.filter(b => {
        if (params?.status && b.status !== params.status) return false;
        if (params?.location && b.location !== params.location) return false;
        if (params?.customerId && b.customerId !== params.customerId) return false;
        return true;
      });
      return { success: true, data: filtered };
    }
    const queryParams = new URLSearchParams();
    if (params?.status) queryParams.append('status', params.status);
    if (params?.location) queryParams.append('location', params.location);
    if (params?.customerId) queryParams.append('customerId', params.customerId);
    return apiFetch<ApiResponse<OxygenBottle[]>>(`/bottles?${queryParams.toString()}`);
  },

  // Get bottles in center
  getInCenter: async (status?: string): Promise<ApiResponse<OxygenBottle[]>> => {
    if (API_CONFIG.USE_MOCK_DATA) {
      return bottleService.getAll({ location: 'center', status });
    }
    const queryParams = status ? `?status=${status}` : '';
    return apiFetch<ApiResponse<OxygenBottle[]>>(`/bottles/in-center${queryParams}`);
  },

  // Get filled bottles
  getFilled: async (): Promise<ApiResponse<OxygenBottle[]>> => {
    if (API_CONFIG.USE_MOCK_DATA) {
      return bottleService.getAll({ status: 'filled', location: 'center' });
    }
    return apiFetch<ApiResponse<OxygenBottle[]>>('/bottles/filled');
  },

  // Get bottle by ID
  getById: async (id: string): Promise<ApiResponse<OxygenBottle>> => {
    if (API_CONFIG.USE_MOCK_DATA) {
      return { success: true, data: { id, serialNumber: 'BOT-001', capacityLiters: 40, status: 'filled', location: 'center', fillCount: 5, issueCount: 4 } };
    }
    return apiFetch<ApiResponse<OxygenBottle>>(`/bottles/${id}`);
  },

  // Get bottle by serial number
  getBySerial: async (serial: string): Promise<ApiResponse<OxygenBottle>> => {
    if (API_CONFIG.USE_MOCK_DATA) {
      return { success: true, data: { id: 'bot-1', serialNumber: serial, capacityLiters: 40, status: 'filled', location: 'center', fillCount: 5, issueCount: 4 } };
    }
    return apiFetch<ApiResponse<OxygenBottle>>(`/bottles/serial/${serial}`);
  },

  // Receive empty bottle (returned or new)
  receiveBottle: async (data: { serialNumber?: string; bottleTypeId?: string; customerId?: string; notes?: string }): Promise<ApiResponse<OxygenBottle>> => {
    if (API_CONFIG.USE_MOCK_DATA) {
      return { success: true, data: { id: 'new-bot', serialNumber: data.serialNumber || 'MOCK-SN', capacityLiters: 40, status: 'empty', location: 'center', fillCount: 0, issueCount: 0 }, message: 'Bottle received' };
    }
    return apiFetch<ApiResponse<OxygenBottle>>('/bottles/receive', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  },

  // Receive multiple bottles (bulk)
  receiveBulk: async (data: { items: Array<{ bottleTypeId: string; count: number }>; customerId?: string; notes?: string }): Promise<ApiResponse<{ count: number }>> => {
    if (API_CONFIG.USE_MOCK_DATA) {
      return { success: true, data: { count: data.items.reduce((sum, i) => sum + i.count, 0) }, message: 'Bottles received (Mock)' };
    }
    return apiFetch<ApiResponse<{ count: number }>>('/bottles/receive-bulk', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  },

  // Create new bottle
  create: async (data: Partial<OxygenBottle>): Promise<ApiResponse<OxygenBottle>> => {
    if (API_CONFIG.USE_MOCK_DATA) {
      const newBottle: OxygenBottle = {
        id: `bot-${Date.now()}`,
        serialNumber: data.serialNumber || 'NEW-001',
        capacityLiters: data.capacityLiters || 40,
        bottleTypeId: data.bottleTypeId,
        status: 'empty',
        location: 'center',
        fillCount: 0,
        issueCount: 0,
        ownerId: data.ownerId,
        ownerName: data.ownerName
      };
      return { success: true, data: newBottle, message: 'Bottle created' };
    }
    return apiFetch<ApiResponse<OxygenBottle>>('/bottles', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  },

  // Update bottle
  update: async (id: string, data: Partial<OxygenBottle>): Promise<ApiResponse<OxygenBottle>> => {
    if (API_CONFIG.USE_MOCK_DATA) {
      return { success: true, data: { id, serialNumber: data.serialNumber || 'BOT-001', capacityLiters: data.capacityLiters || 40, status: data.status || 'empty', location: data.location || 'center', fillCount: 0, issueCount: 0 }, message: 'Bottle updated' };
    }
    return apiFetch<ApiResponse<OxygenBottle>>(`/bottles/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    });
  },

  // Fill bottles
  fillBottles: async (bottleIds: string[]): Promise<ApiResponse<OxygenBottle[]> & { tankLevel?: number; kgUsed?: number }> => {
    if (API_CONFIG.USE_MOCK_DATA) {
      const mockFilledBottles: OxygenBottle[] = bottleIds.map((id, index) => ({
        id,
        serialNumber: `BOT-${String(index + 1).padStart(3, '0')}`,
        capacityLiters: 40,
        status: 'filled' as const,
        location: 'center' as const,
        filledDate: new Date().toISOString(),
        fillCount: 1,
        issueCount: 0
      }));
      return {
        success: true,
        data: mockFilledBottles,
        message: `${bottleIds.length} bottles filled`,
        tankLevel: 8500,
        kgUsed: bottleIds.length * 8
      };
    }
    return apiFetch<ApiResponse<OxygenBottle[]> & { tankLevel?: number; kgUsed?: number }>('/bottles/fill', {
      method: 'POST',
      body: JSON.stringify({ bottleIds })
    });
  },

  // Get fill history
  getFillHistory: async (limit?: number): Promise<ApiResponse<BottleFillHistory[]>> => {
    if (API_CONFIG.USE_MOCK_DATA) {
      const mockHistory: BottleFillHistory[] = [
        { id: '1', bottleId: 'bot-1', bottleSerialNumber: 'BOT-001', serialNumber: 'BOT-001', bottleCapacity: 40, capacityLiters: 40, kgUsed: 8, litersUsed: 40, createdAt: new Date().toISOString() },
      ];
      return { success: true, data: mockHistory };
    }
    const queryParams = limit ? `?limit=${limit}` : '';
    return apiFetch<ApiResponse<BottleFillHistory[]>>(`/bottles/fill-history${queryParams}`);
  },

  // Get bottle ledger
  getBottleLedger: async (bottleId: string): Promise<ApiResponse<{ bottle: OxygenBottle; ledger: BottleLedgerEntry[] }>> => {
    if (API_CONFIG.USE_MOCK_DATA) {
      return {
        success: true,
        data: {
          bottle: { id: bottleId, serialNumber: 'BOT-001', capacityLiters: 40, status: 'filled', location: 'center', fillCount: 5, issueCount: 4 },
          ledger: []
        }
      };
    }
    return apiFetch<ApiResponse<{ bottle: OxygenBottle; ledger: BottleLedgerEntry[] }>>(`/bottles/${bottleId}/ledger`);
  },

  // Get all ledger entries
  getLedgerEntries: async (params?: { bottleId?: string; customerId?: string; operationType?: string; limit?: number }): Promise<ApiResponse<BottleLedgerEntry[]>> => {
    if (API_CONFIG.USE_MOCK_DATA) {
      return { success: true, data: [] };
    }
    const queryParams = new URLSearchParams();
    if (params?.bottleId) queryParams.append('bottleId', params.bottleId);
    if (params?.customerId) queryParams.append('customerId', params.customerId);
    if (params?.operationType) queryParams.append('operationType', params.operationType);
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    return apiFetch<ApiResponse<BottleLedgerEntry[]>>(`/bottles/ledger?${queryParams.toString()}`);
  },

  // Get customer bottle ledger
  getCustomerBottleLedger: async (customerId: string): Promise<ApiResponse<{ customer: { id: string; name: string; phone?: string; bottlesInHand: number; ownedBottles: number; totalCredit: number }; currentBottles: OxygenBottle[]; ledger: BottleLedgerEntry[] }>> => {
    if (API_CONFIG.USE_MOCK_DATA) {
      return {
        success: true,
        data: {
          customer: { id: customerId, name: 'Test Customer', bottlesInHand: 2, ownedBottles: 0, totalCredit: 0 },
          currentBottles: [],
          ledger: []
        }
      };
    }
    return apiFetch<ApiResponse<{ customer: { id: string; name: string; phone?: string; bottlesInHand: number; ownedBottles: number; totalCredit: number }; currentBottles: OxygenBottle[]; ledger: BottleLedgerEntry[] }>>(`/bottles/ledger/customer/${customerId}`);
  },

  // Get ledger summary
  getLedgerSummary: async (params?: { startDate?: string; endDate?: string }): Promise<ApiResponse<{ operationCounts: Record<string, number>; totalKgUsed: number; totalAmount: number; recentEntries: BottleLedgerEntry[] }>> => {
    if (API_CONFIG.USE_MOCK_DATA) {
      return { success: true, data: { operationCounts: {}, totalKgUsed: 0, totalAmount: 0, recentEntries: [] } };
    }
    const queryParams = new URLSearchParams();
    if (params?.startDate) queryParams.append('startDate', params.startDate);
    if (params?.endDate) queryParams.append('endDate', params.endDate);
    return apiFetch<ApiResponse<{ operationCounts: Record<string, number>; totalKgUsed: number; totalAmount: number; recentEntries: BottleLedgerEntry[] }>>(`/bottles/ledger/summary?${queryParams.toString()}`);
  }
};

// Bottle Types API
export const bottleTypeService = {
  // Get all bottle types
  getAll: async (active?: boolean): Promise<ApiResponse<BottleType[]>> => {
    if (API_CONFIG.USE_MOCK_DATA) {
      const mockTypes: BottleType[] = [
        { id: 'type-1', name: '10L Cylinder', capacityLiters: 10, refillKg: 2, pricePerFill: 200, depositAmount: 500, isActive: true },
        { id: 'type-2', name: '20L Cylinder', capacityLiters: 20, refillKg: 4, pricePerFill: 350, depositAmount: 750, isActive: true },
        { id: 'type-3', name: '40L Cylinder', capacityLiters: 40, refillKg: 8, pricePerFill: 600, depositAmount: 1000, isActive: true },
      ];
      return { success: true, data: active !== undefined ? mockTypes.filter(t => t.isActive === active) : mockTypes };
    }
    const queryParams = active !== undefined ? `?active=${active}` : '';
    return apiFetch<ApiResponse<BottleType[]>>(`/bottles/types${queryParams}`);
  },

  // Get bottle type by ID
  getById: async (id: string): Promise<ApiResponse<BottleType>> => {
    if (API_CONFIG.USE_MOCK_DATA) {
      return { success: true, data: { id, name: '40L Cylinder', capacityLiters: 40, refillKg: 8, pricePerFill: 600, depositAmount: 1000, isActive: true } };
    }
    return apiFetch<ApiResponse<BottleType>>(`/bottles/types/${id}`);
  },

  // Create bottle type
  create: async (data: Omit<BottleType, 'id'>): Promise<ApiResponse<BottleType>> => {
    if (API_CONFIG.USE_MOCK_DATA) {
      const newType: BottleType = { id: `type-${Date.now()}`, ...data };
      return { success: true, data: newType, message: 'Bottle type created' };
    }
    return apiFetch<ApiResponse<BottleType>>('/bottles/types', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  },

  // Update bottle type
  update: async (id: string, data: Partial<BottleType>): Promise<ApiResponse<BottleType>> => {
    if (API_CONFIG.USE_MOCK_DATA) {
      return { success: true, data: { id, name: data.name || '40L Cylinder', capacityLiters: data.capacityLiters || 40, refillKg: data.refillKg || 8, pricePerFill: data.pricePerFill || 600, depositAmount: data.depositAmount || 1000, isActive: data.isActive ?? true }, message: 'Bottle type updated' };
    }
    return apiFetch<ApiResponse<BottleType>>(`/bottles/types/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    });
  },

  // Delete bottle type
  delete: async (id: string): Promise<ApiResponse<null>> => {
    if (API_CONFIG.USE_MOCK_DATA) {
      return { success: true, data: null, message: 'Bottle type deleted' };
    }
    return apiFetch<ApiResponse<null>>(`/bottles/types/${id}`, {
      method: 'DELETE'
    });
  }
};
