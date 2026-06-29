export const LOW_STOCK_THRESHOLD = 5;

export function getStockStatus(qty) {
  if (qty === 0) return 'critical';
  if (qty <= LOW_STOCK_THRESHOLD) return 'low';
  return 'healthy';
}

export const STOCK_CONFIG = {
  healthy: { label: 'תקין', bg: '#E8F5E9', color: '#2E7D32' },
  low: { label: 'עומד להיגמר', bg: '#FFF3E0', color: '#E65100' },
  critical: { label: 'חסר במלאי', bg: '#FFEBEE', color: '#C62828' },
};
