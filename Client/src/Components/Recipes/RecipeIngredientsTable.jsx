import React from "react";
import { Table, TableHead, TableRow, TableCell, TableBody, Box } from "@mui/material";

export default function RecipeIngredientsTable({ ingredients }) {
  return (
    <Box sx={{ mt: 2 }}>
      <Table>
        <TableHead>
          <TableRow>
            <TableCell>חומר גלם</TableCell>
            <TableCell>יחידה</TableCell>
            <TableCell>כמות</TableCell>
            <TableCell>סכום</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {(ingredients || []).map((row, idx) => (
            <TableRow key={idx}>
              <TableCell>{row.name}</TableCell>
              <TableCell>{row.unit}</TableCell>
              <TableCell>{row.amount}</TableCell>
              <TableCell>{row.sum}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Box>
  );
}
