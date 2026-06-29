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
  Typography,
} from "@mui/material";
import editIconSvg   from "../assets/icons/actions/edit-icon.svg";
import deleteIconSvg from "../assets/icons/actions/delete-icon.svg";

export default function GenericTable({
  columns,
  rows,
  actions = [],
  direction = "rtl",
  onEdit,
  onDelete,
}) {
  const colSpan = columns.length + (actions.length > 0 ? 1 : 0);

  return (
    <TableContainer
      component={Paper}
      sx={{
        boxShadow: "0 4px 28px rgba(166, 61, 64, 0.08)",
        borderRadius: "20px",
        mt: 2,
        direction,
        bgcolor: "#FEFEFE",
        border: "1px solid #F5EDE8",
        overflow: "hidden",
      }}
    >
      <Table>
        <TableHead>
          <TableRow
            sx={{
              background: "linear-gradient(90deg, #FDF0EB 0%, #F5E6E0 100%)",
            }}
          >
            {columns.map((col) => (
              <TableCell
                key={col.field}
                align={direction === "rtl" ? "right" : "left"}
                sx={{
                  fontWeight: 700,
                  color: "#A63D40",
                  borderBottom: "2px solid #EACFC5",
                  py: 2,
                }}
              >
                {col.headerName}
              </TableCell>
            ))}
            {actions.length > 0 && (
              <TableCell
                align="center"
                sx={{
                  fontWeight: 700,
                  color: "#A63D40",
                  borderBottom: "2px solid #EACFC5",
                  py: 2,
                }}
              >
                פעולות
              </TableCell>
            )}
          </TableRow>
        </TableHead>

        <TableBody>
          {rows.length === 0 ? (
            <TableRow>
              <TableCell colSpan={colSpan} align="center" sx={{ py: 8, border: "none" }}>
                <Box
                  sx={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    gap: 1.5,
                  }}
                >
                  <Box sx={{ fontSize: 52, lineHeight: 1, opacity: 0.35 }}>🍰</Box>
                  <Typography
                    variant="body1"
                    sx={{ color: "#B7795A", fontWeight: 600 }}
                  >
                    אין נתונים להצגה
                  </Typography>
                  <Typography variant="body2" sx={{ color: "#C4A88A" }}>
                    נסה לשנות את מסנן החיפוש
                  </Typography>
                </Box>
              </TableCell>
            </TableRow>
          ) : (
            rows.map((row, idx) => (
              <TableRow
                key={row.id || idx}
                sx={{
                  borderBottom: "1px solid #F9F0EB",
                  "&:last-child td": { borderBottom: "none" },
                  "&:hover": { bgcolor: "#FDF6F0" },
                }}
              >
                {columns.map((col) => (
                  <TableCell
                    key={col.field}
                    align={direction === "rtl" ? "right" : "left"}
                    sx={{
                      color: "#3D2B1F",
                      fontWeight: col.field === "name" ? 600 : 400,
                    }}
                  >
                    {col.renderCell ? col.renderCell(row) : row[col.field]}
                  </TableCell>
                ))}

                {actions.length > 0 && (
                  <TableCell align="center">
                    <Box sx={{ display: "flex", justifyContent: "center", gap: 0.75 }}>
                      {actions.includes("edit") && (
                        <IconButton
                          size="small"
                          onClick={() => onEdit && onEdit(row)}
                          sx={{
                            color: "#C98929",
                            bgcolor: "#FFF8EC",
                            borderRadius: "8px",
                            width: 32,
                            height: 32,
                            transition: "all 0.15s ease",
                            "&:hover": {
                              bgcolor: "#FFF0CC",
                              transform: "scale(1.1)",
                            },
                          }}
                        >
                          <Box component="img" src={editIconSvg} alt="" sx={{ width: 16, height: 16, objectFit: 'contain' }} />
                        </IconButton>
                      )}
                      {actions.includes("delete") && (
                        <IconButton
                          size="small"
                          onClick={() => onDelete && onDelete(row)}
                          sx={{
                            color: "#A63D40",
                            bgcolor: "#FFEFEF",
                            borderRadius: "8px",
                            width: 32,
                            height: 32,
                            transition: "all 0.15s ease",
                            "&:hover": {
                              bgcolor: "#FFD8D8",
                              transform: "scale(1.1)",
                            },
                          }}
                        >
                          <Box component="img" src={deleteIconSvg} alt="" sx={{ width: 16, height: 16, objectFit: 'contain' }} />
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
