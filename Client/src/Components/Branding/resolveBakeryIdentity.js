/**
 * Each bakery's own identity (name + logo) shown inside the app, kept separate from the
 * universal BakeryManager brand.
 *
 * Tenant safety: the identity comes ONLY from the signed-in account's own data. There is no
 * global default name or logo file, so one bakery's branding can never appear for another user.
 * The backend does not store a bakery name or logo yet; until it does, `business` is null and a
 * neutral initial-letter placeholder is shown.
 */
export const DEFAULT_BAKERY_LABEL = 'המאפייה שלי';

const firstLetter = (text) => {
  const match = String(text ?? '').trim().match(/\p{L}/u);
  return match ? match[0].toLocaleUpperCase() : null;
};

/**
 * @param {{ business?: { name?: string, logoUrl?: string } | null, user?: { name?: string, email?: string } | null }} source
 * @returns {{ name: string, hasOwnName: boolean, logoUrl: string | null, initial: string | null }}
 */
export function resolveBakeryIdentity({ business = null, user = null } = {}) {
  const ownName = business?.name?.trim() || '';
  return {
    name: ownName || DEFAULT_BAKERY_LABEL,
    hasOwnName: Boolean(ownName),
    logoUrl: business?.logoUrl || null,
    // Initial of the bakery name; until that exists, of the signed-in person's own name/email.
    initial: firstLetter(ownName) ?? firstLetter(user?.name) ?? firstLetter(user?.email),
  };
}
