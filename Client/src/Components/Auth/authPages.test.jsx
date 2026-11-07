import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { renderToString } from 'react-dom/server';

// Record the props the pages pass to Clerk; render a marker instead of the real widget.
const clerkCalls = [];
vi.mock('@clerk/clerk-react', () => ({
  SignIn: (props) => { clerkCalls.push(['SignIn', props]); return <div data-clerk="sign-in" />; },
  SignUp: (props) => { clerkCalls.push(['SignUp', props]); return <div data-clerk="sign-up" />; },
}));

const { default: LoginPage } = await import('../../Pages/LoginPage');
const { default: SignUpPage } = await import('../../Pages/SignUpPage');
const { default: AuthLayout } = await import('./AuthLayout');
const { BAKERY_MANAGER_LOGO_ALT } = await import('../Branding/BakeryManagerLogo');

const lastPropsFor = (name) => clerkCalls.filter(([n]) => n === name).at(-1)?.[1];

describe('auth pages keep the Clerk flow unchanged', () => {
  it('login uses path routing at /login and links to /sign-up', () => {
    const html = renderToString(<LoginPage />);
    expect(html).toContain('data-clerk="sign-in"');
    expect(lastPropsFor('SignIn')).toEqual({ routing: 'path', path: '/login', signUpUrl: '/sign-up' });
  });

  it('sign-up uses path routing at /sign-up and links to /login', () => {
    const html = renderToString(<SignUpPage />);
    expect(html).toContain('data-clerk="sign-up"');
    expect(lastPropsFor('SignUp')).toEqual({ routing: 'path', path: '/sign-up', signInUrl: '/login' });
  });
});

describe('AuthLayout branding', () => {
  const html = renderToString(<AuthLayout title="כותרת"><span>form</span></AuthLayout>);

  it('shows the universal BakeryManager logo, not the personal bakery logo', () => {
    expect(html).toContain('bakerymanager-logo');
    expect(html).toContain(`alt="${BAKERY_MANAGER_LOGO_ALT}"`);
    expect(html).not.toMatch(/images\/logo\.png/);
  });

  it('shows the marketing headline as plain text, without feature pills', () => {
    expect(html).toContain('data-testid="auth-tagline"');
    // Rendered as two fixed lines: "כל הקונדיטוריה שלך" / "במקום אחד".
    expect(html).toMatch(/כל הקונדיטוריה שלך<\/span><span[^>]*>במקום אחד/);
    // Whole tag names only: React also emits <link rel="preload"> for the logo.
    expect(html).not.toMatch(/<ul[\s>]/);
    expect(html).not.toMatch(/<li[\s>]/);
  });

  it('is right-to-left, has a main landmark and renders the title and children', () => {
    expect(html).toContain('dir="rtl"');
    expect(html).toContain('<main');
    expect(html).toContain('כותרת');
    expect(html).toContain('<span>form</span>');
  });
});
