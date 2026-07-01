import React from 'react';
import { Dialog, Box, Typography, IconButton, Button } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import { primaryBtnSx, secondaryBtnSx, dialogBlobSx } from './dialogStyles';

export default function SoftDialog({
  open,
  onClose,
  title,
  children,
  maxWidth = 'sm',
  dir = 'rtl',
  onSave,
  saveLabel = 'שמור',
  cancelLabel = 'ביטול',
  isValid = true,
  isSaving = false,
  showActions = true,
  actions,
  disableEnforceFocus,
  disableRestoreFocus,
  contentSx = {},
}) {
  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth={maxWidth}
      fullWidth
      dir={dir}
      disableEnforceFocus={disableEnforceFocus}
      disableRestoreFocus={disableRestoreFocus}
      PaperProps={{
        sx: {
          background: 'linear-gradient(135deg, #FFFDF9 0%, #FBF1EC 55%, #FFF8F2 100%)',
          borderRadius: '28px',
          border: '1px solid #E8D5C4',
          boxShadow: '0 18px 45px rgba(120,70,45,0.18)',
          overflow: 'hidden',
          position: 'relative',
        },
      }}
    >
      {/* Decorative blobs */}
      <Box sx={{ ...dialogBlobSx, top: -70, left: -70, width: 220, height: 220, background: 'rgba(201,137,41,0.07)', filter: 'blur(40px)' }} />
      <Box sx={{ ...dialogBlobSx, bottom: -70, right: -70, width: 200, height: 200, background: 'rgba(166,61,64,0.06)', filter: 'blur(40px)' }} />

      {/* Header */}
      <Box
        sx={{
          position: 'relative',
          zIndex: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          pt: 2.5,
          pb: 1.5,
          px: 3,
          borderBottom: '1px solid #EFE0D8',
        }}
      >
        <Typography
          component="h2"
          sx={{ fontWeight: 800, color: '#9B1F3A', fontSize: { xs: '1.1rem', sm: '1.25rem' }, textAlign: 'center', flex: 1 }}
        >
          {title}
        </Typography>
        <IconButton
          size="small"
          onClick={onClose}
          sx={{
            position: 'absolute',
            left: 12,
            color: '#B7795A',
            '&:hover': { background: 'rgba(183,121,90,0.1)' },
          }}
        >
          <CloseIcon sx={{ fontSize: 20 }} />
        </IconButton>
      </Box>

      {/* Content */}
      <Box
        sx={{
          position: 'relative',
          zIndex: 1,
          px: 3,
          py: 2.5,
          overflowY: 'auto',
          maxHeight: '65vh',
          ...contentSx,
        }}
      >
        {children}
      </Box>

      {/* Actions */}
      {showActions && (
        <Box
          sx={{
            position: 'relative',
            zIndex: 1,
            px: 3,
            pb: 2.5,
            pt: 1.5,
            borderTop: '1px solid #EFE0D8',
            display: 'flex',
            gap: 1.5,
            justifyContent: 'flex-end',
            flexWrap: 'wrap',
          }}
        >
          {actions ?? (
            <>
              <Button onClick={onClose} sx={secondaryBtnSx}>
                {cancelLabel}
              </Button>
              <Button
                onClick={onSave}
                disabled={!isValid || isSaving}
                sx={primaryBtnSx}
              >
                {isSaving ? 'שומר...' : saveLabel}
              </Button>
            </>
          )}
        </Box>
      )}
    </Dialog>
  );
}
