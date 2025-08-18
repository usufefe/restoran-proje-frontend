import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

// Create axios instance
const api = axios.create({
  baseURL: `${API_BASE_URL}/api`,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add auth token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('authToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle auth errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('authToken');
      localStorage.removeItem('user');
      window.location.href = '/admin/login';
    }
    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  login: (credentials) => api.post('/auth/login', credentials),
  register: (userData) => api.post('/auth/register', userData),
  me: () => api.get('/auth/me'),
  changePassword: (passwords) => api.post('/auth/change-password', passwords),
};

// Session API (for QR codes and customer sessions)
export const sessionAPI = {
  openSession: (sessionData) => api.post('/session/open', sessionData),
  closeSession: (sessionId) => api.post('/session/close', { sessionId }),
  getQRCode: (tableId) => api.get(`/session/qr/${tableId}`),
};

// Menu API
export const menuAPI = {
  getMenu: (restaurantId) => api.get(`/menu/${restaurantId}`),
  getCategories: (restaurantId) => api.get(`/menu/${restaurantId}/categories`),
  getItems: (restaurantId, categoryId) => api.get(`/menu/${restaurantId}/items/${categoryId}`),
};

// Orders API
export const ordersAPI = {
  createOrder: (orderData) => api.post('/orders/create', orderData),
  getTableOrders: (tableId) => api.get(`/orders/table/${tableId}`),
  getRestaurantOrders: (restaurantId, params = {}) => {
    const query = new URLSearchParams(params).toString();
    return api.get(`/orders/restaurant/${restaurantId}?${query}`);
  },
  updateOrderStatus: (orderId, status) => api.patch(`/orders/${orderId}/status`, { status }),
  updateOrderItemStatus: (itemId, status) => api.patch(`/orders/items/${itemId}/status`, { status }),
};

// Admin API
export const adminAPI = {
  getRestaurants: () => api.get('/admin/restaurants'),
  createRestaurant: (restaurantData) => api.post('/admin/restaurants', restaurantData),
  getTables: (restaurantId) => api.get(`/admin/restaurants/${restaurantId}/tables`),
  createTable: (restaurantId, tableData) => api.post(`/admin/restaurants/${restaurantId}/tables`, tableData),
  getMenu: (restaurantId) => api.get(`/admin/restaurants/${restaurantId}/menu`),
  createCategory: (restaurantId, categoryData) => api.post(`/admin/restaurants/${restaurantId}/categories`, categoryData),
  createMenuItem: (restaurantId, itemData) => api.post(`/admin/restaurants/${restaurantId}/items`, itemData),
  getUsers: () => api.get('/admin/users'),
  updateUserStatus: (userId, isActive) => api.patch(`/admin/users/${userId}/status`, { isActive }),
};

export default api;

