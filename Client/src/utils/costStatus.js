// Cost reliability as reported by the server (CostWarning.blocking / costStatus).
// A blocked cost is never shown as a number: the UI shows "—" and the reasons instead.

export const blockingWarnings = (warnings) => (warnings || []).filter((w) => w?.blocking === true);
export const infoWarnings = (warnings) => (warnings || []).filter((w) => w?.blocking !== true);

/** True when the server marked the recipe/product cost as unreliable. */
export const isCostBlocked = (entity) => {
  if (!entity) return false;
  const status = entity.costStatus ?? entity.CostStatus;
  if (status === 'Blocked') return true;
  return blockingWarnings(entity.costWarnings ?? entity.CostWarnings).length > 0;
};

/**
 * Is this specific line's cost unreliable? Warnings from sub-recipes carry their own recipeId and line ids,
 * so both must match.
 */
export const isLineBlocked = (warnings, recipeId, lineId) =>
  lineId != null && blockingWarnings(warnings).some((w) => w.lineId === lineId && w.recipeId === recipeId);

export const uniqueMessages = (warnings) => [...new Set((warnings || []).map((w) => w.message))];

/** "₪12.34", or "—" when the cost is blocked (never a misleading number). */
export const costText = (value, blocked) => (blocked ? "—" : `₪${(Number(value) || 0).toFixed(2)}`);
