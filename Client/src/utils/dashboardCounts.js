// Turns the dashboard's Promise.allSettled results into counts.
// A source that failed (or returned something that is not a list) gives null, shown as "—",
// so an error is never displayed as a real zero.
export const DASHBOARD_SOURCES = ['products', 'recipes', 'ingredients', 'packaging'];

export function countsFromSettled(settled) {
  const counts = {};
  DASHBOARD_SOURCES.forEach((key, i) => {
    const r = settled?.[i];
    counts[key] = r?.status === 'fulfilled' && Array.isArray(r.value) ? r.value.length : null;
  });
  return counts;
}

export const hasFailedCounts = (counts) => DASHBOARD_SOURCES.some((key) => counts?.[key] === null);
