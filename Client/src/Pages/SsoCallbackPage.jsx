import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useClerk, useAuth as useClerkAuth } from '@clerk/clerk-react';
import { useAuth } from '../context/AuthContext';
import { Box, CircularProgress, Typography, Button } from '@mui/material';

export default function SsoCallbackPage() {
  const { handleRedirectCallback } = useClerk();
  const { getToken } = useClerkAuth();
  const { loginWithClerk } = useAuth();
  const navigate = useNavigate();
  const [status, setStatus] = useState('loading'); // 'loading' | 'error'
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    async function complete() {
      try {
        // Step 1: Complete Clerk's OAuth redirect flow
        await handleRedirectCallback();

        // Step 2: Get Clerk session token
        const clerkToken = await getToken();
        if (!clerkToken) throw new Error('לא נמצא טוקן');

        // Step 3: Exchange for local JWT
        const result = await loginWithClerk(clerkToken);
        if (result.ok) {
          navigate('/dashboard', { replace: true });
        } else {
          throw new Error(result.error || 'שגיאה בסנכרון');
        }
      } catch (err) {
        console.error('SSO callback error:', err);
        setErrorMsg(err.message || 'שגיאה בכניסה עם Google');
        setStatus('error');
      }
    }

    complete();
  }, []);

  if (status === 'error') {
    return (
      <Box
        sx={{
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 2,
          direction: 'rtl',
          background: 'linear-gradient(135deg, #FFF8F2 0%, #FBF0E8 100%)',
        }}
      >
        <Typography sx={{ color: '#9B1F3A', fontWeight: 700, fontSize: 18 }}>
          שגיאה בכניסה
        </Typography>
        <Typography sx={{ color: '#8A5E4A' }}>{errorMsg}</Typography>
        <Button
          onClick={() => navigate('/login', { replace: true })}
          sx={{ color: '#9B1F3A', fontWeight: 600, textTransform: 'none' }}
        >
          חזרה לדף הכניסה
        </Button>
      </Box>
    );
  }

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 2,
        background: 'linear-gradient(135deg, #FFF8F2 0%, #FBF0E8 100%)',
      }}
    >
      <CircularProgress sx={{ color: '#9B1F3A' }} size={40} />
      <Typography sx={{ color: '#8A5E4A', fontWeight: 600, fontSize: 16 }}>
        מתחבר עם Google...
      </Typography>
    </Box>
  );
}
