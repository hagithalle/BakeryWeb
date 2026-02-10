import React from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Box,
  Chip
} from "@mui/material";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";

export default function GenericTable({ columns, rows, actions = [], direction = "rtl", onEdit, onDelete }) {
  return (
    <TableContainer component={Paper} sx={{ boxShadow: '0 2px 8px rgba(151, 25, 54, 0.1)', borderRadius: 3, mt: 2, direction, bgcolor: '#FEFEFE' }}>
      <Table>
        <TableHead>
          <TableRow sx={{ background: "#F5E6E0" }}>
            {columns.map((col) => (
              <TableCell key={col.field} align={direction === "rtl" ? "right" : "left"} sx={{ fontWeight: 700, color: "#971936", fontSize: 16 }}>
                {col.headerName}
              </TableCell>
            ))}
            {actions.length > 0 && <TableCell align="center" sx={{ fontWeight: 700, color: "#971936", fontSize: 16 }}>פעולות</TableCell>}
          </TableRow>
        </TableHead>
        <TableBody>
          {rows.length === 0 ? (
            <TableRow>
              <TableCell colSpan={columns.length + (actions.length > 0 ? 1 : 0)} align="center" sx={{ color: '#971936', fontSize: 16, py: 4 }}>
                אין נתונים להצגה
              </TableCell>
            </TableRow>
          ) : (
            rows.map((row, idx) => (
              <TableRow key={row.id || idx} hover sx={{ 
                '&:hover': {
                  bgcolor: '#FFF8F3'
                }
              }}>
                {columns.map((col) => (
                  <TableCell key={col.field} align={direction === "rtl" ? "right" : "left"} sx={{ color: '#971936' }}>
                    {col.renderCell ? col.renderCell(row) : row[col.field]}
                  </TableCell>
                ))}
                {actions.length > 0 && (
                  <TableCell align="center">
                    <Box sx={{ display: "flex", justifyContent: "center", gap: 1 }}>
                      {actions.includes("edit") && (
                        <IconButton size="small" onClick={() => onEdit && onEdit(row)} sx={{ color: '#C98929' }}>
                          <EditIcon />
                        </IconButton>
                      )}
                      {actions.includes("delete") && (
                        <IconButton size="small" onClick={() => onDelete && onDelete(row)} sx={{ color: '#AE6063' }}>
                          <DeleteIcon />
                        </IconButton>
                      )}
                    </Box>
                  </TableCell>
                )}
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </TableContainer>
  );
}
