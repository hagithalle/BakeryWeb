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
  Box
} from "@mui/material";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";

export default function GenericTable({ columns, rows, actions = [], direction = "rtl", onEdit, onDelete }) {
  return (
    <TableContainer component={Paper} sx={{ boxShadow: 3, borderRadius: 3, mt: 2, direction }}>
      <Table>
        <TableHead>
          <TableRow sx={{ background: "#f5e6e0" }}>
            {columns.map((col) => (
              <TableCell key={col.field} align={direction === "rtl" ? "right" : "left"} sx={{ fontWeight: 700, color: "#751B13", fontFamily: 'Suez One, serif', fontSize: 18 }}>
                {col.headerName}
              </TableCell>
            ))}
            {actions.length > 0 && <TableCell align="center">פעולות</TableCell>}
          </TableRow>
        </TableHead>
        <TableBody>
          {rows.map((row, idx) => (
            <TableRow key={row.id || idx} hover sx={{ background: idx % 2 === 0 ? "#fff7f2" : "#fff" }}>
              {columns.map((col) => (
                <TableCell key={col.field} align={direction === "rtl" ? "right" : "left"}>
                  {row[col.field]}
                </TableCell>
              ))}
              {actions.length > 0 && (
                <TableCell align="center">
                  <Box sx={{ display: "flex", justifyContent: "center", gap: 1 }}>
                    {actions.includes("edit") && (
                      <IconButton color="primary" size="small" onClick={() => onEdit && onEdit(row)}>
                        <EditIcon />
                      </IconButton>
                    )}
                    {actions.includes("delete") && (
                      <IconButton color="error" size="small" onClick={() => onDelete && onDelete(row)}>
                        <DeleteIcon />
                      </IconButton>
                    )}
                  </Box>
                </TableCell>
              )}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
}
