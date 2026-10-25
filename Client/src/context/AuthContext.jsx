import React, { createContext, useContext, useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useAuth as useClerkAuth, useUser } from '@clerk/clerk-react';
import { useQueryClient } from '@tanstack/react-query';
import api, { setAuthTokenProvider, setUnauthorizedHandler } from '../Services/api';
import { parseAccountResponse, problemFromError, deriveAuthStatus } from './authState';

const AuthContext = createContext(null);

// Keys written by the removed password login; cleared once so no stale token lingers in the browser.
const LEGACY_STORAGE_KEYS = ['bakery_token', 'bakery_user'];

/**
 * Clerk owns sign-in (Google and email/password). This provider:
 *  - attaches a fresh Clerk session token to every API request,
 *  - loads the internal BakeryManager account (/api/auth/me) for the signed-in Clerk user,
 *  - exposes the same { user, logout, isAuthenticated } shape the layout components already use.
 *
 * status: 'loading' | 'signedOut' | 'ready' | 'problem' (derived, never stored separately)
 */
export function AuthProvider({ children }) {
  const { isLoaded, isSignedIn, userId: clerkUserId, getToken, signOut } = useClerkAuth();
  const { user: clerkUser } = useUser();
  const queryClient = useQueryClient();

  const [attempt, setAttempt] = useState(0);
  // Result of the last /api/auth/me call, tagged with the request it belongs to.
  const [result, setResult] = useState({ key: null, account: null, problem: null });
  const [rejectedKey, setRejectedKey] = useState(null);

  const requestKey = isLoaded && isSignedIn ? `${clerkUserId}:${attempt}` : null;
  const requestKeyRef = useRef(requestKey);

  useEffect(() => {
    try { LEGACY_STORAGE_KEYS.forEach((key) => localStorage.removeItem(key)); } catch { /* storage unavailable */ }
  }, []);

  // Every API request asks Clerk for the current session token.
  useEffect(() => {
    setAuthTokenProvider(isSignedIn ? () => getToken() : null);
    return () => setAuthTokenProvider(null);
  }, [isSignedIn, getToken]);

  // The server rejected a fresh Clerk token: show a problem screen instead of looping back to sign-in.
  useEffect(() => {
    requestKeyRef.current = requestKey;
  }, [requestKey]);

  useEffect(() => {
    setUnauthorizedHandler(() => setRejectedKey(requestKeyRef.current));
    return () => setUnauthorizedHandler(null);
  }, []);

  // A different Clerk user (or sign-out) must never see the previous user's cached data.
  useEffect(() => {
    queryClient.clear();
  }, [clerkUserId, queryClient]);

  useEffect(() => {
    if (!requestKey) return undefined;

    let cancelled = false;
    api.get('/api/auth/me', { headers: { Accept: 'application/json' } })
      .then((response) => {
        if (cancelled) return;
        // A 200 is not enough: it must be JSON describing an internal account (see parseAccountResponse).
        const parsed = parseAccountResponse(response);
        setResult(parsed.ok
          ? { key: requestKey, account: parsed.account, problem: null }
          : { key: requestKey, account: null, problem: parsed.problem });
      })
      .catch((err) => {
        if (!cancelled) setResult({ key: requestKey, account: null, problem: problemFromError(err) });
      });

    return () => { cancelled = true; };
  }, [requestKey]);

  const { status, problem, account } = deriveAuthStatus({ isLoaded, isSignedIn, requestKey, rejectedKey, result });

  const logout = useCallback(async () => {
    queryClient.clear();
    await signOut({ redirectUrl: '/login' });
  }, [queryClient, signOut]);

  const retry = useCallback(() => setAttempt((n) => n + 1), []);

  const user = useMemo(() => (account ? {
    id: account.id,
    email: account.email,
    name: account.name || clerkUser?.fullName || '',
    photoUrl: clerkUser?.imageUrl,
  } : null), [account, clerkUser]);

  const value = {
    user,
    status,
    problem,
    isAuthenticated: status === 'ready',
    logout,
    retry,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}
