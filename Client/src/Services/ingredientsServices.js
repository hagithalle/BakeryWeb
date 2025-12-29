export async function fetchCategories() {
  const res = await fetch('/api/categories');
  if (!res.ok) throw new Error('Failed to fetch categories');
  return res.json();
}

export async function addCategory(category) {
  const res = await fetch('/api/categories', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(category)
  });
  if (!res.ok) throw new Error('Failed to add category');
  return res.json();
}
export async function editIngredient(ingredient) {
  const res = await fetch(`/api/ingredients/${ingredient.id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(ingredient)
  });
  if (!res.ok) throw new Error('Failed to edit ingredient');
  return res.json();
}
export async function fetchIngredients() {
  const res = await fetch('/api/ingredients');
  if (!res.ok) throw new Error('Failed to fetch ingredients');
  return res.json();
}

export async function addIngredient(ingredient) {
  const res = await fetch('/api/ingredients', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(ingredient)
  });
  if (!res.ok) throw new Error('Failed to add ingredient');
  return res.json();
}

export async function deleteIngredient(id) {
  const res = await fetch(`/api/ingredients/${id}`, { method: 'DELETE' });
  if (!res.ok) throw new Error('Failed to delete ingredient');
  return res.json();
}