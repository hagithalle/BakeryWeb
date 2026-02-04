// מחיקת מתכון לפי מזהה
export async function deleteRecipe(id) {
  await axios.delete(`/api/recipe/${id}`);
}
import axios from 'axios';

// יצירת מתכון חדש עם קובץ תמונה
export async function createRecipeWithImage(recipe, imageFile) {
  console.log('createRecipeWithImage received recipe:', recipe);
  const formData = new FormData();
  // הוספת שדות רגילים
  Object.entries(recipe).forEach(([key, value]) => {
    if (key === 'ingredients' && Array.isArray(value)) {
      value.forEach((ing, idx) => {
        if (ing.IngredientId !== undefined) {
          formData.append(`Ingredients[${idx}].IngredientId`, ing.IngredientId);
          console.log(`FormData: Ingredients[${idx}].IngredientId =`, ing.IngredientId, '| name:', ing.name || ing.ingredientName, '| full:', ing);
        }
        if (ing.Quantity !== undefined) {
          formData.append(`Ingredients[${idx}].Quantity`, ing.Quantity);
          console.log(`FormData: Ingredients[${idx}].Quantity =`, ing.Quantity, '| name:', ing.name || ing.ingredientName, '| full:', ing);
        }
      });
    } else if (key === 'steps' && Array.isArray(value)) {
      value.forEach((step, idx) => {
        if (step.Description !== undefined) {
          formData.append(`Steps[${idx}].Description`, step.Description);
        } else {
          formData.append(`Steps[${idx}].Description`, step);
        }
        if (step.Order !== undefined) {
          formData.append(`Steps[${idx}].Order`, step.Order);
        } else {
          formData.append(`Steps[${idx}].Order`, idx + 1);
        }
      });
    } else if (value !== undefined && value !== null) {
      formData.append(key, value);
    }
  });
  // הוספת קובץ תמונה
  if (imageFile) {
    formData.append('imageFile', imageFile);
  }
  console.log('FormData entries before sending:');
  for (let pair of formData.entries()) {
    console.log('FormData:', pair[0], pair[1]);
  }
  const response = await axios.post('/api/recipe', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return response.data;
}

// קבלת כל המתכונים מהשרת
export async function getAllRecipes() {
  const response = await axios.get('/api/recipe');
  return response.data;
}

// עדכון מתכון קיים (כולל אפשרות לעדכן תמונה)
export async function updateRecipeWithImage(id, recipe, imageFile) {
  console.log('updateRecipeWithImage received recipe:', recipe);
  const formData = new FormData();
  Object.entries(recipe).forEach(([key, value]) => {
    if (key === 'ingredients' && Array.isArray(value)) {
      value.forEach((ing, idx) => {
        if (ing.ingredientId !== undefined) {
          formData.append(`ingredients[${idx}].ingredientId`, ing.ingredientId);
        }
        if (ing.quantity !== undefined) {
          formData.append(`ingredients[${idx}].quantity`, ing.quantity);
        }
      });
    } else if (key === 'steps' && Array.isArray(value)) {
      value.forEach((step, idx) => {
        if (step.Description !== undefined) {
          formData.append(`Steps[${idx}].Description`, step.Description);
        } else {
          formData.append(`Steps[${idx}].Description`, step);
        }
        if (step.Order !== undefined) {
          formData.append(`Steps[${idx}].Order`, step.Order);
        } else {
          formData.append(`Steps[${idx}].Order`, idx + 1);
        }
      });
    } else if (value !== undefined && value !== null) {
      formData.append(key, value);
    }
  });
  if (imageFile) {
    formData.append('imageFile', imageFile);
  }
  console.log('FormData entries before sending (update):');
  for (let pair of formData.entries()) {
    console.log('FormData:', pair[0], pair[1]);
  }
  const response = await axios.put(`/api/recipe/${id}`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return response.data;
}
