/**
 * Format a number as Ethiopian Birr currency.
 */
export function formatCurrency(amount) {
  const num = parseFloat(amount) || 0;
  return `${num.toLocaleString('en-ET', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ETB`;
}

/**
 * Format a date string to human-readable form.
 */
export function formatDate(dateStr) {
  if (!dateStr) return '—';
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-ET', { day: 'numeric', month: 'long', year: 'numeric' });
}

/**
 * Format a time string (HH:MM:SS) to HH:MM.
 */
export function formatTime(timeStr) {
  if (!timeStr) return '—';
  return timeStr.slice(0, 5);
}

/**
 * Today's date as YYYY-MM-DD.
 */
export function today() {
  return new Date().toISOString().split('T')[0];
}

/**
 * Format a category string for display.
 */
export function formatCategory(cat) {
  const map = {
    COFFEE: 'Coffee',
    NON_COFFEE: 'Non-Coffee',
    BREAKFAST: 'Breakfast',
    FOOD: 'Food',
    OTHER: 'Other',
  };
  return map[cat] || cat;
}
