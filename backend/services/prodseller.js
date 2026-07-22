const axios = require('axios');

const BASE_URL = 'http://51.77.244.194/v1';
const DEFAULT_KEY = 'psk_5893e0e31af0817550eb1e09b561f8be0256d7d0e57b8c8b';

class ProdSellerService {
  constructor() {
    this.client = axios.create({
      baseURL: BASE_URL,
      timeout: 15000,
    });
  }

  getHeaders(idempotencyKey = null) {
    const rawKey = process.env.PRODSELLER_API_KEY || DEFAULT_KEY;
    const cleanKey = rawKey.replace(/^["']|["']$/g, '').trim();
    const headers = {
      'X-API-Key': cleanKey,
    };
    if (idempotencyKey) {
      headers['Idempotency-Key'] = idempotencyKey;
    }
    return headers;
  }

  async getProducts() {
    try {
      const response = await this.client.get('/products', {
        headers: this.getHeaders(),
      });
      return response.data?.products || [];
    } catch (error) {
      console.error('ProdSeller getProducts error:', error.response?.data || error.message);
      return null;
    }
  }

  async getProduct(productId) {
    try {
      const response = await this.client.get(`/products/${productId}`, {
        headers: this.getHeaders(),
      });
      return response.data;
    } catch (error) {
      console.error(`ProdSeller getProduct(${productId}) error:`, error.response?.data || error.message);
      return null;
    }
  }

  async getBalance() {
    try {
      const response = await this.client.get('/balance', {
        headers: this.getHeaders(),
      });
      return response.data;
    } catch (error) {
      console.error('ProdSeller getBalance error:', error.response?.data || error.message);
      return null;
    }
  }

  async createOrder(productId, quantity = 1, idempotencyKey = null) {
    try {
      const response = await this.client.post(
        '/orders',
        { productId, quantity },
        { headers: this.getHeaders(idempotencyKey) }
      );
      return response.data;
    } catch (error) {
      console.error('ProdSeller createOrder error:', error.response?.data || error.message);
      return error.response?.data || { error: error.message || 'API connection failed' };
    }
  }

  async getOrderStatus(orderId) {
    try {
      const response = await this.client.get(`/orders/${orderId}`, {
        headers: this.getHeaders(),
      });
      return response.data;
    } catch (error) {
      console.error(`ProdSeller getOrderStatus(${orderId}) error:`, error.response?.data || error.message);
      return null;
    }
  }
}

module.exports = new ProdSellerService();
