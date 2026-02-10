import axios from 'axios';

// מחיקת מתכון לפי מזהה
export async function deleteRecipe(id) {
  await axios.delete(`/api/recipe/${id}`);
}

// יצירת מתכון חדש עם קובץ תמונה

export async function createRecipeWithImage(recipe, imageFile) {
  console.log('\n>>> createRecipeWithImage START');
  console.log('📥 קיבל מ-Component:', JSON.stringify(recipe, null, 2));
  
  const formData = new FormData();
  let fieldCount = 0;

  console.log('\n📦 בניה של FormData:');
  
  // שדות בסיסיים – שמות תואמים למודל בצד השרת
  const fieldMap = {
    Name: recipe.name,
    Description: recipe.description,
    // אם Category בשרת הוא enum / int – כאן צריך להתאים:
    Category: recipe.category,
    OutputUnits: recipe.outputUnits ?? recipe.yieldAmount,
    PrepTime: recipe.prepTime,
    BakeTime: recipe.bakeTime,
    Temperature: recipe.temperature,
    RecipeType: recipe.recipeType
  };

  Object.entries(fieldMap).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      formData.append(key, value);
      console.log(`  ✓ ${key} = ${value}`);
      fieldCount++;
    }
  });

  // רכיבים
  if (Array.isArray(recipe.ingredients)) {
    console.log(`\n  [INGREDIENTS] ${recipe.ingredients.length} רכיבים:`);
    recipe.ingredients.forEach((ing, idx) => {
      const ingredientId = ing.IngredientId ?? ing.ingredientId;
      const quantity = ing.Quantity ?? ing.quantity;
      const unit = ing.Unit ?? ing.unit ?? 2; // ברירת מחדל: 2 = גרם

      if (ingredientId !== undefined && ingredientId !== null) {
        const fieldName = `Ingredients[${idx}].IngredientId`;
        formData.append(fieldName, ingredientId);
        console.log(`    ✓ ${fieldName} = ${ingredientId}`);
        fieldCount++;
      }
      if (quantity !== undefined && quantity !== null) {
        const fieldName = `Ingredients[${idx}].Quantity`;
        formData.append(fieldName, quantity);
        console.log(`    ✓ ${fieldName} = ${quantity}`);
        fieldCount++;
      }
      if (unit !== undefined && unit !== null) {
        const fieldName = `Ingredients[${idx}].Unit`;
        formData.append(fieldName, unit);
        console.log(`    ✓ ${fieldName} = ${unit}`);
        fieldCount++;
      }
    });
  }

  // שלבים
  if (Array.isArray(recipe.steps) && recipe.steps.length > 0) {
    const cleanedSteps = recipe.steps
      .map((step, idx) => {
        const description =
          typeof step === 'string'
            ? step
            : (step.Description || step.description || step.value || '').trim();

        if (!description) {
          return null; // נפסול שלבים ריקים
        }

        const order =
          (typeof step === 'string')
            ? (idx + 1)
            : (step.Order ?? step.order ?? (idx + 1));

        return { description, order };
      })
      .filter(s => s !== null);

    console.log(`\n  [STEPS] ${cleanedSteps.length} שלבים (אחרי ניקוי):`);

    cleanedSteps.forEach((step, idx) => {
      const descField = `Steps[${idx}].Description`;
      const orderField = `Steps[${idx}].Order`;
      formData.append(descField, step.description);
      formData.append(orderField, step.order);

      console.log(`    ✓ ${descField} = "${step.description}"`);
      console.log(`    ✓ ${orderField} = ${step.order}`);
      fieldCount += 2;
    });
  } else {
    console.log(`\n  [STEPS] אין שלבים`);
  }
  
  // תמונה
  if (imageFile) {
    formData.append('imageFile', imageFile);
    console.log(`\n  [IMAGE] ${imageFile.name} (${(imageFile.size / 1024).toFixed(2)}KB)`);
    fieldCount++;
  }
  
  console.log(`\n✅ סה"כ ${fieldCount} שדות ב-FormData`);

  // לוג של כל ה-FormData בפועל (מאוד שימושי)
  console.log('\n📋 FormData content:');
  for (const [key, value] of formData.entries()) {
    const displayValue = value instanceof File ? `[File: ${value.name}]` : value;
    console.log(`  📄 ${key} = ${displayValue}`);
  }

  // הדפסה מפורטת של כל מה שנשלח
  console.log('\n📤 מה בדיוק השרת הולך לקבל:');
  const formDataContent = {};
  for (const [key, value] of formData.entries()) {
    if (formDataContent[key] === undefined) {
      formDataContent[key] = value instanceof File ? `[File: ${value.name}, Size: ${(value.size / 1024).toFixed(2)}KB]` : value;
    } else {
      // אם יש מפתח משוכפל (כמו הרכיבים והשלבים), כדי לעשות array
      if (!Array.isArray(formDataContent[key])) {
        formDataContent[key] = [formDataContent[key]];
      }
      formDataContent[key].push(value instanceof File ? `[File: ${value.name}]` : value);
    }
  }
  console.log(JSON.stringify(formDataContent, null, 2));

  console.log('\n📤 שליחה ל-SERVER: POST /api/recipe\n');
  
  try {
    const response = await axios.post('/api/recipe', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    
    console.log('✅ תשובה מהשרת:');
    console.log(`   Status: ${response.status}`);
    console.log(`   Data:`, response.data);
    console.log('>>> createRecipeWithImage END\n');
    return response.data;
  } catch (err) {
    console.error('\n❌ שגיאה ב-axios:');
    console.error(`   Message: ${err.message}`);
    console.error(`   Status: ${err.response?.status}`);
    console.error(`   Data: ${JSON.stringify(err.response?.data)}`);
    if (err.request && !err.response) {
      console.error('   ⚠️ No response from server - check if server is running');
    }
    console.error('>>> createRecipeWithImage ERROR\n');
    throw err;
  }
}


// קבלת כל המתכונים מהשרת
export async function getAllRecipes() {
  console.log('getAllRecipes: fetching from server...');
  const response = await axios.get('/api/recipe');
  console.log('getAllRecipes: received', response.data.length, 'recipes');
  response.data.forEach((recipe, idx) => {
    console.log(`Recipe[${idx}]: id=${recipe.id}, name=${recipe.name}, ingredients=${recipe.ingredients?.length ?? 0}, Ingredients=${recipe.Ingredients?.length ?? 0}`);
  });
  return response.data;
}

// עדכון מתכון קיים (כולל אפשרות לעדכן תמונה)
export async function updateRecipeWithImage(id, recipe, imageFile) {
  console.log('\n>>> updateRecipeWithImage START (ID:', id, ')');
  console.log('📥 קיבל מ-Component:', JSON.stringify(recipe, null, 2));
  
  const formData = new FormData();
  let fieldCount = 0;

  console.log('\n📦 בניה של FormData:');
  
  const fieldMap = {
    Name: recipe.name,
    Description: recipe.description,
    Category: recipe.category,
    OutputUnits: recipe.outputUnits,
    PrepTime: recipe.prepTime,
    BakeTime: recipe.bakeTime,
    Temperature: recipe.temperature,
    RecipeType: recipe.recipeType
  };

  Object.entries(fieldMap).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      formData.append(key, value);
      console.log(`  ✓ ${key} = ${value}`);
      fieldCount++;
    }
  });

  if (Array.isArray(recipe.ingredients)) {
    console.log(`\n  [INGREDIENTS] ${recipe.ingredients.length} רכיבים:`);
    recipe.ingredients.forEach((ing, idx) => {
      const ingredientId = ing.IngredientId ?? ing.ingredientId;
      const quantity = ing.Quantity ?? ing.quantity;
      const unit = ing.Unit ?? ing.unit ?? 2; // ברירת מחדל: 2 = גרם
      
      if (ingredientId !== undefined && ingredientId !== null) {
        const fieldName = `Ingredients[${idx}].IngredientId`;
        formData.append(fieldName, ingredientId);
        console.log(`    ✓ ${fieldName} = ${ingredientId}`);
        fieldCount++;
      }
      if (quantity !== undefined && quantity !== null) {
        const fieldName = `Ingredients[${idx}].Quantity`;
        formData.append(fieldName, quantity);
        console.log(`    ✓ ${fieldName} = ${quantity}`);
        fieldCount++;
      }
      if (unit !== undefined && unit !== null) {
        const fieldName = `Ingredients[${idx}].Unit`;
        formData.append(fieldName, unit);
        console.log(`    ✓ ${fieldName} = ${unit}`);
        fieldCount++;
      }
    });
  }

  if (Array.isArray(recipe.steps)) {
    console.log(`\n  [STEPS] ${recipe.steps.length} שלבים:`);
    recipe.steps.forEach((step, idx) => {
      const description = typeof step === 'string' ? step : (step.Description || step.description || '');
      const order = typeof step === 'string' ? (idx + 1) : (step.Order || step.order || idx + 1);
      
      const descField = `Steps[${idx}].Description`;
      const orderField = `Steps[${idx}].Order`;
      formData.append(descField, description);
      formData.append(orderField, order);
      
      console.log(`    ✓ ${descField} = "${description}"`);
      console.log(`    ✓ ${orderField} = ${order}`);
      fieldCount += 2;
    });
  }
  
  if (imageFile) {
    formData.append('imageFile', imageFile);
    console.log(`\n  [IMAGE] ${imageFile.name} (${(imageFile.size / 1024).toFixed(2)}KB)`);
    fieldCount++;
  }
  
  console.log(`\n✅ סה"כ ${fieldCount} שדות ב-FormData`);
  console.log('\n📤 שליחה ל-SERVER: PUT /api/recipe/' + id);
  
  const response = await axios.put(`/api/recipe/${id}`, formData);
  
  console.log('✅ תשובה מהשרת:', response.data);
  console.log('>>> updateRecipeWithImage END\n');
  return response.data;
}
