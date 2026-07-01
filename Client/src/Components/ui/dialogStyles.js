export const fieldSx = {
  '& .MuiOutlinedInput-root': {
    borderRadius: '14px',
    background: '#FFFDF9',
    '& fieldset': { borderColor: '#E8D5C4' },
    '&:hover fieldset': { borderColor: '#B7795A' },
    '&.Mui-focused fieldset': { borderColor: '#B7795A', borderWidth: '2px' },
  },
  '& .MuiInputLabel-root': { color: '#8A5E4A' },
  '& .MuiInputLabel-root.Mui-focused': { color: '#B7795A' },
  '& .MuiSelect-select': { background: '#FFFDF9', borderRadius: '14px' },
};

export const primaryBtnSx = {
  background: '#9B1F3A',
  color: 'white',
  borderRadius: '999px',
  fontWeight: 700,
  fontSize: '15px',
  px: 3.5,
  py: 1.1,
  boxShadow: '0 4px 14px rgba(155,31,58,0.22)',
  textTransform: 'none',
  '&:hover': { background: '#7D1830', boxShadow: '0 6px 20px rgba(155,31,58,0.32)' },
  '&:disabled': { background: '#e0cece', color: '#b09090', boxShadow: 'none' },
};

export const secondaryBtnSx = {
  background: 'transparent',
  color: '#7B4A36',
  border: '1px solid #D8B8A8',
  borderRadius: '999px',
  fontWeight: 600,
  fontSize: '15px',
  px: 3,
  py: 1.1,
  textTransform: 'none',
  '&:hover': { background: '#FFF8F2', borderColor: '#B7795A' },
};

export const dialogBlobSx = {
  position: 'absolute',
  borderRadius: '50%',
  pointerEvents: 'none',
  zIndex: 0,
};
