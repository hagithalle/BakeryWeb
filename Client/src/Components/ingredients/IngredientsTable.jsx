import React from 'react';
import {
  Box,
  Chip,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
} from '@mui/material';

import getCategoryIcon from '../../utils/getCategoryIcon';
import { getStockStatus, STOCK_CONFIG } from '../../utils/getStockStatus';

import editIcon from '../../assets/icons/actions/edit-icon.svg';
import deleteIcon from '../../assets/icons/actions/delete-icon.svg';

const COLUMNS = [
  { field: 'name', headerName: 'חומר גלם' },
  { field: 'category', headerName: 'קטגוריה' },
  { field: 'unit', headerName: 'יחידה' },
  { field: 'pricePerKg', headerName: 'מחיר ליחידה' },
  { field: 'stockQuantity', headerName: 'כמות במלאי' },
  { field: 'stockStatus', headerName: 'סטטוס' },
  { field: 'actions', headerName: 'פעולות' },
];

export default function IngredientsTable({ rows, onEdit, onDelete, strings, categoryColors }) {
  return (
    <TableContainer
      component={Paper}
      elevation={0}
      sx={{
        borderRadius: '20px',
        border: '1px solid #F5EDE8',
        direction: 'rtl',
      }}
    >
      <Table>
        <TableHead>
          <TableRow
            sx={{
              background: 'linear-gradient(90deg, #FDF0EB 0%, #F5E6E0 100%)',
            }}
          >
            {COLUMNS.map((col) => (
              <TableCell
                key={col.field}
                sx={{
                  fontWeight: 700,
                  color: '#7A3B2E',
                  fontSize: '0.875rem',
                  borderBottom: '1px solid #F0E4DB',
                  background: 'transparent',
                }}
              >
                {col.headerName}
              </TableCell>
            ))}
          </TableRow>
        </TableHead>
        <TableBody>
          {rows.map((row, idx) => {
            const status = getStockStatus(row.originalStockQuantity ?? 0);
            const statusCfg = STOCK_CONFIG[status];
            const colors = categoryColors?.[row.category] || { bg: '#F5E6E0', text: '#971936' };
            const catIcon = getCategoryIcon(row.category);

            return (
              <TableRow
                key={row.id ?? idx}
                sx={{
                  '&:hover': { backgroundColor: '#FDF6F0' },
                  '&:last-child td': { border: 0 },
                }}
              >
                {/* Name */}
                <TableCell>
                  <Box sx={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: 1, direction: 'rtl' }}>
                    <Box
                      component="img"
                      src={catIcon}
                      alt={row.category}
                      sx={{ width: 28, height: 28, flexShrink: 0 }}
                    />
                    {row.name}
                  </Box>
                </TableCell>

                {/* Category */}
                <TableCell>
                  <Chip
                    label={row.category}
                    size="small"
                    sx={{
                      backgroundColor: colors.bg,
                      color: colors.text,
                      fontWeight: 600,
                      borderRadius: '8px',
                    }}
                  />
                </TableCell>

                {/* Unit */}
                <TableCell>{row.unit}</TableCell>

                {/* Price */}
                <TableCell>{row.pricePerKg}</TableCell>

                {/* Stock quantity */}
                <TableCell>{row.stockQuantity}</TableCell>

                {/* Status */}
                <TableCell>
                  <Chip
                    label={statusCfg.label}
                    size="small"
                    sx={{
                      backgroundColor: statusCfg.bg,
                      color: statusCfg.color,
                      fontWeight: 600,
                      borderRadius: '8px',
                    }}
                  />
                </TableCell>

                {/* Actions */}
                <TableCell>
                  <Box sx={{ display: 'flex', gap: 0.5 }}>
                    <IconButton
                      onClick={() => onEdit(row)}
                      size="small"
                      sx={{
                        width: 32,
                        height: 32,
                        backgroundColor: '#FFF8EC',
                        borderRadius: '8px',
                        '&:hover': { backgroundColor: '#FFF0D0' },
                      }}
                    >
                      <Box component="img" src={editIcon} alt="ערוך" sx={{ width: 16, height: 16 }} />
                    </IconButton>
                    <IconButton
                      onClick={() => onDelete(row)}
                      size="small"
                      sx={{
                        width: 32,
                        height: 32,
                        backgroundColor: '#FFEFEF',
                        borderRadius: '8px',
                        '&:hover': { backgroundColor: '#FFD6D6' },
                      }}
                    >
                      <Box component="img" src={deleteIcon} alt="מחק" sx={{ width: 16, height: 16 }} />
                    </IconButton>
                  </Box>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </TableContainer>
  );
}
