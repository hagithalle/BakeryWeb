import React from 'react';
import { SignUp } from '@clerk/clerk-react';
import AuthLayout from '../Components/Auth/AuthLayout';

/**
 * Sign-up with Clerk: Google, or email + password confirmed with an emailed code
 * (email verification must be required in the Clerk dashboard).
 */
export default function SignUpPage() {
  return (
    <AuthLayout>
      <SignUp routing="path" path="/sign-up" signInUrl="/login" />
    </AuthLayout>
  );
}
