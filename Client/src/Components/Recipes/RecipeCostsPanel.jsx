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
    laborCost = 0,
    overheadCost = 0,
    packagingCost = 0,
    totalCost = 0,
    costPerUnit = 0,
    yield: recipeYield = 1
  } = costBreakdown;

  console.log('📊 RecipeCostsPanel - ingredients:', ingredients);
  ingredients.forEach((item, idx) => {
    console.log(`  [${idx}] name="${item.name}" amount=${item.amount} unit="${item.unit}" (type: ${typeof item.unit}) cost=${item.cost}`);
  });

  return (
    <Box sx={{ mt: 2 }}>
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
                  {ingredients.reduce((sum, item) => sum + item.cost, 0).toFixed(2)} ₪
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </TableContainer>
      </Box>

      {/* סיכום עלויות */}
      <Box sx={{ p: 3, bgcolor: 'white', borderRadius: 2, boxShadow: 1 }}>
        <Typography variant="h6" sx={{ mb: 2, color: '#751B13', fontFamily: 'Suez One, serif' }}>
          סיכום עלויות
        </Typography>
        
        <Box sx={{ mb: 2 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
            <Typography>סה"כ חומרי גלם:</Typography>
            <Typography fontWeight="medium">
              {ingredients.reduce((sum, item) => sum + item.cost, 0).toFixed(2)} ₪
            </Typography>
          </Box>
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
