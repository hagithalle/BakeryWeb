import { describe, it, expect } from 'vitest';
import {
  parseAccountResponse,
  problemFromError,
  deriveAuthStatus,
  INVALID_RESPONSE_PROBLEM,
  SERVER_REJECTED_PROBLEM,
} from './authState';

const JSON_HEADERS = { 'content-type': 'application/json; charset=utf-8' };
const ACCOUNT = { id: 7, email: 'baker@example.com', name: 'Baker' };

// What the Vite dev server returns for an unknown path: its SPA page, with HTTP 200.
const VITE_INDEX_HTML = '<!doctype html><html lang="he"><head><script type="module" src="/@vite/client"></script></head><body><div id="root"></div></body></html>';

describe('parseAccountResponse', () => {
  it('accepts a 200 JSON response with a numeric internal user id', () => {
    expect(parseAccountResponse({ status: 200, headers: JSON_HEADERS, data: ACCOUNT }))
      .toEqual({ ok: true, account: ACCOUNT });
  });

  it('accepts JSON content types with suffixes and missing optional name', () => {
    const result = parseAccountResponse({
      status: 200,
      headers: { 'Content-Type': 'application/problem+json' },
      data: { id: 3, email: 'a@b.c' },
    });
    expect(result).toEqual({ ok: true, account: { id: 3, email: 'a@b.c', name: '' } });
  });

  // Regression: the request never reached the backend, Vite answered with index.html and HTTP 200,
  // and the app showed the dashboard as if the user were signed in.
  it('rejects the Vite index.html page even though it is HTTP 200', () => {
    const result = parseAccountResponse({
      status: 200,
      headers: { 'content-type': 'text/html' },
      data: VITE_INDEX_HTML,
    });
    expect(result.ok).toBe(false);
    expect(result.problem.code).toBe(INVALID_RESPONSE_PROBLEM.code);
  });

  it('rejects HTML even when it is mislabelled as JSON', () => {
    const result = parseAccountResponse({ status: 200, headers: JSON_HEADERS, data: VITE_INDEX_HTML });
    expect(result.ok).toBe(false);
  });

  it('rejects a valid-looking body without a JSON content type', () => {
    expect(parseAccountResponse({ status: 200, headers: { 'content-type': 'text/plain' }, data: ACCOUNT }).ok).toBe(false);
    expect(parseAccountResponse({ status: 200, headers: {}, data: ACCOUNT }).ok).toBe(false);
  });

  it.each([
    ['missing id', { email: 'a@b.c' }],
    ['string id', { id: '7', email: 'a@b.c' }],
    ['zero id', { id: 0, email: 'a@b.c' }],
    ['negative id', { id: -1, email: 'a@b.c' }],
    ['fractional id', { id: 1.5, email: 'a@b.c' }],
    ['NaN id', { id: NaN, email: 'a@b.c' }],
    ['missing email', { id: 7 }],
    ['empty email', { id: 7, email: '' }],
    ['array body', [ACCOUNT]],
    ['null body', null],
    ['empty string body', ''],
  ])('rejects a JSON body with %s', (_label, data) => {
    expect(parseAccountResponse({ status: 200, headers: JSON_HEADERS, data }).ok).toBe(false);
  });

  it.each([201, 204, 302])('rejects non-200 success status %i', (status) => {
    expect(parseAccountResponse({ status, headers: JSON_HEADERS, data: ACCOUNT }).ok).toBe(false);
  });

  it('rejects a missing response', () => {
    expect(parseAccountResponse(undefined).ok).toBe(false);
  });
});

describe('problemFromError', () => {
  it('uses the server code and message from a structured auth error', () => {
    const error = { response: { status: 403, data: { code: 'LegacyAccountLinkRequired', message: 'blocked' } } };
    expect(problemFromError(error)).toEqual({ httpStatus: 403, code: 'LegacyAccountLinkRequired', message: 'blocked' });
  });

  it('does not treat an HTML error page as a structured error', () => {
    const problem = problemFromError({ response: { status: 404, data: VITE_INDEX_HTML } });
    expect(problem.code).toBe('Unknown');
    expect(problem.httpStatus).toBe(404);
  });

  it('handles network errors without a response', () => {
    expect(problemFromError(new Error('Network Error'))).toMatchObject({ httpStatus: 0, code: 'Unknown' });
  });
});

describe('deriveAuthStatus', () => {
  const signedIn = { isLoaded: true, isSignedIn: true, requestKey: 'user_1:0', rejectedKey: null };

  it('is loading until Clerk has loaded', () => {
    expect(deriveAuthStatus({ ...signedIn, isLoaded: false, result: null }).status).toBe('loading');
  });

  it('is signedOut when Clerk has no session', () => {
    expect(deriveAuthStatus({ ...signedIn, isSignedIn: false, requestKey: null, result: null }).status).toBe('signedOut');
  });

  it('is loading while the current account request is pending (stale result for another key)', () => {
    const result = { key: 'user_other:0', account: ACCOUNT, problem: null };
    expect(deriveAuthStatus({ ...signedIn, result }).status).toBe('loading');
  });

  it('is ready only with a validated account for the current request', () => {
    const result = { key: 'user_1:0', account: ACCOUNT, problem: null };
    expect(deriveAuthStatus({ ...signedIn, result })).toEqual({ status: 'ready', problem: null, account: ACCOUNT });
  });

  it('is problem when the account response was invalid (e.g. HTML)', () => {
    const parsed = parseAccountResponse({ status: 200, headers: { 'content-type': 'text/html' }, data: VITE_INDEX_HTML });
    const result = { key: 'user_1:0', account: null, problem: parsed.problem };
    const derived = deriveAuthStatus({ ...signedIn, result });
    expect(derived.status).toBe('problem');
    expect(derived.problem.code).toBe('InvalidResponse');
    expect(derived.account).toBeNull();
  });

  it('never reports ready for a result without an account and without a problem', () => {
    const result = { key: 'user_1:0', account: null, problem: null };
    expect(deriveAuthStatus({ ...signedIn, result }).status).toBe('problem');
  });

  it('is problem when the server rejected the token for the current request', () => {
    const result = { key: 'user_1:0', account: ACCOUNT, problem: null };
    const derived = deriveAuthStatus({ ...signedIn, rejectedKey: 'user_1:0', result });
    expect(derived).toEqual({ status: 'problem', problem: SERVER_REJECTED_PROBLEM, account: null });
  });

  it('ignores a rejection that belonged to an earlier attempt', () => {
    const result = { key: 'user_1:1', account: ACCOUNT, problem: null };
    expect(deriveAuthStatus({ ...signedIn, requestKey: 'user_1:1', rejectedKey: 'user_1:0', result }).status).toBe('ready');
  });
});
