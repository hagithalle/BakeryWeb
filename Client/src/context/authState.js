// Pure helpers behind AuthContext, kept separate so they can be unit-tested without React or a browser.

export const SERVER_REJECTED_PROBLEM = {
  httpStatus: 401,
  code: 'Unauthorized',
  message: 'השרת לא אישר את ההתחברות. נסו להתנתק ולהתחבר מחדש.',
};

export const INVALID_RESPONSE_PROBLEM = {
  httpStatus: 0,
  code: 'InvalidResponse',
  message: 'התקבלה תשובה לא צפויה מהשרת. ייתכן שכתובת השרת שגויה או שהשרת אינו פועל.',
};

const isPlainObject = (value) =>
  value !== null && typeof value === 'object' && !Array.isArray(value);

const isJsonContentType = (headers) => {
  const contentType = headers?.['content-type'] ?? headers?.['Content-Type'] ?? '';
  return /^application\/(?:[\w.+-]+\+)?json\b/i.test(String(contentType));
};

/**
 * Validates the axios response of GET /api/auth/me.
 *
 * Only a 200 JSON response describing an internal account counts as success. Anything else, for example the
 * Vite dev server's index.html (also HTTP 200) when the request never reached the backend, is rejected.
 *
 * @returns {{ ok: true, account: { id: number, email: string, name: string } } | { ok: false, problem: object }}
 */
export function parseAccountResponse(response) {
  const data = response?.data;
  const valid =
    response?.status === 200 &&
    isJsonContentType(response?.headers) &&
    isPlainObject(data) &&
    Number.isInteger(data.id) &&
    data.id > 0 &&
    typeof data.email === 'string' &&
    data.email.length > 0;

  if (!valid) {
    return { ok: false, problem: { ...INVALID_RESPONSE_PROBLEM, httpStatus: response?.status ?? 0 } };
  }

  return {
    ok: true,
    account: { id: data.id, email: data.email, name: typeof data.name === 'string' ? data.name : '' },
  };
}

/** Converts a failed /api/auth/me request (axios error) into a problem the UI can show. */
export function problemFromError(error) {
  const body = error?.response?.data;
  const structured = isPlainObject(body) && typeof body.code === 'string';
  return {
    httpStatus: error?.response?.status ?? 0,
    code: structured ? body.code : 'Unknown',
    message: structured && typeof body.message === 'string' ? body.message : 'לא ניתן לטעון את החשבון כרגע.',
  };
}

/**
 * Derives the auth status from Clerk state and the last /api/auth/me result.
 * status: 'loading' | 'signedOut' | 'ready' | 'problem'. 'ready' requires a validated account.
 */
export function deriveAuthStatus({ isLoaded, isSignedIn, requestKey, rejectedKey, result }) {
  if (!isLoaded) return { status: 'loading', problem: null, account: null };
  if (!isSignedIn) return { status: 'signedOut', problem: null, account: null };
  if (rejectedKey !== null && rejectedKey !== undefined && rejectedKey === requestKey) {
    return { status: 'problem', problem: SERVER_REJECTED_PROBLEM, account: null };
  }
  if (!result || result.key !== requestKey) return { status: 'loading', problem: null, account: null };
  if (result.problem) return { status: 'problem', problem: result.problem, account: null };
  if (!result.account) return { status: 'problem', problem: INVALID_RESPONSE_PROBLEM, account: null };
  return { status: 'ready', problem: null, account: result.account };
}
