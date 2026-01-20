import { Category, ApiResponse } from '@/types';
import { categories as mockCategories } from '@/data';
import { API_CONFIG, getApiUrl } from './config';

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const categoryService = {
  // Get all categories
  async getAll(): Promise<Category[]> {
    if (API_CONFIG.USE_MOCK_DATA) {
      await delay(200);
      return mockCategories;
    }
    
    const response = await fetch(getApiUrl(API_CONFIG.ENDPOINTS.CATEGORIES));
    const data: ApiResponse<Category[]> = await response.json();
    return data.data;
  },

  // Get category by ID
  async getById(id: string): Promise<Category | null> {
    if (API_CONFIG.USE_MOCK_DATA) {
      await delay(150);
      return mockCategories.find(c => c.id === id) || null;
    }
    
    const response = await fetch(getApiUrl(`${API_CONFIG.ENDPOINTS.CATEGORIES}/${id}`));
    const data: ApiResponse<Category> = await response.json();
    return data.data;
  },

  // Create category
  async create(category: Omit<Category, 'id'>): Promise<Category> {
    if (API_CONFIG.USE_MOCK_DATA) {
      await delay(400);
      const newCategory: Category = {
        ...category,
        id: `cat-${Date.now()}`,
      };
      return newCategory;
    }
    
    const response = await fetch(getApiUrl(API_CONFIG.ENDPOINTS.CATEGORIES), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(category),
    });
    const data: ApiResponse<Category> = await response.json();
    return data.data;
  },

  // Update category
  async update(id: string, updates: Partial<Category>): Promise<Category> {
    if (API_CONFIG.USE_MOCK_DATA) {
      await delay(400);
      const category = mockCategories.find(c => c.id === id);
      if (!category) throw new Error('Category not found');
      return { ...category, ...updates };
    }
    
    const response = await fetch(getApiUrl(`${API_CONFIG.ENDPOINTS.CATEGORIES}/${id}`), {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    });
    const data: ApiResponse<Category> = await response.json();
    return data.data;
  },

  // Delete category
  async delete(id: string): Promise<boolean> {
    if (API_CONFIG.USE_MOCK_DATA) {
      await delay(400);
      return true;
    }
    
    const response = await fetch(getApiUrl(`${API_CONFIG.ENDPOINTS.CATEGORIES}/${id}`), {
      method: 'DELETE',
    });
    return response.ok;
  },
};
