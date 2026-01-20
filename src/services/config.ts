// API Configuration
// Toggle this to switch between dummy data and real Express.js backend

export const API_CONFIG = {
  // Set to true to use dummy data, false to use real backend
  USE_MOCK_DATA: false,
  
  // Express.js backend URL
  BASE_URL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api',
  
  // API endpoints
  ENDPOINTS: {
    // Legacy endpoints
    PRODUCTS: '/products',
    CATEGORIES: '/categories',
    SALES: '/sales',
    USERS: '/users',
    AUTH: '/auth',
    
    // Oxygen Center endpoints
    CUSTOMERS: '/customers',
    CUSTOMER_TRANSACTIONS: '/customer-transactions',
    SUPPLIERS: '/suppliers',
    SUPPLIER_TRANSACTIONS: '/supplier-transactions',
    BOTTLES: '/bottles',
    BOTTLE_TYPES: '/bottle-types',
    BOTTLE_FILL_HISTORY: '/bottles/fill-history',
    TANK: '/tank',
    TANK_FILL_HISTORY: '/tank/fill-history',
    DASHBOARD: '/dashboard',
  },
  
  // Request timeout in milliseconds
  TIMEOUT: 10000,
};

// Helper to build full API URL
export const getApiUrl = (endpoint: string): string => {
  return `${API_CONFIG.BASE_URL}${endpoint}`;
};

// Generic fetch wrapper with error handling
export async function apiFetch<T>(
  endpoint: string,
  options?: RequestInit
): Promise<T> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), API_CONFIG.TIMEOUT);

  try {
    const response = await fetch(getApiUrl(endpoint), {
      ...options,
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.message || `HTTP error! status: ${response.status}`);
    }

    return response.json();
  } catch (error) {
    clearTimeout(timeoutId);
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error('Request timeout');
    }
    throw error;
  }
}
