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
  InputAdornment
} from "@mui/material";
import AddButton from "../Components/AddButton";
import SearchIcon from '@mui/icons-material/Search';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { fetchProducts, recalculateProductPrice, createProductWithImage } from "../Services/productService";
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
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);

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
      setIsAddDialogOpen(false);
    }
  });

  const addPackagingMutation = useMutation({
    mutationFn: addPackaging,
    onSuccess: () => {
      queryClient.invalidateQueries(['packaging']);
    }
  });

  const handleSaveProduct = async (productData) => {
    const imageFile = productData.imageFile;
    delete productData.imageFile; // הסר את imageFile מה-object, הוא יישלח בנפרד
    await addProductMutation.mutateAsync({ productData, imageFile });
  };

  const handleAddPackaging = async (packagingData) => {
    await addPackagingMutation.mutateAsync(packagingData);
  };

  const filteredProducts = useMemo(() => {
    return (products || [])
      .filter(p => {
        const name = getField(p, "name", "Name") || "";
        return name.includes(search);
      })
      .map(p => {
        const name = getField(p, "name", "Name") || "";
        const recipe = getField(p, "recipe", "Recipe");
        const recipeName = recipe?.name || recipe?.Name || "";
        const recipeUnits = getField(p, "recipeUnitsQuantity", "RecipeUnitsQuantity") || 1;

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
          recipeUnits,
          ingredientsCost,
          packagingCost,
          laborCost: recipeLabor + packagingLabor,
          overheadCost: recipeOverhead + packagingOverhead,
          totalCost,
          profitPercent,
          sellingPrice: sellingWithVat
        };
      });
  }, [products, search]);

  if (isLoading) return <Box sx={{ p: 3 }}>טוען...</Box>;
  if (error) return <Box sx={{ p: 3 }}>שגיאה בטעינת נתונים</Box>;

  return (
    <Box sx={{ backgroundColor: 'transparent', minHeight: '100vh' }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box />       
        <AddButton onClick={() => setIsAddDialogOpen(true)}>
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
            <MenuItem value="עוגיות">עוגיות</MenuItem>
            <MenuItem value="עוגות">עוגות</MenuItem>
            <MenuItem value="מאפים">מאפים</MenuItem>
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

      {/* Products Grid */}
      <Grid container spacing={3}>
        {filteredProducts.length === 0 ? (
          <Grid item xs={12}>
            <Paper sx={{ p: 4, textAlign: 'center', borderRadius: 3 }}>
              <Typography sx={{ color: '#8D6E63' }}>
                אין מוצרים להצגה
              </Typography>
            </Paper>
          </Grid>
        ) : (
          filteredProducts.map((product) => (
            <Grid item xs={12} sm={6} md={4} key={product.id}>
              <Card 
                sx={{ 
                  borderRadius: 3, 
                  boxShadow: '0 2px 8px rgba(151, 25, 54, 0.1)',
                  transition: 'transform 0.2s, box-shadow 0.2s',
                  borderLeft: '4px solid #C98929',
                  bgcolor: '#FEFEFE',
                  '&:hover': {
                    transform: 'translateY(-4px)',
                    boxShadow: '0 4px 12px rgba(151, 25, 54, 0.2)'
                  }
                }}
              >
                <CardContent sx={{ p: 3 }}>
                  {/* Product Name */}
                  <Typography 
                    variant="h6" 
                    sx={{ 
                      color: '#971936',
                      fontWeight: 700,
                      mb: 1,
                      textAlign: 'right'
                    }}
                  >
                    {product.name}
                  </Typography>

                  {/* Tags */}
                  <Box sx={{ display: 'flex', gap: 1, mb: 2, justifyContent: 'flex-end', flexWrap: 'wrap' }}>
                    <Chip 
                      label="עוגיות" 
                      size="small"
                      sx={{ 
                        backgroundColor: '#D2A5A0',
                        color: '#971936',
                        fontSize: '0.75rem'
                      }}
                    />
                    <Chip 
                      label="מוצר בודד" 
                      size="small"
                      variant="outlined"
                      sx={{ 
                        borderColor: '#C98929',
                        color: '#9B5A25',
                        fontSize: '0.75rem'
                      }}
                    />
                  </Box>

                  {/* Cost Breakdown */}
                  <Paper 
                    elevation={0}
                    sx={{ 
                      backgroundColor: '#FFF8F3',
                      p: 2,
                      mb: 2,
                      borderRadius: 2
                    }}
                  >
                    <Typography 
                      variant="subtitle2" 
                      sx={{ 
                        color: '#971936',
                        fontWeight: 600,
                        mb: 1.5,
                        textAlign: 'right'
                      }}
                    >
                      מאדרה עוגיות
                    </Typography>
                    
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                        <Typography variant="body2" sx={{ color: '#971936' }}>
                          {formatCurrency(product.ingredientsCost)}
                        </Typography>
                        <Typography variant="body2" sx={{ color: '#9B5A25' }}>
                          עלות בסיס
                        </Typography>
                      </Box>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                        <Typography variant="body2" sx={{ color: '#971936' }}>
                          {formatCurrency(product.packagingCost)}
                        </Typography>
                        <Typography variant="body2" sx={{ color: '#9B5A25' }}>
                          אריזה
                        </Typography>
                      </Box>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                        <Typography variant="body2" sx={{ color: '#971936' }}>
                          {formatCurrency(product.laborCost)}
                        </Typography>
                        <Typography variant="body2" sx={{ color: '#9B5A25' }}>
                          מדבקה
                        </Typography>
                      </Box>
                      <Box 
                        sx={{ 
                          display: 'flex', 
                          justifyContent: 'space-between',
                          pt: 1,
                          mt: 1,
                          borderTop: '1px solid #D2A5A0'
                        }}
                      >
                        <Typography variant="body2" sx={{ color: '#971936', fontWeight: 700 }}>
                          {formatCurrency(product.totalCost)}
                        </Typography>
                        <Typography variant="body2" sx={{ color: '#971936', fontWeight: 700 }}>
                          סה"כ עלות
                        </Typography>
                      </Box>
                    </Box>
                  </Paper>

                  {/* Selling Price */}
                  <Box 
                    sx={{ 
                      display: 'flex', 
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      mb: 2
                    }}
                  >
                    <Typography 
                      variant="h5" 
                      sx={{ 
                        color: '#971936',
                        fontWeight: 700
                      }}
                    >
                      {formatCurrency(product.sellingPrice)}
                    </Typography>
                    <Typography 
                      variant="body2" 
                      sx={{ 
                        color: '#9B5A25'
                      }}
                    >
                      מחיר מכירה
                    </Typography>
                  </Box>

                  {/* Profit */}
                  <Box 
                    sx={{ 
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 1
                    }}
                  >
                    <TrendingUpIcon 
                      sx={{ 
                        color: '#4CAF50',
                        fontSize: '1rem'
                      }}
                    />
                    <Typography 
                      variant="h6" 
                      sx={{ 
                        color: '#4CAF50',
                        fontWeight: 700
                      }}
                    >
                      {product.profitPercent.toFixed(1)}%
                    </Typography>
                    <Typography 
                      variant="body2" 
                      sx={{ 
                        color: '#4CAF50'
                      }}
                    >
                      רווח
                    </Typography>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))
        )}
      </Grid>

      {/* Add Product Dialog */}
      <AddProductDialog
        open={isAddDialogOpen}
        onClose={() => setIsAddDialogOpen(false)}
        onSave={handleSaveProduct}
        onAddPackaging={handleAddPackaging}
        recipes={recipes}
        products={products}
        packaging={packaging}
        strings={{}}
      />
    </Box>
  );
}
