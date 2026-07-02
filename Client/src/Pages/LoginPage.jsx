import React, { useState } from 'react';
import { Box, TextField, Button, Typography, CircularProgress, Alert } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import logoUrl from '../assets/images/logo.png';

const fieldSx = {
  '& .MuiOutlinedInput-root': {
    borderRadius: '14px',
    background: '#FFFDF9',
    '& fieldset': { borderColor: '#E8D5C4' },
    '&:hover fieldset': { borderColor: '#B7795A' },
    '&.Mui-focused fieldset': { borderColor: '#B7795A', borderWidth: '2px' },
  },
  '& .MuiInputLabel-root': { color: '#8A5E4A' },
  '& .MuiInputLabel-root.Mui-focused': { color: '#B7795A' },
};

export default function LoginPage() {
  const navigate  = useNavigate();
  const { login, register, loading, error } = useAuth();

  const [mode, setMode]         = useState('login'); // 'login' | 'register'
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [name, setName]         = useState('');
  const [localError, setLocalError] = useState('');

  const isRegister = mode === 'register';

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLocalError('');

    if (!email.trim() || !password.trim()) {
      setLocalError('נא למלא אימייל וסיסמה');
      return;
    }
    if (isRegister && !name.trim()) {
      setLocalError('נא למלא שם');
      return;
    }

    const result = isRegister
      ? await register(email.trim(), password, name.trim())
      : await login(email.trim(), password);

    if (result.ok) {
      navigate('/dashboard', { replace: true });
    } else {
      setLocalError(result.error);
    }
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #FFF8F2 0%, #FBF0E8 50%, #F7E8DC 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        p: 2,
        direction: 'rtl',
      }}
    >
      {/* Decorative blobs */}
      <Box aria-hidden sx={{ position: 'fixed', top: -80, right: -80, width: 320, height: 320, borderRadius: '50%', background: 'radial-gradient(circle, rgba(155,31,58,0.08) 0%, transparent 70%)', pointerEvents: 'none' }} />
      <Box aria-hidden sx={{ position: 'fixed', bottom: -60, left: -60, width: 260, height: 260, borderRadius: '50%', background: 'radial-gradient(circle, rgba(183,121,90,0.10) 0%, transparent 70%)', pointerEvents: 'none' }} />

      <Box
        component="form"
        onSubmit={handleSubmit}
        sx={{
          width: '100%',
          maxWidth: 420,
          background: 'rgba(255,255,255,0.92)',
          backdropFilter: 'blur(12px)',
          border: '1px solid #F1DDD3',
          borderRadius: '28px',
          boxShadow: '0 20px 60px rgba(120,70,45,0.14)',
          px: { xs: 3, sm: 5 },
          py: 5,
          display: 'flex',
          flexDirection: 'column',
          gap: 2.5,
          alignItems: 'center',
        }}
      >
        {/* Logo */}
        <Box component="img" src={logoUrl} alt="לוגו" sx={{ height: 90, objectFit: 'contain', mb: 0.5 }} />

        {/* Title */}
        <Box sx={{ textAlign: 'center' }}>
          <Typography sx={{ fontSize: 26, fontWeight: 800, color: '#9B1F3A', lineHeight: 1.2 }}>
            {isRegister ? 'צרי חשבון חדש' : 'ברוכה הבאה'}
          </Typography>
          <Typography sx={{ fontSize: 14, color: '#8A5E4A', mt: 0.5 }}>
            {isRegister ? 'הכנסי פרטים ליצירת חשבון' : 'התחברי לניהול המאפייה שלך'}
          </Typography>
        </Box>

        {/* Error */}
        {(localError || error) && (
          <Alert severity="error" sx={{ width: '100%', borderRadius: '12px', direction: 'rtl' }}>
            {localError || error}
          </Alert>
        )}

        {/* Name field (register only) */}
        {isRegister && (
          <TextField
            label="שם"
            value={name}
            onChange={e => setName(e.target.value)}
            fullWidth
            autoComplete="name"
            sx={fieldSx}
          />
        )}

        {/* Email */}
        <TextField
          label="אימייל"
          type="email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          fullWidth
          autoComplete="email"
          sx={fieldSx}
        />

        {/* Password */}
        <TextField
          label="סיסמה"
          type="password"
          value={password}
          onChange={e => setPassword(e.target.value)}
          fullWidth
          autoComplete={isRegister ? 'new-password' : 'current-password'}
          sx={fieldSx}
        />

        {/* Submit */}
        <Button
          type="submit"
          fullWidth
          disabled={loading}
          sx={{
            mt: 0.5,
            height: 52,
            background: '#9B1F3A',
            color: 'white',
            borderRadius: '999px',
            fontWeight: 700,
            fontSize: 16,
            textTransform: 'none',
            boxShadow: '0 6px 18px rgba(155,31,58,0.28)',
            '&:hover': { background: '#7D1830', transform: 'translateY(-1px)' },
            '&:disabled': { background: '#e0cece', color: '#b09090', boxShadow: 'none' },
            transition: 'all 0.2s ease',
          }}
        >
          {loading
            ? <CircularProgress size={22} sx={{ color: 'white' }} />
            : isRegister ? 'יצירת חשבון' : 'כניסה'}
        </Button>

        {/* Toggle mode */}
        <Box sx={{ display: 'flex', gap: 0.5, alignItems: 'center', mt: -0.5 }}>
          <Typography sx={{ fontSize: 14, color: '#8A5E4A' }}>
            {isRegister ? 'כבר יש לך חשבון?' : 'אין לך חשבון עדיין?'}
          </Typography>
          <Button
            variant="text"
            onClick={() => { setMode(isRegister ? 'login' : 'register'); setLocalError(''); }}
            sx={{ fontSize: 14, fontWeight: 700, color: '#9B1F3A', textTransform: 'none', p: 0, minWidth: 0 }}
          >
            {isRegister ? 'כניסה' : 'הרשמה'}
          </Button>
        </Box>
      </Box>
    </Box>
  );
}
