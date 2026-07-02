import api from './api';

const INGREDIENTS_API = '/api/ingredients';
const CATEGORIES_API = '/api/categories';

export async function fetchCategories() {
  const response = await api.get(CATEGORIES_API);
  return response.data;
}

export async function addCategory(category) {
  const response = await api.post(CATEGORIES_API, category);
  return response.data;
}

export async function editIngredient(ingredient) {
  const response = await api.put(`${INGREDIENTS_API}/${ingredient.id}`, ingredient);
  return response.data;
}

export async function fetchIngredients() {
  const response = await api.get(INGREDIENTS_API);
  return response.data;
}

export async function addIngredient(ingredient) {
  const response = await api.post(INGREDIENTS_API, ingredient);
  return response.data;
}

export async function deleteIngredient(id) {
  const response = await api.delete(`${INGREDIENTS_API}/${id}`);
  return response.data;
}

