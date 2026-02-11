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

// יצירת מוצר חדש עם תמונה
export async function createProductWithImage(product, imageFile) {
  console.log('\n>>> createProductWithImage START');
  console.log('📥 קיבל מ-Component:', JSON.stringify(product, null, 2));
  
  const formData = new FormData();
  let fieldCount = 0;

  console.log('\n📦 בניה של FormData:');
  
  // שדות בסיסיים
  const fieldMap = {
    Name: product.name,
    Description: product.description,
    ProductType: product.productType,
    Category: product.category,
    ProfitMarginPercent: product.profitMarginPercent,
    ManualSellingPrice: product.manualSellingPrice,
    PackagingTimeMinutes: product.packagingTimeMinutes
  };

  Object.entries(fieldMap).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      formData.append(key, value);
      console.log(`  ✓ ${key} = ${value}`);
      fieldCount++;
    }
  });

  // אם מוצר בודד - מתכון ויחידות
  if (product.productType === 'single' && product.recipeId) {
    formData.append('RecipeId', product.recipeId);
    formData.append('RecipeUnits', product.recipeUnits || 1);
    console.log(`  ✓ RecipeId = ${product.recipeId}`);
    console.log(`  ✓ RecipeUnits = ${product.recipeUnits || 1}`);
    fieldCount += 2;
  }

  // אם מארז - רשימת מוצרים
  if (product.productType === 'package' && Array.isArray(product.packageItems)) {
    console.log(`\n  [PACKAGE_ITEMS] ${product.packageItems.length} מוצרים במארז:`);
    product.packageItems.forEach((item, idx) => {
      if (item.productId) {
        formData.append(`PackageItems[${idx}].ProductId`, item.productId);
        formData.append(`PackageItems[${idx}].Quantity`, item.quantity || 1);
        console.log(`    ✓ PackageItems[${idx}].ProductId = ${item.productId}`);
        console.log(`    ✓ PackageItems[${idx}].Quantity = ${item.quantity || 1}`);
        fieldCount += 2;
      }
    });
  }

  // אריזה נוספת
  if (Array.isArray(product.additionalPackaging) && product.additionalPackaging.length > 0) {
    console.log(`\n  [ADDITIONAL_PACKAGING] ${product.additionalPackaging.length} פריטי אריזה:`);
    product.additionalPackaging.forEach((item, idx) => {
      if (item.packagingId) {
        formData.append(`AdditionalPackaging[${idx}].PackagingId`, item.packagingId);
        formData.append(`AdditionalPackaging[${idx}].Quantity`, item.quantity || 1);
        console.log(`    ✓ AdditionalPackaging[${idx}].PackagingId = ${item.packagingId}`);
        console.log(`    ✓ AdditionalPackaging[${idx}].Quantity = ${item.quantity || 1}`);
        fieldCount += 2;
      }
    });
  }
  
  // תמונה
  if (imageFile) {
    formData.append('imageFile', imageFile);
    console.log(`\n  [IMAGE] ${imageFile.name} (${(imageFile.size / 1024).toFixed(2)}KB)`);
    fieldCount++;
  }
  
  console.log(`\n✅ סה"כ ${fieldCount} שדות ב-FormData`);

  // לוג של כל ה-FormData בפועל
  console.log('\n📋 FormData content:');
  for (const [key, value] of formData.entries()) {
    const displayValue = value instanceof File ? `[File: ${value.name}]` : value;
    console.log(`  📄 ${key} = ${displayValue}`);
  }

  console.log('\n📤 שליחה ל-SERVER: POST /api/product\n');
  
  try {
    const response = await axios.post(PRODUCTS_API, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    
    console.log('✅ תשובה מהשרת:');
    console.log(`   Status: ${response.status}`);
    console.log(`   Data:`, response.data);
    console.log('>>> createProductWithImage END\n');
    return response.data;
  } catch (err) {
    console.error('\n❌ שגיאה ב-axios:');
    console.error(`   Message: ${err.message}`);
    console.error(`   Status: ${err.response?.status}`);
    console.error(`   Data: ${JSON.stringify(err.response?.data)}`);
    if (err.request && !err.response) {
      console.error('   ⚠️ No response from server - check if server is running');
    }
    console.error('>>> createProductWithImage ERROR\n');
    throw err;
  }
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
