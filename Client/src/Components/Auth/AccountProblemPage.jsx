import React from 'react';
import { Box, Button, Typography } from '@mui/material';
import AuthLayout from './AuthLayout';
import { useAuth } from '../../context/AuthContext';

// Codes come from the server (ProvisioningStatus) or from the auth context.
const EXPLANATIONS = {
  LegacyAccountLinkRequired:
    'כתובת האימייל הזו שייכת לחשבון שנוצר לפני המעבר למערכת ההתחברות החדשה. מטעמי אבטחה החשבונות לא מקושרים אוטומטית. פנו למנהלת המערכת כדי לקשר את החשבון.',
  EmailNotVerified: 'יש לאמת את כתובת האימייל בחשבון ולאחר מכן להתחבר מחדש.',
  IdentityConflict: 'כתובת האימייל כבר מקושרת לחשבון אחר. התחברו עם החשבון המקורי.',
  ClerkUnavailable: 'שירות ההתחברות אינו זמין כרגע. נסו שוב בעוד רגע.',
};

/** Shown when the user is signed in to Clerk but the BakeryManager account can't be opened. */
export default function AccountProblemPage() {
  const { problem, retry, logout } = useAuth();
  const explanation = EXPLANATIONS[problem?.code] ?? problem?.message ?? 'לא ניתן לפתוח את החשבון כרגע.';
  const canRetry = problem?.code === 'ClerkUnavailable' || problem?.code === 'Unknown' || !problem?.code;

  return (
    <AuthLayout title="לא ניתן לפתוח את החשבון">
      <Box
        sx={{
          maxWidth: 420,
          width: '100%',
          background: 'rgba(255,255,255,0.92)',
          border: '1px solid #F1DDD3',
          borderRadius: '28px',
          boxShadow: '0 20px 60px rgba(120,70,45,0.14)',
          p: 4,
          display: 'flex',
          flexDirection: 'column',
          gap: 2,
          textAlign: 'center',
        }}
      >
        <Typography sx={{ color: '#5A3A2E' }}>{explanation}</Typography>
        <Box sx={{ display: 'flex', gap: 1, justifyContent: 'center' }}>
          {canRetry && (
            <Button variant="outlined" onClick={retry} sx={{ textTransform: 'none' }}>
              נסו שוב
            </Button>
          )}
          <Button variant="contained" onClick={logout} sx={{ textTransform: 'none' }}>
            התנתקות
          </Button>
        </Box>
      </Box>
    </AuthLayout>
  );
}
