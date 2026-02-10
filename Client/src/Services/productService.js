import axios from 'axios';

const PRODUCTS_API = '/api/product';

export async function fetchProducts() {
  const response = await axios.get(PRODUCTS_API);
  return response.data;
}

export async function fetchProduct(id) {
  const response = await axios.get(`${PRODUCTS_API}/${id}`);
  return response.data;
}

export async function addProduct(product) {
  const response = await axios.post(PRODUCTS_API, product);
  return response.data;
}

export async function editProduct(product) {
  const response = await axios.put(`${PRODUCTS_API}/${product.id}`, product);
  return response.data;
}

export async function deleteProduct(id) {
  const response = await axios.delete(`${PRODUCTS_API}/${id}`);
  return response.data;
}

export async function recalculateProductPrice(id) {
  const response = await axios.post(`${PRODUCTS_API}/${id}/recalculate-price`);
  return response.data;
}
