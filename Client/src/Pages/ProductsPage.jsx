import React, { useMemo, useState } from "react";
import {
  Box,
  Typography,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Paper,
  Button,
  TextField,
  Switch,
  FormControlLabel,
  Chip
} from "@mui/material";
import PriceCheckIcon from '@mui/icons-material/PriceCheck';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { fetchProducts, recalculateProductPrice } from "../Services/productService";

const getField = (obj, camelKey, pascalKey) => obj?.[camelKey] ?? obj?.[pascalKey];

const toNumber = (value) => Number(value || 0);

const formatCurrency = (value) => `₪${toNumber(value).toFixed(2)}`;

export default function ProductsPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [isVatEnabled, setIsVatEnabled] = useState(false);

  const { data: products = [], isLoading, error } = useQuery({
    queryKey: ['products'],
    queryFn: fetchProducts
  });

  const recalcMutation = useMutation({
    mutationFn: recalculateProductPrice,
    onSuccess: () => {
      queryClient.invalidateQueries(['products']);
    }
  });

  const rows = useMemo(() => {
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
        const profitAmount = toNumber(getField(p, "profitAmount", "ProfitAmount"));
        const manualPrice = getField(p, "manualSellingPrice", "ManualSellingPrice");
        const sellingBeforeVat = toNumber(getField(p, "sellingPriceBeforeVAT", "SellingPriceBeforeVAT"));
        const sellingWithVat = toNumber(getField(p, "sellingPriceWithVAT", "SellingPriceWithVAT"));

        return {
          id: getField(p, "id", "Id"),
          name,
          recipeName,
          recipeUnits,
          ingredientsCost,
          packagingCost,
          laborTotal: recipeLabor + packagingLabor,
          overheadTotal: recipeOverhead + packagingOverhead,
          totalCost,
          profitPercent,
          profitAmount,
          manualPrice: manualPrice ?? null,
          sellingBeforeVat,
          sellingWithVat
        };
      });
  }, [products, search]);

  if (isLoading) return <div>טוען...</div>;
  if (error) return <div>שגיאה בטעינת נתונים</div>;

  return (
    <Box>
      <Typography variant="h5" sx={{ color: '#751B13', fontFamily: 'Suez One, serif', mb: 2 }}>
        מוצרים ותמחור
      </Typography>

      <Typography variant="body2" sx={{ color: '#5D4037', mb: 2 }}>
        המחיר נשמר במערכת עד שתבחרי לחשב מחדש. לחישוב חדש לחצי על "חשב מחיר מחדש".
      </Typography>

      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2, flexWrap: 'wrap', gap: 2 }}>
        <TextField
          label="חיפוש לפי שם מוצר"
          size="small"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          sx={{ minWidth: 220 }}
        />
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <FormControlLabel
            control={(
              <Switch
                checked={isVatEnabled}
                onChange={(event) => setIsVatEnabled(event.target.checked)}
                color="primary"
              />
            )}
            label={isVatEnabled ? 'תצוגה: כולל מע"מ' : 'תצוגה: לפני מע"מ'}
          />
          <Chip
            label={isVatEnabled ? 'מחיר פעיל: כולל מע"מ' : 'מחיר פעיל: לפני מע"מ'}
            icon={<PriceCheckIcon sx={{ color: '#751B13' }} />}
            sx={{ bgcolor: '#f5e6e0', color: '#751B13', fontWeight: 700 }}
          />
        </Box>
      </Box>

      <Paper sx={{ boxShadow: 3, borderRadius: 3, overflowX: 'auto' }}>
        <Table>
          <TableHead>
            <TableRow sx={{ background: '#f5e6e0' }}>
              <TableCell sx={{ fontWeight: 700, color: '#751B13', fontFamily: 'Suez One, serif' }}>מוצר</TableCell>
              <TableCell sx={{ fontWeight: 700, color: '#751B13', fontFamily: 'Suez One, serif' }}>מתכון</TableCell>
              <TableCell sx={{ fontWeight: 700, color: '#751B13', fontFamily: 'Suez One, serif' }}>כמות יחידות</TableCell>
              <TableCell sx={{ fontWeight: 700, color: '#751B13', fontFamily: 'Suez One, serif' }}>עלות חו"ג</TableCell>
              <TableCell sx={{ fontWeight: 700, color: '#751B13', fontFamily: 'Suez One, serif' }}>עלות אריזה</TableCell>
              <TableCell sx={{ fontWeight: 700, color: '#751B13', fontFamily: 'Suez One, serif' }}>עלות עבודה</TableCell>
              <TableCell sx={{ fontWeight: 700, color: '#751B13', fontFamily: 'Suez One, serif' }}>עלות תקורה</TableCell>
              <TableCell sx={{ fontWeight: 700, color: '#751B13', fontFamily: 'Suez One, serif' }}>סה"כ עלות</TableCell>
              <TableCell sx={{ fontWeight: 700, color: '#751B13', fontFamily: 'Suez One, serif' }}>רווח %</TableCell>
              <TableCell sx={{ fontWeight: 700, color: '#751B13', fontFamily: 'Suez One, serif' }}>רווח רצוי</TableCell>
              <TableCell sx={{ fontWeight: 700, color: '#751B13', fontFamily: 'Suez One, serif' }}>מחיר לפני מע"מ</TableCell>
              <TableCell sx={{ fontWeight: 700, color: '#751B13', fontFamily: 'Suez One, serif' }}>מחיר כולל מע"מ</TableCell>
              <TableCell sx={{ fontWeight: 700, color: '#751B13', fontFamily: 'Suez One, serif' }}>מחיר שמור</TableCell>
              <TableCell sx={{ fontWeight: 700, color: '#751B13', fontFamily: 'Suez One, serif' }}>פעולות</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {rows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={14} align="center" sx={{ color: '#751B13', fontFamily: 'Suez One, serif' }}>
                  אין מוצרים להצגה
                </TableCell>
              </TableRow>
            ) : (
              rows.map((row, idx) => (
                <TableRow key={row.id || idx} hover sx={{ background: idx % 2 === 0 ? '#fff7f2' : '#fff' }}>
                  <TableCell>{row.name}</TableCell>
                  <TableCell>{row.recipeName}</TableCell>
                  <TableCell>{row.recipeUnits}</TableCell>
                  <TableCell>{formatCurrency(row.ingredientsCost)}</TableCell>
                  <TableCell>{formatCurrency(row.packagingCost)}</TableCell>
                  <TableCell>{formatCurrency(row.laborTotal)}</TableCell>
                  <TableCell>{formatCurrency(row.overheadTotal)}</TableCell>
                  <TableCell>{formatCurrency(row.totalCost)}</TableCell>
                  <TableCell>{row.profitPercent.toFixed(1)}%</TableCell>
                  <TableCell>{formatCurrency(row.profitAmount)}</TableCell>
                  <TableCell
                    sx={isVatEnabled ? undefined : { fontWeight: 700, color: '#751B13', backgroundColor: '#f5e6e0' }}
                  >
                    {formatCurrency(row.sellingBeforeVat)}
                  </TableCell>
                  <TableCell
                    sx={isVatEnabled ? { fontWeight: 700, color: '#751B13', backgroundColor: '#f5e6e0' } : undefined}
                  >
                    {formatCurrency(row.sellingWithVat)}
                  </TableCell>
                  <TableCell>{row.manualPrice ? formatCurrency(row.manualPrice) : "-"}</TableCell>
                  <TableCell>
                    <Button
                      variant="outlined"
                      size="small"
                      sx={{ color: '#751B13', borderColor: '#751B13' }}
                      disabled={recalcMutation.isPending}
                      onClick={() => recalcMutation.mutate(row.id)}
                    >
                      חשב מחיר מחדש
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Paper>
    </Box>
  );
}
