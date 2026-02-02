import { DashboardStats } from '@/types';
import { products as mockProducts, sales as mockSales } from '@/data';
import { API_CONFIG, getApiUrl } from './config';

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const dashboardService = {
  // Get dashboard statistics
  async getStats(): Promise<DashboardStats> {
    if (API_CONFIG.USE_MOCK_DATA) {
      await delay(400);

      const completedSales = mockSales.filter(s => s.status === 'completed');
      const todaySales = completedSales.reduce((sum, s) => sum + s.total, 0);
      const totalOrders = completedSales.length;
      const averageOrder = todaySales / totalOrders;

      // Calculate top products from sales
      const productQuantities: Record<string, number> = {};
      completedSales.forEach(sale => {
        sale.items.forEach(item => {
          const productId = item.productId || item.bottleId || 'unknown';
          productQuantities[productId] = (productQuantities[productId] || 0) + (item.quantity || 1);
        });
      });

      const topProducts = Object.entries(productQuantities)
        .map(([productId, quantity]) => ({
          product: mockProducts.find(p => p.id === productId)!,
          quantity,
        }))
        .filter(item => item.product)
        .sort((a, b) => b.quantity - a.quantity)
        .slice(0, 5);

      const recentSales = [...completedSales]
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        .slice(0, 5);

      return {
        todaySales,
        totalOrders,
        averageOrder,
        topProducts,
        recentSales,
      };
    }

    const response = await fetch(getApiUrl(API_CONFIG.ENDPOINTS.DASHBOARD));
    return response.json();
  },

  // Get sales chart data
  async getSalesChartData(period: 'day' | 'week' | 'month' = 'week'): Promise<{
    labels: string[];
    data: number[];
  }> {
    if (API_CONFIG.USE_MOCK_DATA) {
      await delay(300);

      // Generate mock chart data
      if (period === 'day') {
        return {
          labels: ['9AM', '10AM', '11AM', '12PM', '1PM', '2PM', '3PM', '4PM', '5PM'],
          data: [45, 78, 120, 180, 95, 110, 140, 85, 65],
        };
      } else if (period === 'week') {
        return {
          labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
          data: [850, 920, 780, 1050, 1200, 1450, 680],
        };
      } else {
        return {
          labels: ['Week 1', 'Week 2', 'Week 3', 'Week 4'],
          data: [4500, 5200, 4800, 5800],
        };
      }
    }

    const response = await fetch(
      getApiUrl(`${API_CONFIG.ENDPOINTS.DASHBOARD}/chart?period=${period}`)
    );
    return response.json();
  },

  // Get category breakdown
  async getCategoryBreakdown(): Promise<{
    category: string;
    sales: number;
    percentage: number;
  }[]> {
    if (API_CONFIG.USE_MOCK_DATA) {
      await delay(300);
      return [
        { category: 'Beverages', sales: 2450, percentage: 28 },
        { category: 'Fresh Produce', sales: 1890, percentage: 22 },
        { category: 'Dairy', sales: 1540, percentage: 18 },
        { category: 'Meat & Seafood', sales: 1200, percentage: 14 },
        { category: 'Bakery', sales: 850, percentage: 10 },
        { category: 'Others', sales: 700, percentage: 8 },
      ];
    }

    const response = await fetch(
      getApiUrl(`${API_CONFIG.ENDPOINTS.DASHBOARD}/categories`)
    );
    return response.json();
  },
};
