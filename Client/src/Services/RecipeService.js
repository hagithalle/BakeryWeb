import api from './api';
import { LogManager, ConsoleLogger } from '../utils/logging';

const logManager = new LogManager();
logManager.addLogger(new ConsoleLogger());

// מחיקת מתכון לפי מזהה
export async function deleteRecipe(id) {
  await api.delete(`/api/recipe/${id}`);
}

// יצירת מתכון חדש עם קובץ תמונה

export async function createRecipeWithImage(recipe, imageFile) {
  logManager.log('\n>>> createRecipeWithImage START');
  logManager.log('📥 קיבל מ-Component:' + JSON.stringify(recipe, null, 2));
  
  const formData = new FormData();
  let fieldCount = 0;

  logManager.log('\n📦 בניה של FormData:');
  
  // שדות בסיסיים – שמות תואמים למודל בצד השרת
  const fieldMap = {
    Name: recipe.name,
    Description: recipe.description,
    // אם Category בשרת הוא enum / int – כאן צריך להתאים:
    Category: recipe.category,
    OutputUnits: recipe.outputUnits ?? recipe.yieldAmount,
    OutputUnitType: recipe.outputUnitType ?? 0,
    PrepTime: recipe.prepTime,
    BakeTime: recipe.bakeTime,
    Temperature: recipe.temperature,
    RecipeType: recipe.recipeType
  };

  Object.entries(fieldMap).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      formData.append(key, value);
      logManager.log(`  ✓ ${key} = ${value}`);
      fieldCount++;
    }
  });

  // רכיבים
  if (Array.isArray(recipe.ingredients)) {
    logManager.log(`\n  [INGREDIENTS] ${recipe.ingredients.length} רכיבים:`);
    recipe.ingredients.forEach((ing, idx) => {
      const ingredientId = ing.IngredientId ?? ing.ingredientId;
      const quantity = ing.Quantity ?? ing.quantity;
      const unit = ing.Unit ?? ing.unit ?? 2; // ברירת מחדל: 2 = גרם

      if (ingredientId !== undefined && ingredientId !== null) {
        const fieldName = `Ingredients[${idx}].IngredientId`;
        formData.append(fieldName, ingredientId);
        logManager.log(`    ✓ ${fieldName} = ${ingredientId}`);
        fieldCount++;
      }
      if (quantity !== undefined && quantity !== null) {
        const fieldName = `Ingredients[${idx}].Quantity`;
        formData.append(fieldName, quantity);
        logManager.log(`    ✓ ${fieldName} = ${quantity}`);
        fieldCount++;
      }
      if (unit !== undefined && unit !== null) {
        const fieldName = `Ingredients[${idx}].Unit`;
        formData.append(fieldName, unit);
        logManager.log(`    ✓ ${fieldName} = ${unit}`);
        fieldCount++;
      }
    });
  }

  // מתכונים בסיסיים (Recipe Composition)
  if (Array.isArray(recipe.baseRecipes) && recipe.baseRecipes.length > 0) {
    logManager.log(`\n  [BASE_RECIPES] ${recipe.baseRecipes.length} מתכונים בסיסיים:`);
    recipe.baseRecipes.forEach((br, idx) => {
      const baseRecipeId = br.baseRecipeId ?? br.BaseRecipeId;
      const quantity = br.quantity ?? br.Quantity ?? 1;
      const unit = br.unit ?? br.Unit ?? 5; // ברירת מחדל: 5 = Unit

      if (baseRecipeId !== undefined && baseRecipeId !== null) {
        formData.append(`BaseRecipes[${idx}].BaseRecipeId`, baseRecipeId);
        logManager.log(`    ✓ BaseRecipes[${idx}].BaseRecipeId = ${baseRecipeId}`);
        fieldCount++;
      }
      if (quantity !== undefined && quantity !== null) {
        formData.append(`BaseRecipes[${idx}].Quantity`, quantity);
        logManager.log(`    ✓ BaseRecipes[${idx}].Quantity = ${quantity}`);
        fieldCount++;
      }
      if (unit !== undefined && unit !== null) {
        formData.append(`BaseRecipes[${idx}].Unit`, unit);
        logManager.log(`    ✓ BaseRecipes[${idx}].Unit = ${unit}`);
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

    logManager.log(`\n  [STEPS] ${cleanedSteps.length} שלבים (אחרי ניקוי):`);

    cleanedSteps.forEach((step, idx) => {
      const descField = `Steps[${idx}].Description`;
      const orderField = `Steps[${idx}].Order`;
      formData.append(descField, step.description);
      formData.append(orderField, step.order);

      logManager.log(`    ✓ ${descField} = "${step.description}"`);
      logManager.log(`    ✓ ${orderField} = ${step.order}`);
      fieldCount += 2;
    });
  } else {
    logManager.log(`\n  [STEPS] אין שלבים`);
  }
  
  // תמונה
  if (imageFile) {
    formData.append('imageFile', imageFile);
    logManager.log(`\n  [IMAGE] ${imageFile.name} (${(imageFile.size / 1024).toFixed(2)}KB)`);
    fieldCount++;
  }
  
  console.log(`\n✅ סה"כ ${fieldCount} שדות ב-FormData`);
  logManager.log(`\n✅ סה"כ ${fieldCount} שדות ב-FormData`);

  // לוג של כל ה-FormData בפועל (מאוד שימושי)
  console.log('\n📋 FormData content:');
    logManager.log('\n📋 FormData content:');
  for (const [key, value] of formData.entries()) {
    const displayValue = value instanceof File ? `[File: ${value.name}]` : value;
    logManager.log(`  📄 ${key} = ${displayValue}`);
  }

  // הדפסה מפורטת של כל מה שנשלח
  console.log('\n📤 מה בדיוק השרת הולך לקבל:');
    logManager.log('\n📤 מה בדיוק השרת הולך לקבל:');
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
  logManager.log(JSON.stringify(formDataContent, null, 2));

  console.log('\n📤 שליחה ל-SERVER: POST /api/recipe\n');
    logManager.log('\n📤 שליחה ל-SERVER: POST /api/recipe\n');
  
  try {
    const response = await api.post('/api/recipe', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    logManager.log('✅ תשובה מהשרת:');
    logManager.log(`   Status: ${response.status}`);
    logManager.log(`   Data: ${JSON.stringify(response.data)}`);
    logManager.log('>>> createRecipeWithImage END\n');
    return response.data;
  } catch (err) {
    logManager.log('\n❌ שגיאה ב-axios:');
    logManager.log(`   Message: ${err.message}`);
    logManager.log(`   Status: ${err.response?.status}`);
    logManager.log(`   Data: ${JSON.stringify(err.response?.data)}`);
    if (err.request && !err.response) {
      logManager.log('   ⚠️ No response from server - check if server is running');
    }
    logManager.log('>>> createRecipeWithImage ERROR\n');
    throw err;
  }
}


// קבלת כל המתכונים מהשרת
export async function getAllRecipes() {
  logManager.log('getAllRecipes: fetching from server...');
  const response = await api.get('/api/recipe');
  logManager.log('getAllRecipes: received ' + response.data.length + ' recipes');
  response.data.forEach((recipe, idx) => {
    logManager.log(`Recipe[${idx}]: id=${recipe.id}, name=${recipe.name}, ingredients=${recipe.ingredients?.length ?? 0}, Ingredients=${recipe.Ingredients?.length ?? 0}`);
  });
  return response.data;
}

// עדכון מתכון קיים (כולל אפשרות לעדכן תמונה)
export async function updateRecipeWithImage(id, recipe, imageFile) {
  logManager.log(`\n>>> updateRecipeWithImage START (ID: ${id})`);
  logManager.log('📥 קיבל מ-Component:' + JSON.stringify(recipe, null, 2));
  
  const formData = new FormData();
  let fieldCount = 0;

  logManager.log('\n📦 בניה של FormData:');
  
  const fieldMap = {
    Name: recipe.name,
    Description: recipe.description,
    Category: recipe.category,
    OutputUnits: recipe.outputUnits,
    OutputUnitType: recipe.outputUnitType ?? 0,
    PrepTime: recipe.prepTime,
    BakeTime: recipe.bakeTime,
    Temperature: recipe.temperature,
    RecipeType: recipe.recipeType
  };

  Object.entries(fieldMap).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      formData.append(key, value);
      logManager.log(`  ✓ ${key} = ${value}`);
      fieldCount++;
    }
  });

  if (Array.isArray(recipe.ingredients)) {
    logManager.log(`\n  [INGREDIENTS] ${recipe.ingredients.length} רכיבים:`);
    recipe.ingredients.forEach((ing, idx) => {
      const ingredientId = ing.IngredientId ?? ing.ingredientId;
      const quantity = ing.Quantity ?? ing.quantity;
      const unit = ing.Unit ?? ing.unit ?? 2; // ברירת מחדל: 2 = גרם
      
      if (ingredientId !== undefined && ingredientId !== null) {
        const fieldName = `Ingredients[${idx}].IngredientId`;
        formData.append(fieldName, ingredientId);
        logManager.log(`    ✓ ${fieldName} = ${ingredientId}`);
        fieldCount++;
      }
      if (quantity !== undefined && quantity !== null) {
        const fieldName = `Ingredients[${idx}].Quantity`;
        formData.append(fieldName, quantity);
        logManager.log(`    ✓ ${fieldName} = ${quantity}`);
        fieldCount++;
      }
      if (unit !== undefined && unit !== null) {
        const fieldName = `Ingredients[${idx}].Unit`;
        formData.append(fieldName, unit);
        logManager.log(`    ✓ ${fieldName} = ${unit}`);
        fieldCount++;
      }
    });
  }

  // מתכונים בסיסיים (Recipe Composition)
  if (Array.isArray(recipe.baseRecipes) && recipe.baseRecipes.length > 0) {
    logManager.log(`\n  [BASE_RECIPES] ${recipe.baseRecipes.length} מתכונים בסיסיים:`);
    recipe.baseRecipes.forEach((br, idx) => {
      const baseRecipeId = br.baseRecipeId ?? br.BaseRecipeId;
      const quantity = br.quantity ?? br.Quantity ?? 1;
      const unit = br.unit ?? br.Unit ?? 5;

      if (baseRecipeId !== undefined && baseRecipeId !== null) {
        formData.append(`BaseRecipes[${idx}].BaseRecipeId`, baseRecipeId);
        logManager.log(`    ✓ BaseRecipes[${idx}].BaseRecipeId = ${baseRecipeId}`);
        fieldCount++;
      }
      if (quantity !== undefined && quantity !== null) {
        formData.append(`BaseRecipes[${idx}].Quantity`, quantity);
        logManager.log(`    ✓ BaseRecipes[${idx}].Quantity = ${quantity}`);
        fieldCount++;
      }
      if (unit !== undefined && unit !== null) {
        formData.append(`BaseRecipes[${idx}].Unit`, unit);
        logManager.log(`    ✓ BaseRecipes[${idx}].Unit = ${unit}`);
        fieldCount++;
      }
    });
  }

  if (Array.isArray(recipe.steps)) {
    logManager.log(`\n  [STEPS] ${recipe.steps.length} שלבים:`);
    recipe.steps.forEach((step, idx) => {
      const description = typeof step === 'string' ? step : (step.Description || step.description || '');
      const order = typeof step === 'string' ? (idx + 1) : (step.Order || step.order || idx + 1);
      
      const descField = `Steps[${idx}].Description`;
      const orderField = `Steps[${idx}].Order`;
      formData.append(descField, description);
      formData.append(orderField, order);
      
      logManager.log(`    ✓ ${descField} = "${description}"`);
      logManager.log(`    ✓ ${orderField} = ${order}`);
      fieldCount += 2;
    });
  }
  
  if (imageFile) {
    formData.append('imageFile', imageFile);
    logManager.log(`\n  [IMAGE] ${imageFile.name} (${(imageFile.size / 1024).toFixed(2)}KB)`);
      logManager.log(`\n✅ סה"כ ${fieldCount} שדות ב-FormData`);
    fieldCount++;
  }
  
  console.log(`\n✅ סה"כ ${fieldCount} שדות ב-FormData`);
  console.log('\n📤 שליחה ל-SERVER: PUT /api/recipe/' + id);
    logManager.log('\n📤 שליחה ל-SERVER: PUT /api/recipe/' + id);
  
  const response = await api.put(`/api/recipe/${id}`, formData);
  logManager.log('✅ תשובה מהשרת: ' + JSON.stringify(response.data));
  logManager.log('>>> updateRecipeWithImage END\n');
  return response.data;
}

export async function importRecipeFromFile(file) {
  const formData = new FormData();
  formData.append("file", file);

  const { data } = await api.post(
    "/api/recipes/import-from-file",
    formData,
    {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    }
  );

  // כאן data צריך להיות בפורמט שמתאים ל-initialValues של AddRecipeDialog
  return data;
}