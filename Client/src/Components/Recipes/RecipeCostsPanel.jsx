import React from "react";
import {
  Box,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Divider
} from "@mui/material";
import { getUnitDisplayName } from "../../utils/unitUtils";

// כל הסכומים מגיעים מהשרת; כאן רק מציגים אותם
export default function RecipeCostsPanel({ costBreakdown }) {
  if (!costBreakdown) {
    return (
      <Box sx={{ mt: 2, p: 3, bgcolor: 'white', borderRadius: 2 }}>
        <Typography color="text.secondary">אין נתוני עלויות</Typography>
      </Box>
    );
  }

  const {
    ingredients = [],
    subRecipes = [],
    baseRecipesCost = 0,
    laborCost = 0,
    overheadCost = 0,
    packagingCost = 0,
    totalCost = 0,
    costPerUnit = 0,
    yield: recipeYield = 1,
    warnings = []
  } = costBreakdown;

  const ingredientsTotal = ingredients.reduce((sum, item) => sum + item.cost, 0);
  const warningMessages = [...new Set(warnings.map(w => w.message))];

  return (
    <Box sx={{ mt: 2 }}>
      {/* אזהרות על נתונים שעלולים להפוך את העלות לשגויה */}
      {warningMessages.length > 0 && (
        <Box sx={{ mb: 3, p: 2, bgcolor: '#FFF8E1', borderRadius: 2, borderRight: '4px solid #F9A825' }}>
          <Typography variant="subtitle2" sx={{ mb: 1, color: '#6D4C41', fontWeight: 700 }}>
            שימי לב – העלות עלולה להיות לא מדויקת:
          </Typography>
          {warningMessages.map(message => (
            <Typography key={message} variant="body2" sx={{ color: '#6D4C41' }}>• {message}</Typography>
          ))}
        </Box>
      )}

      {/* טבלת חומרי גלם */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="h6" sx={{ mb: 2, color: '#751B13', fontFamily: 'Suez One, serif' }}>
          חומרי גלם
        </Typography>
        <TableContainer component={Paper} sx={{ boxShadow: 1 }}>
          <Table>
            <TableHead>
              <TableRow sx={{ bgcolor: '#FFF7F2' }}>
                <TableCell align="right" sx={{ fontWeight: 'bold' }}>חומר גלם</TableCell>
                <TableCell align="right" sx={{ fontWeight: 'bold' }}>כמות</TableCell>
                <TableCell align="right" sx={{ fontWeight: 'bold' }}>יחידה</TableCell>
                <TableCell align="right" sx={{ fontWeight: 'bold' }}>עלות (₪)</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {ingredients.map((item, index) => (
                <TableRow key={index} hover>
                  <TableCell align="right">{item.name}</TableCell>
                  <TableCell align="right">{item.amount}</TableCell>
                  <TableCell align="right">
                    {typeof item.unit === 'string' ? item.unit : getUnitDisplayName(item.unit)}
                  </TableCell>
                  <TableCell align="right">{item.cost.toFixed(2)}</TableCell>
                </TableRow>
              ))}
              <TableRow sx={{ bgcolor: '#FFF7F2' }}>
                <TableCell align="right" colSpan={3} sx={{ fontWeight: 'bold' }}>
                  סה"כ חומרי גלם
                </TableCell>
                <TableCell align="right" sx={{ fontWeight: 'bold' }}>
                  {ingredientsTotal.toFixed(2)} ₪
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </TableContainer>
      </Box>

      {/* מתכוני בסיס – החלק היחסי (חומרי גלם, עבודה ותקורה שלהם) */}
      {subRecipes.length > 0 && (
        <Box sx={{ mb: 3 }}>
          <Typography variant="h6" sx={{ mb: 2, color: '#751B13', fontFamily: 'Suez One, serif' }}>
            מתכוני בסיס
          </Typography>
          <TableContainer component={Paper} sx={{ boxShadow: 1 }}>
            <Table>
              <TableHead>
                <TableRow sx={{ bgcolor: '#FFF7F2' }}>
                  <TableCell align="right" sx={{ fontWeight: 'bold' }}>מתכון</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 'bold' }}>כמות (יחידות)</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 'bold' }}>עלות (₪)</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {subRecipes.map((item, index) => (
                  <TableRow key={index} hover>
                    <TableCell align="right">{item.name}</TableCell>
                    <TableCell align="right">{item.amount}</TableCell>
                    <TableCell align="right">{item.cost.toFixed(2)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Box>
      )}

      {/* סיכום עלויות */}
      <Box sx={{ p: 3, bgcolor: 'white', borderRadius: 2, boxShadow: 1 }}>
        <Typography variant="h6" sx={{ mb: 2, color: '#751B13', fontFamily: 'Suez One, serif' }}>
          סיכום עלויות
        </Typography>

        <Box sx={{ mb: 2 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
            <Typography>סה"כ חומרי גלם:</Typography>
            <Typography fontWeight="medium">
              {ingredientsTotal.toFixed(2)} ₪
            </Typography>
          </Box>
          {subRecipes.length > 0 && (
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
              <Typography>מתכוני בסיס:</Typography>
              <Typography fontWeight="medium">{baseRecipesCost.toFixed(2)} ₪</Typography>
            </Box>
          )}
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
            <Typography>עלות עבודה:</Typography>
            <Typography fontWeight="medium">{laborCost.toFixed(2)} ₪</Typography>
          </Box>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
            <Typography>עלויות תקורה:</Typography>
            <Typography fontWeight="medium">{overheadCost.toFixed(2)} ₪</Typography>
          </Box>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
            <Typography>אריזה:</Typography>
            <Typography fontWeight="medium">{packagingCost.toFixed(2)} ₪</Typography>
          </Box>

          <Divider sx={{ my: 2 }} />

          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
            <Typography variant="h6" sx={{ color: '#751B13', fontWeight: 'bold' }}>
              עלות כוללת:
            </Typography>
            <Typography variant="h6" sx={{ color: '#751B13', fontWeight: 'bold' }}>
              {totalCost.toFixed(2)} ₪
            </Typography>
          </Box>

          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
            <Typography>תפוקה:</Typography>
            <Typography fontWeight="medium">{recipeYield} יחידות</Typography>
          </Box>
          <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
            <Typography>עלות ליחידה:</Typography>
            <Typography fontWeight="medium" sx={{ color: '#D84315', fontSize: '1.1rem' }}>
              {costPerUnit.toFixed(2)} ₪
            </Typography>
          </Box>
        </Box>
      </Box>
    </Box>
  );
}
