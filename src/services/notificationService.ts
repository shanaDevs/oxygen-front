import { API_CONFIG, apiFetch } from './config';
import { Notification, ApiResponse } from '@/types';

export interface NotificationSummary {
    totalUnread: number;
    criticalCount: number;
    byType: Record<string, number>;
    byPriority: Record<string, number>;
}

export const notificationService = {
    // Get all notifications
    getAll: async (params?: { type?: string; priority?: string; isRead?: boolean; limit?: number }): Promise<ApiResponse<Notification[]>> => {
        if (API_CONFIG.USE_MOCK_DATA) {
            const mockNotifications: Notification[] = [
                {
                    id: 'notif-1',
                    type: 'tank_low',
                    title: 'Low Tank Level',
                    message: 'Tank level is below 20%',
                    priority: 'high',
                    entityType: 'tank',
                    entityId: 'tank-1',
                    isRead: false,
                    createdAt: new Date().toISOString()
                }
            ];
            return { success: true, data: mockNotifications };
        }

        const queryParams = new URLSearchParams();
        if (params?.type) queryParams.append('type', params.type);
        if (params?.priority) queryParams.append('priority', params.priority);
        if (params?.isRead !== undefined) queryParams.append('isRead', params.isRead.toString());
        if (params?.limit) queryParams.append('limit', params.limit.toString());

        return apiFetch<ApiResponse<Notification[]>>(`/notifications?${queryParams.toString()}`);
    },

    // Get unread notifications
    getUnread: async (limit?: number): Promise<ApiResponse<{ notifications: Notification[]; unreadCount: number }>> => {
        if (API_CONFIG.USE_MOCK_DATA) {
            return { success: true, data: { notifications: [], unreadCount: 0 } };
        }
        try {
            const queryParams = limit ? `?limit=${limit}` : '';
            return await apiFetch<ApiResponse<{ notifications: Notification[]; unreadCount: number }>>(`/notifications/unread${queryParams}`);
        } catch (error) {
            // Return empty data if API unavailable
            console.warn('Notifications API unavailable');
            return { success: true, data: { notifications: [], unreadCount: 0 } };
        }
    },

    // Get notification by ID
    getById: async (id: string): Promise<ApiResponse<Notification>> => {
        if (API_CONFIG.USE_MOCK_DATA) {
            return {
                success: true,
                data: {
                    id,
                    type: 'system',
                    title: 'Test Notification',
                    message: 'This is a test notification',
                    priority: 'medium',
                    isRead: false,
                    createdAt: new Date().toISOString()
                }
            };
        }
        return apiFetch<ApiResponse<Notification>>(`/notifications/${id}`);
    },

    // Create notification
    create: async (data: Omit<Notification, 'id' | 'isRead' | 'readAt' | 'createdAt'>): Promise<ApiResponse<Notification>> => {
        if (API_CONFIG.USE_MOCK_DATA) {
            const newNotif: Notification = {
                id: `notif-${Date.now()}`,
                ...data,
                isRead: false,
                createdAt: new Date().toISOString()
            };
            return { success: true, data: newNotif, message: 'Notification created' };
        }
        return apiFetch<ApiResponse<Notification>>('/notifications', {
            method: 'POST',
            body: JSON.stringify(data)
        });
    },

    // Mark notification as read
    markAsRead: async (id: string): Promise<ApiResponse<Notification>> => {
        if (API_CONFIG.USE_MOCK_DATA) {
            return notificationService.getById(id);
        }
        return apiFetch<ApiResponse<Notification>>(`/notifications/${id}/read`, {
            method: 'POST'
        });
    },

    // Mark all notifications as read
    markAllAsRead: async (type?: string): Promise<ApiResponse<{ message: string }>> => {
        if (API_CONFIG.USE_MOCK_DATA) {
            return { success: true, data: { message: 'All notifications marked as read' } };
        }
        const queryParams = type ? `?type=${type}` : '';
        return apiFetch<ApiResponse<{ message: string }>>(`/notifications/mark-all-read${queryParams}`, {
            method: 'POST'
        });
    },

    // Delete notification
    delete: async (id: string): Promise<ApiResponse<{ message: string }>> => {
        if (API_CONFIG.USE_MOCK_DATA) {
            return { success: true, data: { message: 'Notification deleted' } };
        }
        return apiFetch<ApiResponse<{ message: string }>>(`/notifications/${id}`, {
            method: 'DELETE'
        });
    },

    // Clear old notifications
    clearOld: async (days?: number): Promise<ApiResponse<{ message: string }>> => {
        if (API_CONFIG.USE_MOCK_DATA) {
            return { success: true, data: { message: 'Old notifications cleared' } };
        }
        const queryParams = days ? `?days=${days}` : '';
        return apiFetch<ApiResponse<{ message: string }>>(`/notifications/clear-old${queryParams}`, {
            method: 'DELETE'
        });
    },

    // Get notification summary
    getSummary: async (): Promise<ApiResponse<NotificationSummary>> => {
        if (API_CONFIG.USE_MOCK_DATA) {
            return {
                success: true,
                data: {
                    totalUnread: 0,
                    criticalCount: 0,
                    byType: {},
                    byPriority: {}
                }
            };
        }
        return apiFetch<ApiResponse<NotificationSummary>>('/notifications/summary');
    }
};
