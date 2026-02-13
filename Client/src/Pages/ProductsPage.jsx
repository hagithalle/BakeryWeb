import React, { useMemo, useState } from "react";
import {
  Box,
  Typography,
  Paper,
  TextField,
  MenuItem,
  Select,
  FormControl,
  Chip,
  Card,
  CardContent,
  Grid,
  InputAdornment,
  IconButton,
  Button,
  Alert,
  CardMedia,
  Divider
} from "@mui/material";
import AddButton from "../Components/AddButton";
import SearchIcon from '@mui/icons-material/Search';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import CloseIcon from '@mui/icons-material/Close';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { fetchProducts, recalculateProductPrice, createProductWithImage, editProduct, deleteProduct } from "../Services/productService";
import { getAllRecipes } from "../Services/RecipeService";
import { fetchPackaging, addPackaging } from "../Services/packagingService";
import AddProductDialog from "../Components/AddProductDialog";

const getField = (obj, camelKey, pascalKey) => obj?.[camelKey] ?? obj?.[pascalKey];

const toNumber = (value) => Number(value || 0);

const formatCurrency = (value) => `₪${toNumber(value).toFixed(2)}`;

export default function ProductsPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [isFormMode, setIsFormMode] = useState(false);
  const [detailsProduct, setDetailsProduct] = useState(null);

  const { data: products = [], isLoading, error } = useQuery({
    queryKey: ['products'],
    queryFn: fetchProducts
  });

  const { data: recipes = [] } = useQuery({
    queryKey: ['recipes'],
    queryFn: getAllRecipes
  });

  const { data: packaging = [] } = useQuery({
    queryKey: ['packaging'],
    queryFn: fetchPackaging
  });

  const recalcMutation = useMutation({
    mutationFn: recalculateProductPrice,
    onSuccess: () => {
      queryClient.invalidateQueries(['products']);
    }
  });

  const addProductMutation = useMutation({
    mutationFn: async ({ productData, imageFile }) => {
      return await createProductWithImage(productData, imageFile);
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['products']);
      setIsFormMode(false);
      setSelectedProduct(null);
    }
  });

  const updateProductMutation = useMutation({
    mutationFn: editProduct,
    onSuccess: () => {
      queryClient.invalidateQueries(['products']);
      setIsFormMode(false);
      setSelectedProduct(null);
    }
  });

  const deleteProductMutation = useMutation({
    mutationFn: deleteProduct,
    onSuccess: () => {
      queryClient.invalidateQueries(['products']);
    }
  });

  const addPackagingMutation = useMutation({
    mutationFn: addPackaging,
    onSuccess: () => {
      queryClient.invalidateQueries(['packaging']);
    }
  });

  const getProductNameById = (id) => {
    const match = products.find(p => getField(p, "id", "Id") === id);
    return getField(match, "name", "Name") || "";
  };

  const getPackagingById = (id) => {
    return packaging.find(p => getField(p, "id", "Id") === id) || null;
  };

  const getRecipeNameById = (id) => {
    const match = recipes.find(r => getField(r, "id", "Id") === id);
    return getField(match, "name", "Name") || "";
  };

  const buildInitialValues = (product) => {
    const productTypeValue = Number(getField(product, "productType", "ProductType") ?? 0);
    const productType = productTypeValue === 1 ? "package" : "single";
    const recipeUnitsQuantity = getField(product, "unitConversionRate", "UnitConversionRate") ?? 1;
    const packageItems = (getField(product, "packageItems", "PackageItems") || []).map(item => {
      const itemRecipeId = getField(item, "recipeId", "RecipeId")
        ?? getField(item, "itemProductId", "ItemProductId")
        ?? getField(item, "productId", "ProductId");
      const itemRecipeIdNumber = Number(itemRecipeId);
      return {
        productId: itemRecipeIdNumber,
        quantity: getField(item, "quantity", "Quantity") ?? 1,
        name: getRecipeNameById(itemRecipeIdNumber)
      };
    });
    const additionalPackaging = (getField(product, "additionalPackaging", "AdditionalPackaging") || []).map(item => {
      const packagingId = getField(item, "packagingId", "PackagingId");
      const pack = getPackagingById(packagingId);
      return {
        packagingId,
        quantity: getField(item, "quantity", "Quantity") ?? 1,
        name: pack ? getField(pack, "name", "Name") : "",
        cost: pack ? getField(pack, "cost", "Cost") : 0
      };
    });

    return {
      id: getField(product, "id", "Id"),
      name: getField(product, "name", "Name") || "",
      description: getField(product, "description", "Description") || "",
      productType,
      recipeId: getField(product, "recipeId", "RecipeId") || "",
      recipeUnits: recipeUnitsQuantity,
      unitConversionRate: recipeUnitsQuantity,
      saleUnitType: getField(product, "saleUnitType", "SaleUnitType") ?? 0,
      packageItems,
      category: getField(product, "category", "Category") || "",
      additionalPackaging,
      packagingId: getField(product, "packagingId", "PackagingId") || null,
      packagingTimeMinutes: getField(product, "packagingTimeMinutes", "PackagingTimeMinutes") || 0,
      profitMarginPercent: toNumber(getField(product, "profitMarginPercent", "ProfitMarginPercent")) * 100,
      manualSellingPrice: getField(product, "manualSellingPrice", "ManualSellingPrice") || "",
      imageUrl: getField(product, "imageUrl", "ImageUrl") || ""
    };
  };

  const buildUpdatePayload = (productData, existingProduct) => {
    const productTypeValue = productData.productType === "package" ? 1 : 0;
    const packageItems = productTypeValue === 1
      ? (productData.packageItems || []).map(item => ({
          recipeId: Number(item.recipeId ?? item.productId),
          quantity: Number(item.quantity) || 1
        }))
      : [];
    const additionalPackaging = (productData.additionalPackaging || []).map(item => ({
      packagingId: Number(item.packagingId),
      quantity: Number(item.quantity) || 1
    }));

    return {
      id: existingProduct.id,
      name: productData.name,
      description: productData.description,
      category: productData.category,
      productType: productTypeValue,
      recipeId: productTypeValue === 0 ? Number(productData.recipeId) : null,
      unitConversionRate: productTypeValue === 0 ? Number(productData.recipeUnits || 1) : 1,
      saleUnitType: productTypeValue === 0 ? Number(productData.saleUnitType ?? 0) : 0,
      packagingId: existingProduct.packagingId || null,
      packagingTimeMinutes: Number(productData.packagingTimeMinutes) || 0,
      imageUrl: existingProduct.imageUrl || null,
      profitMarginPercent: productData.profitMarginPercent,
      manualSellingPrice: productData.manualSellingPrice,
      packageItems,
      additionalPackaging
    };
  };

  const handleSaveProduct = async (productData) => {
    if (selectedProduct?.id) {
      const updatePayload = buildUpdatePayload(productData, selectedProduct);
      await updateProductMutation.mutateAsync(updatePayload);
      return;
    }

    const imageFile = productData.imageFile;
    delete productData.imageFile; // הסר את imageFile מה-object, הוא יישלח בנפרד
    await addProductMutation.mutateAsync({ productData, imageFile });
    setIsFormMode(false);
  };

  const handleViewDetails = (product) => {
    setDetailsProduct(product);
  };

  const handleEditProduct = (product) => {
    setSelectedProduct(buildInitialValues(product));
    setIsFormMode(true);
    setDetailsProduct(null);
  };

  const handleDeleteProduct = async (product) => {
    const productId = getField(product, "id", "Id");
    const productName = getField(product, "name", "Name") || "";
    const confirmDelete = window.confirm(`למחוק את המוצר "${productName}"?`);
    if (!confirmDelete) return;
    await deleteProductMutation.mutateAsync(productId);
  };

  const handleCancelForm = () => {
    setSelectedProduct(null);
    setIsFormMode(false);
  };

  const handleAddPackaging = async (packagingData) => {
    await addPackagingMutation.mutateAsync(packagingData);
  };

  const filteredProducts = useMemo(() => {
    return (products || [])
      .filter(p => {
        const name = getField(p, "name", "Name") || "";
        const recipe = getField(p, "recipe", "Recipe");
        const category = getField(p, "category", "Category") || recipe?.category || recipe?.Category || "";
        const productTypeValue = Number(getField(p, "productType", "ProductType") ?? 0);
        
        const matchesSearch = name.includes(search);
        const matchesCategory = categoryFilter === "all" || category === categoryFilter;
        const matchesType = typeFilter === "all"
          || (typeFilter === "single" && productTypeValue === 0)
          || (typeFilter === "package" && productTypeValue === 1);
        
        return matchesSearch && matchesCategory && matchesType;
      })
      .map(p => {
        const name = getField(p, "name", "Name") || "";
        const recipe = getField(p, "recipe", "Recipe");
        const recipeName = recipe?.name || recipe?.Name || "";
        const category = getField(p, "category", "Category") || recipe?.category || recipe?.Category || "";
        const productTypeValue = Number(getField(p, "productType", "ProductType") ?? 0);
        const productTypeLabel = productTypeValue === 1 ? "מארז" : "מוצר בודד";
        const recipeUnits = getField(p, "unitConversionRate", "UnitConversionRate") || 1;

        const ingredientsCost = toNumber(getField(p, "recipeIngredientsCost", "RecipeIngredientsCost"));
        const packagingCost = toNumber(getField(p, "packagingCost", "PackagingCost"));
        const recipeLabor = toNumber(getField(p, "recipeLaborCost", "RecipeLaborCost"));
        const packagingLabor = toNumber(getField(p, "packagingLaborCost", "PackagingLaborCost"));
        const recipeOverhead = toNumber(getField(p, "recipeOverheadCost", "RecipeOverheadCost"));
        const packagingOverhead = toNumber(getField(p, "packagingOverheadCost", "PackagingOverheadCost"));
        const totalCost = toNumber(getField(p, "totalCost", "TotalCost"));

        const profitPercent = toNumber(getField(p, "profitMarginPercent", "ProfitMarginPercent")) * 100;
        const sellingWithVat = toNumber(getField(p, "sellingPriceWithVAT", "SellingPriceWithVAT"));

        return {
          id: getField(p, "id", "Id"),
          name,
          recipeName,
          categoryLabel: category || "ללא קטגוריה",
          productTypeLabel,
          recipeUnits,
          ingredientsCost,
          packagingCost,
          laborCost: recipeLabor + packagingLabor,
          overheadCost: recipeOverhead + packagingOverhead,
          totalCost,
          profitPercent,
          sellingPrice: sellingWithVat,
          raw: p
        };
      });
  }, [products, search, categoryFilter, typeFilter]);

  if (isLoading) return <Box sx={{ p: 3 }}>טוען...</Box>;
  if (error) return <Box sx={{ p: 3 }}>שגיאה בטעינת נתונים</Box>;

  return (
    <Box sx={{ backgroundColor: 'transparent', minHeight: '100vh' }}>
      {!isFormMode ? (
        // ========== תצוגת רשימה כרטיסים ==========
        <>
          {/* Header */}
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
            <Box />       
            <AddButton onClick={() => {
              setSelectedProduct(null);
              setIsFormMode(true);
            }}>
              מוצר חדש
            </AddButton>
          </Box>

          {/* Search and Filter Bar */}
          <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
            <FormControl sx={{ minWidth: 200 }}>
              <Select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                displayEmpty
                size="small"
                sx={{ 
                  backgroundColor: '#FEFEFE',
                  borderRadius: 2,
                  '& .MuiOutlinedInput-notchedOutline': {
                    borderColor: '#D2A5A0'
                  }
                }}
              >
                <MenuItem value="all">כל הקטגוריות</MenuItem>
                <MenuItem value="מארז יום הולדת">מארז יום הולדת</MenuItem>
                <MenuItem value="מארז יום אהבה">מארז יום אהבה</MenuItem>
                <MenuItem value="מארז פורים">מארז פורים</MenuItem>
                <MenuItem value="מארז חג">מארז חג</MenuItem>
                <MenuItem value="מארז כללי">מארז כללי</MenuItem>
                <MenuItem value="אחר">אחר</MenuItem>
              </Select>
            </FormControl>
            <FormControl sx={{ minWidth: 200 }}>
              <Select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                displayEmpty
                size="small"
                sx={{ 
                  backgroundColor: '#FEFEFE',
                  borderRadius: 2,
                  '& .MuiOutlinedInput-notchedOutline': {
                    borderColor: '#D2A5A0'
                  }
                }}
              >
                <MenuItem value="all">כל הסוגים</MenuItem>
                <MenuItem value="single">מוצר בודד</MenuItem>
                <MenuItem value="package">מארז</MenuItem>
              </Select>
            </FormControl>
            <TextField
              placeholder="חיפוש מוצר..."
              size="small"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              sx={{ 
                flexGrow: 1,
                backgroundColor: '#FEFEFE',
                borderRadius: 2,
                '& .MuiOutlinedInput-root': {
                  borderRadius: 2,
                  '& fieldset': {
                    borderColor: '#D2A5A0'
                  }
                }
              }}
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <SearchIcon sx={{ color: '#C98929' }} />
                  </InputAdornment>
                ),
              }}
            />
          </Box>

          {/* רשימת כרטיסים של מוצרים */}
          {products && products.length > 0 ? (
            <Box>
              <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 2, color: '#7B5B4B' }}>
                מוצרים קיימים ({products.filter(p => {
                  const name = ((p.name ?? p.Name) || "").toLowerCase();
                  return name.includes(search.toLowerCase());
                }).length})
              </Typography>
              {products
                .filter(p => {
                  const name = ((p.name ?? p.Name) || "").toLowerCase();
                  return name.includes(search.toLowerCase());
                })
                .map((product) => {
                const productId = product.id ?? product.Id;
                const productName = product.name ?? product.Name ?? "ללא שם";
                const productImageUrl = product.imageUrl ?? product.ImageUrl;
                const productPrice = product.manualSellingPrice ?? product.ManualSellingPrice ?? product.sellingPrice ?? product.SellingPrice ?? 0;
                const isExpanded = detailsProduct?.id === productId || detailsProduct?.Id === productId;
                
                return (
                  <Card
                    key={productId}
                    sx={{
                      mb: 2,
                      borderRadius: 2,
                      backgroundColor: '#FEFEFE',
                      boxShadow: isExpanded ? '0 8px 24px rgba(201, 137, 41, 0.3)' : '0 2px 8px rgba(0,0,0,0.1)',
                      transition: 'all 0.3s ease',
                      cursor: 'pointer',
                      maxHeight: isExpanded ? '600px' : '130px',
                      overflow: 'hidden',
                      '&:hover': !isExpanded ? {
                        boxShadow: '0 4px 12px rgba(201, 137, 41, 0.2)',
                        transform: 'translateY(-2px)'
                      } : {}
                    }}
                  >
                    {/* הכרטיס המורחב */}
                    {isExpanded ? (
                      <Box sx={{ p: 2.5, display: 'flex', flexDirection: 'column', gap: 2 }}>
                        {/* Header עם כפתורי עריכה/מחיקה וסגירה */}
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                          <IconButton 
                            size="small"
                            onClick={() => setDetailsProduct(null)}
                            sx={{ color: '#999' }}
                          >
                            <CloseIcon fontSize="small" />
                          </IconButton>
                          <Box sx={{ flex: 1, mx: 2 }}>
                            <Typography variant="h5" sx={{ fontWeight: 700, color: '#5D4037', mb: 1, textAlign: 'center' }}>
                              {productName}
                            </Typography>
                            {/* תגיות */}
                            <Box sx={{ display: 'flex', gap: 1, justifyContent: 'center', mb: 1 }}>
                              <Chip 
                                label={product.productType === 0 || product.ProductType === 0 ? "מוצר בודד" : "מארז"}
                                size="small"
                                sx={{ 
                                  bgcolor: '#E8D4C4',
                                  color: '#5D4037',
                                  fontWeight: 600,
                                  fontSize: '0.75rem'
                                }}
                              />
                              <Chip 
                                label={product.category || product.Category || "כללי"}
                                size="small"
                                sx={{ 
                                  bgcolor: '#C98929',
                                  color: '#fff',
                                  fontWeight: 600,
                                  fontSize: '0.75rem'
                                }}
                              />
                            </Box>
                            {/* תיאור מוצר */}
                            {(product.description || product.Description) && (
                              <Typography variant="body2" sx={{ color: '#7B5B4B', textAlign: 'center', fontStyle: 'italic', px: 2 }}>
                                {product.description || product.Description}
                              </Typography>
                            )}
                          </Box>
                          <Box sx={{ display: 'flex', gap: 0.5 }}>
                            <IconButton 
                              size="small"
                              onClick={() => handleEditProduct(product)}
                              sx={{
                                color: '#C98929',
                                bgcolor: 'rgba(201, 137, 41, 0.1)',
                                '&:hover': { bgcolor: 'rgba(201, 137, 41, 0.2)' }
                              }}
                              title="ערוך"
                            >
                              <EditIcon fontSize="small" />
                            </IconButton>
                            <IconButton 
                              size="small"
                              onClick={() => {
                                handleDeleteProduct(product);
                                setDetailsProduct(null);
                              }}
                              sx={{
                                color: '#D32F2F',
                                bgcolor: 'rgba(211, 47, 47, 0.1)',
                                '&:hover': { bgcolor: 'rgba(211, 47, 47, 0.2)' }
                              }}
                              title="מחק"
                            >
                              <DeleteIcon fontSize="small" />
                            </IconButton>
                          </Box>
                        </Box>

                        <Divider />

                        {/* תוכן מוצר */}
                        <Box sx={{ bgcolor: '#FFF8F3', p: 2, borderRadius: 2, border: '2px solid #E8D4C4' }}>
                          
                          {/* עלויות */}
                          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, mb: 1.5 }}>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <Typography variant="body2" sx={{ color: '#7B5B4B' }}>עלות בסיס</Typography>
                              <Typography variant="body2" sx={{ color: '#971936', fontWeight: 600 }}>
                                ₪{parseFloat(product.recipeIngredientsCost || product.RecipeIngredientsCost || 0).toFixed(2)}
                              </Typography>
                            </Box>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <Typography variant="body2" sx={{ color: '#7B5B4B' }}>עלות אריזה</Typography>
                              <Typography variant="body2" sx={{ color: '#971936', fontWeight: 600 }}>
                                ₪{parseFloat(product.packagingCost || product.PackagingCost || 0).toFixed(2)}
                              </Typography>
                            </Box>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <Typography variant="body2" sx={{ color: '#7B5B4B' }}>עלות זמן עבודה</Typography>
                              <Typography variant="body2" sx={{ color: '#971936', fontWeight: 600 }}>
                                ₪{parseFloat(product.recipeLaborCost || product.RecipeLaborCost || 0).toFixed(2)}
                              </Typography>
                            </Box>
                          </Box>

                          {/* מחיר מכירה */}
                          <Box sx={{ 
                            bgcolor: '#FFF8F3',
                            p: 2.5,
                            borderRadius: 2,
                            mb: 1.5,
                            border: '2px solid #971936',
                            boxShadow: '0 2px 8px rgba(151, 25, 54, 0.15)'
                          }}>
                            <Typography variant="body2" sx={{ color: '#7B5B4B', display: 'block', mb: 0.5, textAlign: 'center', fontWeight: 600 }}>
                              מחיר מכירה
                            </Typography>
                            <Typography variant="h3" sx={{ color: '#971936', fontWeight: 900, textAlign: 'center', fontSize: '2.5rem' }}>
                              ₪{parseFloat(productPrice).toFixed(2)}
                            </Typography>
                          </Box>

                          {/* רווח */}
                          <Box sx={{ 
                            bgcolor: '#E8F5E9',
                            p: 1.5,
                            borderRadius: 2,
                            textAlign: 'center'
                          }}>
                            <Typography variant="body2" sx={{ color: '#4CAF50', fontWeight: 600, mb: 0.5 }}>
                              רווח
                            </Typography>
                            <Typography variant="h6" sx={{ color: '#4CAF50', fontWeight: 700 }}>
                              {(parseFloat(product.profitMarginPercent || product.ProfitMarginPercent || 0) * 100).toFixed(1)}% <Box component="span" sx={{ fontSize: '1rem' }}>↗</Box>
                            </Typography>
                          </Box>
                        </Box>

                      </Box>
                    ) : (
                      // הכרטיס המקובץ
                      <Box sx={{ display: 'flex', p: 1.5, gap: 2, alignItems: 'center', height: '100%' }}>
                        {/* תמונה */}
                        <Box
                          sx={{
                            width: 80,
                            height: 80,
                            bgcolor: '#F5E6D3',
                            borderRadius: 2,
                            overflow: 'hidden',
                            flexShrink: 0,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                          }}
                        >
                          {productImageUrl ? (
                            <CardMedia
                              component="img"
                              image={productImageUrl}
                              alt={productName}
                              sx={{ width: '100%', height: '100%', objectFit: 'cover' }}
                            />
                          ) : (
                            <Typography sx={{ color: '#C98929', fontSize: '2rem' }}>🍰</Typography>
                          )}
                        </Box>

                        {/* תוכן הכרטיס */}
                        <Box sx={{ flex: 1, minWidth: 0 }} onClick={() => handleViewDetails(product)}>
                          <Typography variant="h6" sx={{ fontWeight: 700, color: '#5D4037', mb: 0.5, wordBreak: 'break-word' }}>
                            {productName}
                          </Typography>
                          <Typography variant="body2" sx={{ color: '#971936', fontWeight: 600, fontSize: '1.1rem' }}>
                            ₪{parseFloat(productPrice).toFixed(2)}
                          </Typography>
                        </Box>

                        {/* כפתורים */}
                        <Box sx={{ display: 'flex', gap: 0.5, flexShrink: 0 }}>
                          <IconButton
                            onClick={(e) => {
                              e.stopPropagation();
                              handleViewDetails(product);
                            }}
                            size="small"
                            sx={{
                              color: '#9B5A25',
                              bgcolor: '#FFF8F3',
                              '&:hover': {
                                bgcolor: '#FFE8D6'
                              }
                            }}
                            title="הרחב"
                          >
                            <EditIcon fontSize="small" />
                          </IconButton>
                          <IconButton
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteProduct(product);
                            }}
                            size="small"
                            sx={{
                              color: '#D32F2F',
                              bgcolor: '#FFF8F3',
                              '&:hover': {
                                bgcolor: '#FFEBEE'
                              }
                            }}
                            title="מחיקה"
                          >
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </Box>
                      </Box>
                    )}
                  </Card>
                );
              })}
            </Box>
          ) : (
            <Alert severity="info" sx={{ borderRadius: 2 }}>
              אין מוצרים קיימים. לחץ על "מוצר חדש" כדי להתחיל
            </Alert>
          )}
        </>
      ) : (
        // ========== תצוגת טופס עריכה/הוספה ==========
        <AddProductDialog
          open={true}
          onClose={handleCancelForm}
          onSave={handleSaveProduct}
          onDelete={deleteProductMutation.mutateAsync}
          onAddPackaging={handleAddPackaging}
          recipes={recipes}
          products={products}
          packaging={packaging}
          initialValues={selectedProduct}
          strings={{}}
        />
      )}
    </Box>
  );
}
