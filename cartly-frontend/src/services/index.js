import axiosClient from './axiosClient.js';

export const getLocalToken = () => localStorage.getItem('token');
export const setLocalToken = (token) => localStorage.setItem('token', token);
export const removeLocalToken = () => localStorage.removeItem('token');

export const authService = {
  register: async (data) => {
    const res = await axiosClient.post('/auth/register', data);
    return res.data;
  },

  login: async (data) => {
    const res = await axiosClient.post('/auth/login', data);
    if (res.data?.data?.accessToken) {
      setLocalToken(res.data.data.accessToken);
    }
    return res.data;
  },

  getCurrentUser: async () => {
    const res = await axiosClient.get('/auth/me');
    return res.data;
  },

  updateProfile: async (data) => {
    const res = await axiosClient.put('/auth/profile', data);
    return res.data;
  },

  logout: async () => {
    await axiosClient.post('/auth/logout');
    removeLocalToken();
  }
};

export const productService = {
  getAll: async (params = {}) => {
    const res = await axiosClient.get('/products', { params });
    return res.data;
  },

  getById: async (id) => {
    const res = await axiosClient.get(`/products/${id}`);
    return res.data;
  },

  create: async (data) => {
    const res = await axiosClient.post('/products', data);
    return res.data;
  },

  update: async (id, data) => {
    const res = await axiosClient.put(`/products/${id}`, data);
    return res.data;
  },

  delete: async (id) => {
    const res = await axiosClient.delete(`/products/${id}`);
    return res.data;
  },

  getCategories: async () => {
    const res = await axiosClient.get('/products/categories');
    return res.data;
  }
};

export const cartService = {
  get: async () => {
    const res = await axiosClient.get('/cart');
    return res.data;
  },

  add: async (data) => {
    const res = await axiosClient.post('/cart/add', data);
    return res.data;
  },

  update: async (data) => {
    const res = await axiosClient.put('/cart/update', data);
    return res.data;
  },

  remove: async (productId) => {
    const res = await axiosClient.delete(`/cart/${productId}`);
    return res.data;
  },

  clear: async () => {
    const res = await axiosClient.delete('/cart');
    return res.data;
  }
};

export const orderService = {
  getAll: async (params = {}) => {
    const res = await axiosClient.get('/orders', { params });
    return res.data;
  },

  getById: async (id) => {
    const res = await axiosClient.get(`/orders/${id}`);
    return res.data;
  },

  create: async (data) => {
    const res = await axiosClient.post('/orders', data);
    return res.data;
  },

  updateStatus: async (id, data) => {
    const res = await axiosClient.patch(`/orders/${id}/status`, data);
    return res.data;
  },

  cancel: async (id) => {
    const res = await axiosClient.patch(`/orders/${id}/cancel`);
    return res.data;
  }
};
