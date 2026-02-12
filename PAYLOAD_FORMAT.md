# 📦 Product Payload Format Documentation

## תיאור כללי
מערכת המוצרים שלנו משתמשת ב-**FormData API** לשליחה של מוצרים (כולל קבצים) לשרת, וה-ASP.NET Core יכול "לקרוא" (parse) את זה באופן אוטומטי.

---

## 🔄 Flow - מ-Component לשרת

### 1️⃣ **Component** (AddProductDialog.jsx)
```javascript
// State object that Component has:
const productData = {
  name: "עוגיות מארז",
  description: "מארז צילום יום הולדת",
  productType: "package",  // string: "single" or "package"
  category: "מארז יום הולדת",
  profitMarginPercent: 0.15,
  manualSellingPrice: null,
  recipeId: null,  // only for Single type
  recipeUnits: 1,
  packageItems: [
    { recipeId: 2, quantity: 1, name: "Brownies" },
    { recipeId: 5, quantity: 2, name: "Chocolate Balls" }
  ],
  additionalPackaging: [
    { packagingId: 1, quantity: 3, name: "Gift Box" }
  ]
};

const imageFile = File(/* binary image data */);
```

### 2️⃣ **Client Service** (productService.js - createProductWithImage)
```javascript
// Converts to FormData format:
const formData = new FormData();

// Basic fields
formData.append('Name', 'עוגיות מארז');
formData.append('Description', 'מארז צילום יום הולדת');
formData.append('ProductType', 1);  // 1 = Package (converted from string "package")
formData.append('Category', 'מארז יום הולדת');
formData.append('ProfitMarginPercent', 0.15);
formData.append('ManualSellingPrice', null);
formData.append('PackagingTimeMinutes', 10);

// Package Items - uses INDEXED naming convention
formData.append('PackageItems[0].RecipeId', '2');
formData.append('PackageItems[0].Quantity', '1');
formData.append('PackageItems[1].RecipeId', '5');
formData.append('PackageItems[1].Quantity', '2');

// Additional Packaging - also indexed
formData.append('AdditionalPackaging[0].PackagingId', '1');
formData.append('AdditionalPackaging[0].Quantity', '3');

// Image file (binary)
formData.append('imageFile', File);
```

### 3️⃣ **HTTP Request** (Browser Network Tab Shows)
```
POST /api/products/create HTTP/1.1
Content-Type: multipart/form-data; boundary=----WebKitFormBoundary7MA4YWxkTrZu0gW

------WebKitFormBoundary7MA4YWxkTrZu0gW
Content-Disposition: form-data; name="Name"

עוגיות מארז
------WebKitFormBoundary7MA4YWxkTrZu0gW
Content-Disposition: form-data; name="Description"

מארז צילום יום הולדת
------WebKitFormBoundary7MA4YWxkTrZu0gW
Content-Disposition: form-data; name="ProductType"

1
------WebKitFormBoundary7MA4YWxkTrZu0gW
Content-Disposition: form-data; name="Category"

מארז יום הולדת
------WebKitFormBoundary7MA4YWxkTrZu0gW
Content-Disposition: form-data; name="ProfitMarginPercent"

0.15
------WebKitFormBoundary7MA4YWxkTrZu0gW
Content-Disposition: form-data; name="ManualSellingPrice"

------WebKitFormBoundary7MA4YWxkTrZu0gW
Content-Disposition: form-data; name="PackagingTimeMinutes"

10
------WebKitFormBoundary7MA4YWxkTrZu0gW
Content-Disposition: form-data; name="PackageItems[0].RecipeId"

2
------WebKitFormBoundary7MA4YWxkTrZu0gW
Content-Disposition: form-data; name="PackageItems[0].Quantity"

1
------WebKitFormBoundary7MA4YWxkTrZu0gW
Content-Disposition: form-data; name="PackageItems[1].RecipeId"

5
------WebKitFormBoundary7MA4YWxkTrZu0gW
Content-Disposition: form-data; name="PackageItems[1].Quantity"

2
------WebKitFormBoundary7MA4YWxkTrZu0gW
Content-Disposition: form-data; name="AdditionalPackaging[0].PackagingId"

1
------WebKitFormBoundary7MA4YWxkTrZu0gW
Content-Disposition: form-data; name="AdditionalPackaging[0].Quantity"

3
------WebKitFormBoundary7MA4YWxkTrZu0gW
Content-Disposition: form-data; name="imageFile"; filename="product-image.jpg"
Content-Type: image/jpeg

[binary image data here - 50KB]
------WebKitFormBoundary7MA4YWxkTrZu0gW--
```

### 4️⃣ **Server/ASP.NET Core** (Model Binding Magic ✨)
**ASP.NET Core automatically parses FormData** using its Model Binder:

```csharp
[HttpPost("create")]
public async Task<IActionResult> Create([FromForm] CreateProductRequest request)
{
    // ASP.NET AUTOMATICALLY maps FormData fields to properties!
    // This is what `request` object contains:
    
    request.Name = "עוגיות מארז"
    request.Description = "מארז צילום יום הולדת"
    request.ProductType = 1
    request.Category = "מארז יום הולדת"
    request.ProfitMarginPercent = 0.15m
    request.ManualSellingPrice = null
    request.PackagingTimeMinutes = 10
    request.RecipeId = null
    request.RecipeUnits = 1
    
    // Collections are also automatically parsed!
    request.PackageItems = [
        new PackageItemRequest { RecipeId = 2, Quantity = 1 },
        new PackageItemRequest { RecipeId = 5, Quantity = 2 }
    ]
    
    request.AdditionalPackaging = [
        new AdditionalPackagingRequest { PackagingId = 1, Quantity = 3 }
    ]
    
    request.imageFile = IFormFile(/* binary data */)
}
```

### 5️⃣ **Server/ProductService.cs** (Business Logic)
```csharp
public async Task<Product> CreateAsync(CreateProductRequest request)
{
    // Extract from request
    var product = new Product
    {
        Name = request.Name,
        Description = request.Description,
        ProductType = (ProductType)request.ProductType,  // 1 → ProductType.Package
        RecipeId = request.RecipeId,
        RecipeUnitsQuantity = request.RecipeUnits,
        PackagingId = request.PackagingId,
        PackagingTimeMinutes = request.PackagingTimeMinutes,
        ProfitMarginPercent = request.ProfitMarginPercent,
        ManualSellingPrice = request.ManualSellingPrice
    };

    // Save image
    if (request.imageFile != null)
    {
        var fileName = Guid.NewGuid() + ".jpg";
        // ... save file ...
        product.ImageUrl = $"/uploads/products/{fileName}";
    }

    // Add to DB
    _db.Products.Add(product);
    await _db.SaveChangesAsync();  // Gets auto-generated ID

    // Create PackageItems if Package type
    if (request.PackageItems != null && request.PackageItems.Count > 0)
    {
        foreach (var itemRequest in request.PackageItems)
        {
            _db.PackageItems.Add(new PackageItem
            {
                ProductId = product.Id,  // Link to the product we just created
                RecipeId = itemRequest.RecipeId,  // ← KEY: RecipeId (not ProductId!)
                Quantity = itemRequest.Quantity
            });
        }
        await _db.SaveChangesAsync();
    }

    // Create AdditionalPackaging if provided
    if (request.AdditionalPackaging != null)
    {
        foreach (var packagingRequest in request.AdditionalPackaging)
        {
            _db.ProductAdditionalPackagings.Add(new ProductAdditionalPackaging
            {
                ProductId = product.Id,
                PackagingId = packagingRequest.PackagingId,
                Quantity = packagingRequest.Quantity
            });
        }
        await _db.SaveChangesAsync();
    }

    return product;
}
```

### 6️⃣ **Database Result**
```
┌─────────────────────┐
│     Products        │
├──────────┬──────────┤
│ Id = 42  │          │
│ Name = "עוגיות מארז"│
│ Type = 1 (Package)  │
│ ImageUrl = "..."    │
└──────────┴──────────┘
        │
        ├──→ ┌─────────────────────┐
        │    │   PackageItems      │
        │    ├──────────┬──────────┤
        │    │ ProductId = 42      │
        │    │ RecipeId = 2        │  ← Links to Recipes table
        │    │ Quantity = 1        │
        │    ├──────────┬──────────┤
        │    │ ProductId = 42      │
        │    │ RecipeId = 5        │  ← Links to Recipes table
        │    │ Quantity = 2        │
        │    └─────────────────────┘
        │
        └──→ ┌───────────────────────────┐
             │ ProductAdditionalPackagings│
             ├──────────┬────────────────┤
             │ProductId = 42             │
             │PackagingId = 1            │
             │Quantity = 3               │
             └─────────────────────────────┘
```

---

## 🔑 KEY INSIGHTS

### Named Indices Pattern
```
PackageItems[0].RecipeId  ← ASP.NET parses [0] to understand array index
PackageItems[1].RecipeId  ← Creates array with 2 elements

AdditionalPackaging[0].PackagingId
AdditionalPackaging[1].PackagingId  ← Can have different array sizes
```

### Type Conversion
```
FormData sends:  strings  "1", "2.5", "צריפה"
ASP.NET converts to: int, decimal, string automatically based on property types
```

### Model Binder Requirements
1. Nested classes must be **public**
2. Properties must have **public getters/setters**
3. Collections must be **List<T>** (not IEnumerable, not arrays)
4. Properties without setters are ignored

---

## ✅ UPDATE PAYLOAD

For editing, the client sends a simpler **JSON** payload (not FormData):

```javascript
PUT /api/products/42
Content-Type: application/json

{
  "id": 42,
  "name": "עוגיות מארז",
  "description": "מארז צילום יום הולדת",
  "productType": 1,
  "recipeId": null,
  "recipeUnitsQuantity": 1,
  "packagingId": null,
  "packagingTimeMinutes": 10,
  "imageUrl": "/uploads/products/abc123.jpg",
  "profitMarginPercent": 0.15,
  "manualSellingPrice": null,
  "category": "מארז יום הולדת",
  "packageItems": [
    { "recipeId": 2, "quantity": 1 },
    { "recipeId": 5, "quantity": 2 }
  ],
  "additionalPackaging": [
    { "packagingId": 1, "quantity": 3 }
  ]
}
```

Server endpoint:
```csharp
[HttpPut("{id}")]
public async Task<IActionResult> Update(int id, [FromBody] Product product)
{
    product.Id = id;  // Ensure ID matches
    _db.Products.Update(product);
    await _db.SaveChangesAsync();
    // EF Core cascade-updates related PackageItems and ProductAdditionalPackagings
}
```

---

## 🐛 Current Issue: Database Migration Needed

The **database schema** hasn't been updated yet. The table has:
- `PackageItems.ItemProductId` ❌ (old column)

But the code expects:
- `PackageItems.RecipeId` ✅ (new column)

**Next Step**: Run migration to change the schema.

