import { Product, ApiResponse, PaginatedResponse } from '@/types';
import { products as mockProducts } from '@/data';
import { API_CONFIG, getApiUrl } from './config';

// Simulate API delay for realistic behavior
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const productService = {
  // Get all products
  async getAll(): Promise<Product[]> {
    if (API_CONFIG.USE_MOCK_DATA) {
      await delay(300);
      return mockProducts;
    }
    
    const response = await fetch(getApiUrl(API_CONFIG.ENDPOINTS.PRODUCTS));
    const data: ApiResponse<Product[]> = await response.json();
    return data.data;
  },

  // Get products with pagination
  async getPaginated(page: number = 1, limit: number = 10): Promise<PaginatedResponse<Product>> {
    if (API_CONFIG.USE_MOCK_DATA) {
      await delay(300);
      const start = (page - 1) * limit;
      const paginatedProducts = mockProducts.slice(start, start + limit);
      return {
        data: paginatedProducts,
        total: mockProducts.length,
        page,
        limit,
        totalPages: Math.ceil(mockProducts.length / limit),
      };
    }
    
    const response = await fetch(
      getApiUrl(`${API_CONFIG.ENDPOINTS.PRODUCTS}?page=${page}&limit=${limit}`)
    );
    return response.json();
  },

  // Get product by ID
  async getById(id: string): Promise<Product | null> {
    if (API_CONFIG.USE_MOCK_DATA) {
      await delay(200);
      return mockProducts.find(p => p.id === id) || null;
    }
    
    const response = await fetch(getApiUrl(`${API_CONFIG.ENDPOINTS.PRODUCTS}/${id}`));
    const data: ApiResponse<Product> = await response.json();
    return data.data;
  },

  // Get products by category
  async getByCategory(categoryId: string): Promise<Product[]> {
    if (API_CONFIG.USE_MOCK_DATA) {
      await delay(300);
      return mockProducts.filter(p => p.categoryId === categoryId);
    }
    
    const response = await fetch(
      getApiUrl(`${API_CONFIG.ENDPOINTS.PRODUCTS}?categoryId=${categoryId}`)
    );
    const data: ApiResponse<Product[]> = await response.json();
    return data.data;
  },

  // Search products
  async search(query: string): Promise<Product[]> {
    if (API_CONFIG.USE_MOCK_DATA) {
      await delay(300);
      const lowerQuery = query.toLowerCase();
      return mockProducts.filter(
        p =>
          p.name.toLowerCase().includes(lowerQuery) ||
          p.sku.toLowerCase().includes(lowerQuery) ||
          p.description.toLowerCase().includes(lowerQuery)
      );
    }
    
    const response = await fetch(
      getApiUrl(`${API_CONFIG.ENDPOINTS.PRODUCTS}/search?q=${encodeURIComponent(query)}`)
    );
    const data: ApiResponse<Product[]> = await response.json();
    return data.data;
  },

  // Create product
  async create(product: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>): Promise<Product> {
    if (API_CONFIG.USE_MOCK_DATA) {
      await delay(500);
      const newProduct: Product = {
        ...product,
        id: `prod-${Date.now()}`,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      // In real app, this would update the mock data
      return newProduct;
    }
    
    const response = await fetch(getApiUrl(API_CONFIG.ENDPOINTS.PRODUCTS), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(product),
    });
    const data: ApiResponse<Product> = await response.json();
    return data.data;
  },

  // Update product
  async update(id: string, updates: Partial<Product>): Promise<Product> {
    if (API_CONFIG.USE_MOCK_DATA) {
      await delay(500);
      const product = mockProducts.find(p => p.id === id);
      if (!product) throw new Error('Product not found');
      return { ...product, ...updates, updatedAt: new Date().toISOString() };
    }
    
    const response = await fetch(getApiUrl(`${API_CONFIG.ENDPOINTS.PRODUCTS}/${id}`), {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    });
    const data: ApiResponse<Product> = await response.json();
    return data.data;
  },

  // Delete product
  async delete(id: string): Promise<boolean> {
    if (API_CONFIG.USE_MOCK_DATA) {
      await delay(500);
      return true;
    }
    
    const response = await fetch(getApiUrl(`${API_CONFIG.ENDPOINTS.PRODUCTS}/${id}`), {
      method: 'DELETE',
    });
    return response.ok;
  },

  // Get low stock products
  async getLowStock(threshold: number = 20): Promise<Product[]> {
    if (API_CONFIG.USE_MOCK_DATA) {
      await delay(300);
      return mockProducts.filter(p => p.stock <= threshold);
    }
    
    const response = await fetch(
      getApiUrl(`${API_CONFIG.ENDPOINTS.PRODUCTS}/low-stock?threshold=${threshold}`)
    );
    const data: ApiResponse<Product[]> = await response.json();
    return data.data;
  },
};
