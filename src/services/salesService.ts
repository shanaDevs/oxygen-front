import { API_CONFIG, apiFetch } from './config';
import { Sale, SalesStatistics, ApiResponse } from '@/types';

export interface CreateSaleInput {
    customerId: string;
    bottleIds?: string[];
    items?: Array<{
        bottleId?: string;
        serialNumber?: string;
        bottleTypeId?: string;
        bottleTypeName?: string;
        capacityLiters?: number;
        refillKg?: number;
        price?: number;
        quantity?: number;
        unitPrice?: number;
        total?: number;
    }>;
    taxPercentage?: number;
    discountPercentage?: number;
    discount?: number;
    paymentMethod?: 'cash' | 'credit' | 'partial';
    amountPaid?: number;
    notes?: string;
    userId?: string;
    userName?: string;
    returnedBottles?: Array<{
        serialNumber: string;
        bottleTypeId?: string;
        notes?: string;
    }>;
}

export interface AddPaymentInput {
    amount: number;
    paymentMethod?: 'cash' | 'bank_transfer' | 'cheque' | 'other';
    reference?: string;
    notes?: string;
    receivedBy?: string;
}

export const salesService = {
    // Get all sales
    getAll: async (params?: {
        status?: string;
        paymentStatus?: string;
        customerId?: string;
        startDate?: string;
        endDate?: string;
        limit?: number
    }): Promise<ApiResponse<Sale[]>> => {
        if (API_CONFIG.USE_MOCK_DATA) {
            const mockSales: Sale[] = [
                {
                    id: 'sale-1',
                    invoiceNumber: 'INV-20260201-0001',
                    customerId: 'cust-1',
                    customerName: 'Test Customer',
                    items: [],
                    bottleCount: 2,
                    subtotal: 1200,
                    tax: 0,
                    taxPercentage: 0,
                    discount: 0,
                    discountPercentage: 0,
                    total: 1200,
                    paymentMethod: 'cash',
                    amountPaid: 1200,
                    creditAmount: 0,
                    changeAmount: 0,
                    status: 'completed',
                    paymentStatus: 'full',
                    saleDate: new Date().toISOString(),
                    createdAt: new Date().toISOString()
                }
            ];
            return { success: true, data: mockSales };
        }

        const queryParams = new URLSearchParams();
        if (params?.status) queryParams.append('status', params.status);
        if (params?.paymentStatus) queryParams.append('paymentStatus', params.paymentStatus);
        if (params?.customerId) queryParams.append('customerId', params.customerId);
        if (params?.startDate) queryParams.append('startDate', params.startDate);
        if (params?.endDate) queryParams.append('endDate', params.endDate);
        if (params?.limit) queryParams.append('limit', params.limit.toString());

        return apiFetch<ApiResponse<Sale[]>>(`/sales?${queryParams.toString()}`);
    },

    // Get sale by ID
    getById: async (id: string): Promise<ApiResponse<Sale>> => {
        if (API_CONFIG.USE_MOCK_DATA) {
            return {
                success: true,
                data: {
                    id,
                    invoiceNumber: 'INV-20260201-0001',
                    customerId: 'cust-1',
                    customerName: 'Test Customer',
                    items: [],
                    bottleCount: 2,
                    subtotal: 1200,
                    tax: 0,
                    taxPercentage: 0,
                    discount: 0,
                    discountPercentage: 0,
                    total: 1200,
                    paymentMethod: 'cash',
                    amountPaid: 1200,
                    creditAmount: 0,
                    changeAmount: 0,
                    status: 'completed',
                    paymentStatus: 'full',
                    saleDate: new Date().toISOString(),
                    createdAt: new Date().toISOString()
                }
            };
        }
        return apiFetch<ApiResponse<Sale>>(`/sales/${id}`);
    },

    // Get sale by invoice number
    getByInvoice: async (invoiceNumber: string): Promise<ApiResponse<Sale>> => {
        if (API_CONFIG.USE_MOCK_DATA) {
            return salesService.getById('mock-id');
        }
        return apiFetch<ApiResponse<Sale>>(`/sales/invoice/${invoiceNumber}`);
    },

    // Create a new sale (POS transaction)
    create: async (data: CreateSaleInput): Promise<ApiResponse<Sale>> => {
        if (API_CONFIG.USE_MOCK_DATA) {
            const mockSale: Sale = {
                id: `sale-${Date.now()}`,
                invoiceNumber: `INV-${new Date().toISOString().substring(0, 10).replace(/-/g, '')}-0001`,
                customerId: data.customerId,
                customerName: 'Test Customer',
                items: (data.items || []).map(item => ({ ...item, quantity: item.quantity || 1 })),
                bottleCount: data.items?.length || data.bottleIds?.length || 0,
                subtotal: data.items?.reduce((sum, i) => sum + (i.price || 0), 0) || 0,
                tax: 0,
                taxPercentage: data.taxPercentage || 0,
                discount: data.discount || 0,
                discountPercentage: data.discountPercentage || 0,
                total: data.items?.reduce((sum, i) => sum + (i.price || 0), 0) || 0,
                paymentMethod: data.paymentMethod || 'cash',
                amountPaid: data.amountPaid || 0,
                creditAmount: 0,
                changeAmount: 0,
                status: 'completed',
                paymentStatus: 'full',
                saleDate: new Date().toISOString(),
                createdAt: new Date().toISOString()
            };
            return { success: true, data: mockSale, message: 'Sale completed' };
        }
        return apiFetch<ApiResponse<Sale>>('/sales', {
            method: 'POST',
            body: JSON.stringify(data)
        });
    },

    // Add payment to existing sale (for outstanding)
    addPayment: async (saleId: string, data: AddPaymentInput): Promise<ApiResponse<Sale>> => {
        if (API_CONFIG.USE_MOCK_DATA) {
            return salesService.getById(saleId);
        }
        return apiFetch<ApiResponse<Sale>>(`/sales/${saleId}/payment`, {
            method: 'POST',
            body: JSON.stringify(data)
        });
    },

    // Get customer outstanding sales
    getCustomerOutstanding: async (customerId: string): Promise<ApiResponse<{ customer: { id: string; name: string; phone?: string; totalCredit: number }; sales: Sale[]; totalOutstanding: number }>> => {
        if (API_CONFIG.USE_MOCK_DATA) {
            return {
                success: true,
                data: {
                    customer: { id: customerId, name: 'Test Customer', totalCredit: 0 },
                    sales: [],
                    totalOutstanding: 0
                }
            };
        }
        return apiFetch<ApiResponse<{ customer: { id: string; name: string; phone?: string; totalCredit: number }; sales: Sale[]; totalOutstanding: number }>>(`/sales/outstanding/customer/${customerId}`);
    },

    // Get all outstanding sales
    getAllOutstanding: async (limit?: number): Promise<ApiResponse<{ sales: Sale[]; totalOutstanding: number; count: number }>> => {
        if (API_CONFIG.USE_MOCK_DATA) {
            return { success: true, data: { sales: [], totalOutstanding: 0, count: 0 } };
        }
        const queryParams = limit ? `?limit=${limit}` : '';
        return apiFetch<ApiResponse<{ sales: Sale[]; totalOutstanding: number; count: number }>>(`/sales/outstanding${queryParams}`);
    },

    // Cancel sale
    cancel: async (id: string, reason?: string): Promise<ApiResponse<Sale>> => {
        if (API_CONFIG.USE_MOCK_DATA) {
            return salesService.getById(id);
        }
        return apiFetch<ApiResponse<Sale>>(`/sales/${id}/cancel`, {
            method: 'POST',
            body: JSON.stringify({ reason })
        });
    },

    // Get sales statistics
    getStatistics: async (params?: { startDate?: string; endDate?: string }): Promise<ApiResponse<SalesStatistics>> => {
        if (API_CONFIG.USE_MOCK_DATA) {
            return {
                success: true,
                data: {
                    overall: {
                        totalSales: 150,
                        totalBottles: 450,
                        totalRevenue: 270000,
                        totalCollected: 250000,
                        totalOutstanding: 20000
                    },
                    today: {
                        totalSales: 10,
                        totalBottles: 30,
                        totalRevenue: 18000,
                        totalCollected: 18000
                    }
                }
            };
        }
        const queryParams = new URLSearchParams();
        if (params?.startDate) queryParams.append('startDate', params.startDate);
        if (params?.endDate) queryParams.append('endDate', params.endDate);
        return apiFetch<ApiResponse<SalesStatistics>>(`/sales/statistics?${queryParams.toString()}`);
    }
};
