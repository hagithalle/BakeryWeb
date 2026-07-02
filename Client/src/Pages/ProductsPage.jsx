// ProductsPage.jsx
import React, { useMemo, useState } from "react";
import {
  Box,
  Typography,
  FormControl,
  Select,
  MenuItem,
  TextField,
  InputAdornment,
  IconButton,
  Card,
  CardMedia,
  Chip,
  Divider,
  Alert,
} from "@mui/material";

import CloseIcon from "@mui/icons-material/Close";
import searchIconSvg from "../assets/icons/actions/search-icon.svg";
import editIconSvg   from "../assets/icons/actions/edit-icon.svg";
import deleteIconSvg from "../assets/icons/actions/delete-icon.svg";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

import PageHeader from "../Components/Common/PageHeader";
import PageContainer from "../Components/Common/PageContainer";
import PageLoader from "../Components/Common/PageLoader";
import PageError from "../Components/Common/PageError";
import FilterBar from "../Components/FilterBar";
import productsHeaderIcon from "../assets/decor/page-headers/products-header-icon.svg";
import addProductIcon from "../assets/icons/actions/add-new-product.svg";
import AddProductDialog from "../Components/AddProductDialog";

import {
  fetchProducts,
  createProductWithImage,
  editProduct,
  deleteProduct,
} from "../Services/productService";
import { getAllRecipes } from "../Services/RecipeService";
import { fetchPackaging, addPackaging } from "../Services/packagingService";

import { useLanguage } from "../context/LanguageContext";
import useLocaleStrings from "../hooks/useLocaleStrings";

// ===== helpers =====
const getField = (obj, camelKey, pascalKey) =>
  obj?.[camelKey] ?? obj?.[pascalKey];

const toNumber = (value) => Number(value || 0);

const formatCurrency = (value) => `₪${toNumber(value).toFixed(2)}`;

// בניית ערכי ההתחלה לטופס עריכת מוצר
const buildInitialValues = (product) => {
  if (!product) return null;

  const productTypeValue = Number(
    getField(product, "productType", "ProductType") ?? 0
  );
  const productType = productTypeValue === 1 ? "package" : "single";

  const recipeUnitsQuantity =
    getField(product, "unitConversionRate", "UnitConversionRate") || 1;

  const packageItems =
    product.packageItems || product.PackageItems || [];
  const mappedPackageItems = packageItems.map((item) => ({
    recipeId:
      getField(item, "recipeId", "RecipeId") ??
      getField(item, "productId", "ProductId") ??
      null,
    quantity: Number(getField(item, "quantity", "Quantity") || 1),
  }));

  const additionalPackaging =
    product.additionalPackaging || product.AdditionalPackaging || [];
  const mappedAdditionalPackaging = additionalPackaging.map((item) => ({
    packagingId: getField(item, "packagingId", "PackagingId"),
    quantity: Number(getField(item, "quantity", "Quantity") || 1),
  }));

  return {
    id: getField(product, "id", "Id"),
    name: getField(product, "name", "Name") || "",
    description: getField(product, "description", "Description") || "",
    productType,
    recipeId: getField(product, "recipeId", "RecipeId") || "",
    recipeUnits: recipeUnitsQuantity,
    unitConversionRate: recipeUnitsQuantity,
    saleUnitType: getField(product, "saleUnitType", "SaleUnitType") ?? 0,
    packageItems: mappedPackageItems,
    category: getField(product, "category", "Category") || "",
    additionalPackaging: mappedAdditionalPackaging,
    packagingId: getField(product, "packagingId", "PackagingId") || null,
    packagingTimeMinutes:
      getField(product, "packagingTimeMinutes", "PackagingTimeMinutes") || 0,
    profitMarginPercent:
      toNumber(
        getField(product, "profitMarginPercent", "ProfitMarginPercent")
      ) * 100,
    manualSellingPrice:
      getField(product, "manualSellingPrice", "ManualSellingPrice") || "",
    imageUrl: getField(product, "imageUrl", "ImageUrl") || "",
  };
};

// payload לעדכון מוצר קיים
const buildUpdatePayload = (productData, existingProduct) => {
  const productTypeValue = productData.productType === "package" ? 1 : 0;

  const packageItems =
    productTypeValue === 1
      ? (productData.packageItems || []).map((item) => ({
          recipeId: Number(item.recipeId ?? item.productId),
          quantity: Number(item.quantity) || 1,
        }))
      : [];

  const additionalPackaging = (productData.additionalPackaging || []).map(
    (item) => ({
      packagingId: Number(item.packagingId),
      quantity: Number(item.quantity) || 1,
    })
  );

  return {
    id: existingProduct.id,
    name: productData.name,
    description: productData.description,
    category: productData.category,
    productType: productTypeValue,
    recipeId: productTypeValue === 0 ? Number(productData.recipeId) : null,
    unitConversionRate:
      productTypeValue === 0 ? Number(productData.recipeUnits || 1) : 1,
    saleUnitType:
      productTypeValue === 0 ? Number(productData.saleUnitType ?? 0) : 0,
    packagingId: existingProduct.packagingId || null,
    packagingTimeMinutes: Number(productData.packagingTimeMinutes) || 0,
    imageUrl: existingProduct.imageUrl || null,
    profitMarginPercent: productData.profitMarginPercent,
    manualSellingPrice: productData.manualSellingPrice,
    packageItems,
    additionalPackaging,
  };
};

export default function ProductsPage() {
  const { lang } = useLanguage();
  const strings = useLocaleStrings(lang);
  const queryClient = useQueryClient();

  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [isFormMode, setIsFormMode] = useState(false);
  const [detailsProduct, setDetailsProduct] = useState(null);

  // === queries ===
  const {
    data: products = [],
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ["products"],
    queryFn: fetchProducts,
  });

  const { data: recipes = [] } = useQuery({
    queryKey: ["recipes"],
    queryFn: getAllRecipes,
  });

  const { data: packaging = [] } = useQuery({
    queryKey: ["packaging"],
    queryFn: fetchPackaging,
  });

  // === mutations ===
  const addProductMutation = useMutation({
    mutationFn: ({ productData, imageFile }) =>
      createProductWithImage(productData, imageFile),
    onSuccess: () => {
      queryClient.invalidateQueries(["products"]);
    },
  });

  const updateProductMutation = useMutation({
    mutationFn: (payload) => editProduct(payload),
    onSuccess: () => {
      queryClient.invalidateQueries(["products"]);
    },
  });

  const deleteProductMutation = useMutation({
    mutationFn: (id) => deleteProduct(id),
    onSuccess: () => {
      queryClient.invalidateQueries(["products"]);
    },
  });

  const addPackagingMutation = useMutation({
    mutationFn: (packagingData) => addPackaging(packagingData),
    onSuccess: () => {
      queryClient.invalidateQueries(["packaging"]);
    },
  });

  // === handlers ===
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
    const confirmDelete = window.confirm(
      `למחוק את המוצר "${productName}"?`
    );
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

  const handleSaveProduct = async (productData) => {
    // עדכון
    if (selectedProduct?.id) {
      const updatePayload = buildUpdatePayload(productData, selectedProduct);
      await updateProductMutation.mutateAsync(updatePayload);
      setIsFormMode(false);
      setSelectedProduct(null);
      return;
    }

    // הוספה
    const imageFile = productData.imageFile;
    const cleanData = { ...productData };
    delete cleanData.imageFile;

    await addProductMutation.mutateAsync({
      productData: cleanData,
      imageFile,
    });
    setIsFormMode(false);
    setSelectedProduct(null);
  };

  // רשימת מוצרים מסוננת + ממופה
  const filteredProducts = useMemo(() => {
    return (products || [])
      .filter((p) => {
        const name = (getField(p, "name", "Name") || "").toLowerCase();
        const recipe = getField(p, "recipe", "Recipe");
        const category =
          getField(p, "category", "Category") ||
          recipe?.category ||
          recipe?.Category ||
          "";
        const productTypeValue = Number(
          getField(p, "productType", "ProductType") ?? 0
        );

        const matchesSearch = name.includes(search.toLowerCase());
        const matchesCategory =
          categoryFilter === "all" || category === categoryFilter;
        const matchesType =
          typeFilter === "all" ||
          (typeFilter === "single" && productTypeValue === 0) ||
          (typeFilter === "package" && productTypeValue === 1);

        return matchesSearch && matchesCategory && matchesType;
      })
      .map((p) => {
        const name = getField(p, "name", "Name") || "";
        const recipe = getField(p, "recipe", "Recipe");
        const recipeName = recipe?.name || recipe?.Name || "";
        const category =
          getField(p, "category", "Category") ||
          recipe?.category ||
          recipe?.Category ||
          "";
        const productTypeValue = Number(
          getField(p, "productType", "ProductType") ?? 0
        );
        const productTypeLabel =
          productTypeValue === 1 ? "מארז" : "מוצר בודד";
        const recipeUnits =
          getField(p, "unitConversionRate", "UnitConversionRate") || 1;

        const ingredientsCost = toNumber(
          getField(p, "recipeIngredientsCost", "RecipeIngredientsCost")
        );
        const packagingCost = toNumber(
          getField(p, "packagingCost", "PackagingCost")
        );
        const recipeLabor = toNumber(
          getField(p, "recipeLaborCost", "RecipeLaborCost")
        );
        const packagingLabor = toNumber(
          getField(p, "packagingLaborCost", "PackagingLaborCost")
        );
        const recipeOverhead = toNumber(
          getField(p, "recipeOverheadCost", "RecipeOverheadCost")
        );
        const packagingOverhead = toNumber(
          getField(p, "packagingOverheadCost", "PackagingOverheadCost")
        );
        const totalCost = toNumber(getField(p, "totalCost", "TotalCost"));

        const profitPercent =
          toNumber(
            getField(p, "profitMarginPercent", "ProfitMarginPercent")
          ) * 100;
        const sellingWithVat = toNumber(
          getField(p, "sellingPriceWithVAT", "SellingPriceWithVAT")
        );

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
          raw: p,
        };
      });
  }, [products, search, categoryFilter, typeFilter]);

  if (isLoading) return <PageLoader />;
  if (error) return <PageError onRetry={refetch} />;

  // ================== RENDER ==================
  return (
    <PageContainer>
      {!isFormMode ? (
        // ===== תצוגת רשימת מוצרים =====
        <>
          <PageHeader
            title={strings.sidebar?.products || "מוצרים"}
            subtitle={strings.product?.subtitle || "ניהול מוצרים ואריזות למכירה"}
            illustration={productsHeaderIcon}
            actionLabel={strings.product?.add || "הוסף מוצר"}
            actionIcon={addProductIcon}
            onActionClick={() => {
              setSelectedProduct(null);
              setIsFormMode(true);
            }}
          />
    
            <FilterBar
              search={search}
              onSearchChange={setSearch}
              searchLabel="חיפוש מוצר..."
              filters={[
                {
                  value: categoryFilter,
                  onChange: setCategoryFilter,
                  options: [
                    { value: "מארז יום הולדת", label: "מארז יום הולדת" },
                    { value: "מארז יום אהבה", label: "מארז יום אהבה" },
                    { value: "מארז פורים", label: "מארז פורים" },
                    { value: "מארז חג", label: "מארז חג" },
                    { value: "מארז כללי", label: "מארז כללי" },
                    { value: "אחר", label: "אחר" },
                  ],
                  label: "קטגוריות"
                },
                {
                  value: typeFilter,
                  onChange: setTypeFilter,
                  options: [
                    { value: "single", label: "מוצר בודד" },
                    { value: "package", label: "מארז" },
                  ],
                  label: "סוג מוצר"
                }
              ]}
            />


          {/* רשימת כרטיסים */}
          {filteredProducts.length > 0 ? (
            <Box>
              <Typography
                variant="subtitle1"
                sx={{ fontWeight: 600, mb: 2, color: "#7B5B4B" }}
              >
                מוצרים קיימים ({filteredProducts.length})
              </Typography>

              {filteredProducts.map((item) => {
                const {
                  id,
                  name,
                  categoryLabel,
                  productTypeLabel,
                  sellingPrice,
                  ingredientsCost,
                  packagingCost,
                  laborCost,
                  profitPercent,
                  raw: product,
                } = item;

                const productId = id;
                const productName = name || "ללא שם";
                const productImageUrl =
                  product.imageUrl ?? product.ImageUrl;
                const productPrice = sellingPrice || 0;
                const isExpanded =
                  detailsProduct?.id === productId ||
                  detailsProduct?.Id === productId;

                return (
                  <Card
                    key={productId}
                    sx={{
                      mb: 2,
                      borderRadius: 2,
                      backgroundColor: "#FEFEFE",
                      boxShadow: isExpanded
                        ? "0 8px 24px rgba(201, 137, 41, 0.3)"
                        : "0 2px 8px rgba(0,0,0,0.1)",
                      transition: "all 0.3s ease",
                      cursor: "pointer",
                      maxHeight: isExpanded ? "600px" : "130px",
                      overflow: "hidden",
                      "&:hover": !isExpanded
                        ? {
                            boxShadow:
                              "0 4px 12px rgba(201, 137, 41, 0.2)",
                            transform: "translateY(-2px)",
                          }
                        : {},
                    }}
                  >
                    {isExpanded ? (
                      // ===== כרטיס מורחב =====
                      <Box
                        sx={{
                          p: 2.5,
                          display: "flex",
                          flexDirection: "column",
                          gap: 2,
                        }}
                      >
                        {/* Header */}
                        <Box
                          sx={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "flex-start",
                          }}
                        >
                          <IconButton
                            size="small"
                            onClick={() => setDetailsProduct(null)}
                            sx={{ color: "#999" }}
                          >
                            <CloseIcon fontSize="small" />
                          </IconButton>

                          <Box sx={{ flex: 1, mx: 2 }}>
                            <Typography
                              variant="h5"
                              sx={{
                                fontWeight: 700,
                                color: "#5D4037",
                                mb: 1,
                                textAlign: "center",
                              }}
                            >
                              {productName}
                            </Typography>

                            {/* תגיות */}
                            <Box
                              sx={{
                                display: "flex",
                                gap: 1,
                                justifyContent: "center",
                                mb: 1,
                              }}
                            >
                              <Chip
                                label={productTypeLabel}
                                size="small"
                                sx={{
                                  bgcolor: "#E8D4C4",
                                  color: "#5D4037",
                                  fontWeight: 600,
                                  fontSize: "0.75rem",
                                }}
                              />
                              <Chip
                                label={categoryLabel}
                                size="small"
                                sx={{
                                  bgcolor: "#C98929",
                                  color: "#fff",
                                  fontWeight: 600,
                                  fontSize: "0.75rem",
                                }}
                              />
                            </Box>

                            {/* תיאור */}
                            {(product.description || product.Description) && (
                              <Typography
                                variant="body2"
                                sx={{
                                  color: "#7B5B4B",
                                  textAlign: "center",
                                  fontStyle: "italic",
                                  px: 2,
                                }}
                              >
                                {product.description ||
                                  product.Description}
                              </Typography>
                            )}
                          </Box>

                          <Box sx={{ display: "flex", gap: 0.5 }}>
                            <IconButton
                              size="small"
                              onClick={() => handleEditProduct(product)}
                              sx={{
                                color: "#C98929",
                                bgcolor: "rgba(201, 137, 41, 0.1)",
                                "&:hover": {
                                  bgcolor: "rgba(201, 137, 41, 0.2)",
                                },
                              }}
                              title="ערוך"
                            >
                              <Box component="img" src={editIconSvg} alt="" sx={{ width: 16, height: 16, objectFit: 'contain' }} />
                            </IconButton>

                            <IconButton
                              size="small"
                              onClick={() => {
                                handleDeleteProduct(product);
                                setDetailsProduct(null);
                              }}
                              sx={{
                                color: "#D32F2F",
                                bgcolor: "rgba(211, 47, 47, 0.1)",
                                "&:hover": {
                                  bgcolor: "rgba(211, 47, 47, 0.2)",
                                },
                              }}
                              title="מחק"
                            >
                              <Box component="img" src={deleteIconSvg} alt="" sx={{ width: 16, height: 16, objectFit: 'contain' }} />
                            </IconButton>
                          </Box>
                        </Box>

                        <Divider />

                        {/* תוכן הכרטיס המורחב – עלויות / מחיר / רווח */}
                        <Box
                          sx={{
                            bgcolor: "#FFF8F3",
                            p: 2,
                            borderRadius: 2,
                            border: "2px solid #E8D4C4",
                          }}
                        >
                          {/* עלויות */}
                          <Box
                            sx={{
                              display: "flex",
                              flexDirection: "column",
                              gap: 1,
                              mb: 1.5,
                            }}
                          >
                            <Box
                              sx={{
                                display: "flex",
                                justifyContent: "space-between",
                                alignItems: "center",
                              }}
                            >
                              <Typography
                                variant="body2"
                                sx={{ color: "#7B5B4B" }}
                              >
                                עלות בסיס
                              </Typography>
                              <Typography
                                variant="body2"
                                sx={{
                                  color: "#971936",
                                  fontWeight: 600,
                                }}
                              >
                                {formatCurrency(ingredientsCost)}
                              </Typography>
                            </Box>

                            <Box
                              sx={{
                                display: "flex",
                                justifyContent: "space-between",
                                alignItems: "center",
                              }}
                            >
                              <Typography
                                variant="body2"
                                sx={{ color: "#7B5B4B" }}
                              >
                                עלות אריזה
                              </Typography>
                              <Typography
                                variant="body2"
                                sx={{
                                  color: "#971936",
                                  fontWeight: 600,
                                }}
                              >
                                {formatCurrency(packagingCost)}
                              </Typography>
                            </Box>

                            <Box
                              sx={{
                                display: "flex",
                                justifyContent: "space-between",
                                alignItems: "center",
                              }}
                            >
                              <Typography
                                variant="body2"
                                sx={{ color: "#7B5B4B" }}
                              >
                                עלות זמן עבודה
                              </Typography>
                              <Typography
                                variant="body2"
                                sx={{
                                  color: "#971936",
                                  fontWeight: 600,
                                }}
                              >
                                {formatCurrency(laborCost)}
                              </Typography>
                            </Box>
                          </Box>

                          {/* מחיר מכירה */}
                          <Box
                            sx={{
                              bgcolor: "#FFF8F3",
                              p: 2.5,
                              borderRadius: 2,
                              mb: 1.5,
                              border: "2px solid #971936",
                              boxShadow:
                                "0 2px 8px rgba(151, 25, 54, 0.15)",
                            }}
                          >
                            <Typography
                              variant="body2"
                              sx={{
                                color: "#7B5B4B",
                                display: "block",
                                mb: 0.5,
                                textAlign: "center",
                                fontWeight: 600,
                              }}
                            >
                              מחיר מכירה
                            </Typography>
                            <Typography
                              variant="h3"
                              sx={{
                                color: "#971936",
                                fontWeight: 900,
                                textAlign: "center",
                                fontSize: "2.5rem",
                              }}
                            >
                              {formatCurrency(productPrice)}
                            </Typography>
                          </Box>

                          {/* רווח */}
                          <Box
                            sx={{
                              bgcolor: "#E8F5E9",
                              p: 1.5,
                              borderRadius: 2,
                              textAlign: "center",
                            }}
                          >
                            <Typography
                              variant="body2"
                              sx={{
                                color: "#4CAF50",
                                fontWeight: 600,
                                mb: 0.5,
                              }}
                            >
                              רווח
                            </Typography>
                            <Typography
                              variant="h6"
                              sx={{
                                color: "#4CAF50",
                                fontWeight: 700,
                              }}
                            >
                              {profitPercent.toFixed(1)}%
                              <Box
                                component="span"
                                sx={{ fontSize: "1rem" }}
                              >
                                ↗
                              </Box>
                            </Typography>
                          </Box>
                        </Box>
                      </Box>
                    ) : (
                      // ===== כרטיס מקובץ =====
                      <Box
                        sx={{
                          display: "flex",
                          p: 1.5,
                          gap: 2,
                          alignItems: "center",
                          height: "100%",
                        }}
                      >
                        {/* תמונה */}
                        <Box
                          sx={{
                            width: 80,
                            height: 80,
                            bgcolor: "#F5E6D3",
                            borderRadius: 2,
                            overflow: "hidden",
                            flexShrink: 0,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                          }}
                        >
                          {productImageUrl ? (
                            <CardMedia
                              component="img"
                              image={productImageUrl}
                              alt={productName}
                              sx={{
                                width: "100%",
                                height: "100%",
                                objectFit: "cover",
                              }}
                            />
                          ) : (
                            <Typography
                              sx={{
                                color: "#C98929",
                                fontSize: "2rem",
                              }}
                            >
                              🍰
                            </Typography>
                          )}
                        </Box>

                        {/* תוכן קצר */}
                        <Box
                          sx={{ flex: 1, minWidth: 0 }}
                          onClick={() => handleViewDetails(product)}
                        >
                          <Typography
                            variant="h6"
                            sx={{
                              fontWeight: 700,
                              color: "#5D4037",
                              mb: 0.5,
                              wordBreak: "break-word",
                            }}
                          >
                            {productName}
                          </Typography>
                          <Typography
                            variant="body2"
                            sx={{
                              color: "#971936",
                              fontWeight: 600,
                              fontSize: "1.1rem",
                            }}
                          >
                            {formatCurrency(productPrice)}
                          </Typography>
                        </Box>

                        {/* כפתורים */}
                        <Box
                          sx={{
                            display: "flex",
                            gap: 0.5,
                            flexShrink: 0,
                          }}
                        >
                          <IconButton
                            onClick={(e) => {
                              e.stopPropagation();
                              handleViewDetails(product);
                            }}
                            size="small"
                            sx={{
                              color: "#9B5A25",
                              bgcolor: "#FFF8F3",
                              "&:hover": {
                                bgcolor: "#FFE8D6",
                              },
                            }}
                            title="הרחב"
                          >
                            <Box component="img" src={editIconSvg} alt="" sx={{ width: 16, height: 16, objectFit: 'contain' }} />
                          </IconButton>
                          <IconButton
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteProduct(product);
                            }}
                            size="small"
                            sx={{
                              color: "#D32F2F",
                              bgcolor: "#FFF8F3",
                              "&:hover": {
                                bgcolor: "#FFEBEE",
                              },
                            }}
                            title="מחיקה"
                          >
                            <Box component="img" src={deleteIconSvg} alt="" sx={{ width: 16, height: 16, objectFit: 'contain' }} />
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
              אין מוצרים קיימים. לחצי על "הוסף מוצר" כדי להתחיל
            </Alert>
          )}
        </>
      ) : (
        // ===== מצב טופס (הוספה/עריכה) =====
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
          strings={strings}
        />
      )}
    </PageContainer>
  );
}