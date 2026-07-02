import React, { useState } from 'react';
import { Box, TextField, Button, Typography, CircularProgress, Alert, Divider } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { useSignIn } from '@clerk/clerk-react';
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
  const { signIn, isLoaded: clerkLoaded } = useSignIn();

  const [mode, setMode]         = useState('login'); // 'login' | 'register'
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [name, setName]         = useState('');
  const [localError, setLocalError] = useState('');

  const isRegister = mode === 'register';

  const handleGoogleLogin = () => {
    if (!clerkLoaded || !signIn) return;
    signIn.authenticateWithRedirect({
      strategy: 'oauth_google',
      redirectUrl: `${window.location.origin}/sso-callback`,
      redirectUrlComplete: `${window.location.origin}/sso-callback`,
    });
  };

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

        {/* Google login */}
        <Divider sx={{ width: '100%', color: '#C4A88A', fontSize: 13 }}>או</Divider>

        <Button
          fullWidth
          onClick={handleGoogleLogin}
          disabled={!clerkLoaded}
          sx={{
            height: 52,
            border: '1.5px solid #E8D5C4',
            borderRadius: '999px',
            background: '#fff',
            color: '#3D2B1F',
            fontWeight: 600,
            fontSize: 15,
            textTransform: 'none',
            display: 'flex',
            alignItems: 'center',
            gap: 1.5,
            '&:hover': { background: '#FBF5F0', borderColor: '#B7795A' },
          }}
        >
          <svg width="20" height="20" viewBox="0 0 48 48">
            <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
            <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
            <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
            <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.18 1.48-4.97 2.31-8.16 2.31-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
          </svg>
          כניסה עם Google
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
