import React from 'react';
import { SignIn } from '@clerk/clerk-react';
import AuthLayout from '../Components/Auth/AuthLayout';

/**
 * Sign-in with Clerk: Google or email + password (including "forgot password").
 * Path routing lets Clerk handle its own sub-steps, e.g. /login/factor-one and /login/sso-callback.
 */
export default function LoginPage() {
  return (
    <AuthLayout>
      <SignIn routing="path" path="/login" signUpUrl="/sign-up" />
    </AuthLayout>
  );
}
