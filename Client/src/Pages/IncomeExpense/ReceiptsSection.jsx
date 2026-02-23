import React from 'react';
import { Box, Button, TextField, InputAdornment, IconButton, Card, CardContent, Typography } from '@mui/material';
import InsertLinkIcon from '@mui/icons-material/InsertLink';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import ImageIcon from '@mui/icons-material/Image';
import DeleteIcon from '@mui/icons-material/Delete';

function getFileIcon(file) {
  if (file.type?.includes('pdf') || file.name?.toLowerCase().endsWith('.pdf')) return <PictureAsPdfIcon sx={{ color: '#bfa47a', mr: 1 }} />;
  if (file.type?.includes('image') || /\.(jpg|jpeg|png|heic)$/i.test(file.name)) return <ImageIcon sx={{ color: '#bfa47a', mr: 1 }} />;
  if (file.url) return <InsertLinkIcon sx={{ color: '#bfa47a', mr: 1 }} />;
  return null;
}

export default function ReceiptsSection({ receipts, setReceipts, receiptUrl, setReceiptUrl }) {
  return (
    <Box sx={{ mt: 2, mb: 1 }}>
      <Typography variant="subtitle2" sx={{ mb: 1 }}>קבלה / מסמך מצורף</Typography>
      <Box sx={{ display: 'flex', gap: 1, mb: 1 }}>
        {/* File upload */}
        <Button
          variant="outlined"
          component="label"
          sx={{ minWidth: 0 }}
        >
          העלאת קובץ
          <input
            type="file"
            accept="application/pdf,image/*"
            hidden
            multiple
            onChange={e => {
              const files = Array.from(e.target.files || []);
              setReceipts(prev => [...prev, ...files]);
              e.target.value = null;
            }}
          />
        </Button>
        {/* Camera (mobile) */}
        <Button
          variant="outlined"
          component="label"
          sx={{ minWidth: 0 }}
        >
          צלמי קבלה
          <input
            type="file"
            accept="image/*"
            capture="environment"
            hidden
            onChange={e => {
              const files = Array.from(e.target.files || []);
              setReceipts(prev => [...prev, ...files]);
              e.target.value = null;
            }}
          />
        </Button>
        {/* URL link */}
        <TextField
          size="small"
          placeholder="קישור לקבלה"
          value={receiptUrl}
          onChange={e => setReceiptUrl(e.target.value)}
          InputProps={{
            endAdornment: (
              <InputAdornment position="end">
                <IconButton
                  size="small"
                  onClick={() => {
                    if (receiptUrl) {
                      setReceipts(prev => [...prev, { url: receiptUrl }]);
                      setReceiptUrl("");
                    }
                  }}
                  edge="end"
                >
                  <InsertLinkIcon />
                </IconButton>
              </InputAdornment>
            )
          }}
          sx={{ minWidth: 180 }}
        />
      </Box>
      {/* List of attached receipts/links */}
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
        {receipts.map((file, idx) => (
          <Card key={idx} sx={{ display: 'flex', alignItems: 'center', px: 1, py: 0.5, minWidth: 120 }}>
            {getFileIcon(file)}
            <CardContent sx={{ p: 1, flex: 1 }}>
              <Typography variant="body2" noWrap>
                {file.name || file.url}
              </Typography>
            </CardContent>
            <IconButton size="small" onClick={() => setReceipts(prev => prev.filter((_, i) => i !== idx))}>
              <DeleteIcon fontSize="small" />
            </IconButton>
          </Card>
        ))}
      </Box>
    </Box>
  );
}
