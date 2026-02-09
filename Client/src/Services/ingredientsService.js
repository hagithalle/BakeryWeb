import axios from 'axios';

const INGREDIENTS_API = '/api/ingredients';
const CATEGORIES_API = '/api/categories';

export async function fetchCategories() {
  const response = await axios.get(CATEGORIES_API);
  return response.data;
}

export async function addCategory(category) {
  const response = await axios.post(CATEGORIES_API, category);
  return response.data;
}

export async function editIngredient(ingredient) {
  const response = await axios.put(`${INGREDIENTS_API}/${ingredient.id}`, ingredient);
  return response.data;
}

export async function fetchIngredients() {
  const response = await axios.get(INGREDIENTS_API);
  return response.data;
}

export async function addIngredient(ingredient) {
  const response = await axios.post(INGREDIENTS_API, ingredient);
  return response.data;
}

export async function deleteIngredient(id) {
  const response = await axios.delete(`${INGREDIENTS_API}/${id}`);
  return response.data;
}

