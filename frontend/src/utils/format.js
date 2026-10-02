/** Small formatting helpers shared by pages. */

/** ["A", "B", "C"] → "A, B and C" */
export function joinList(items = []) {
  if (items.length <= 1) return items.join('');
  return `${items.slice(0, -1).join(', ')} and ${items[items.length - 1]}`;
}

/** ISO date string → "2 October 2026" (East Africa locale formatting). */
export function formatDate(value, withTime = false) {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleString('en-KE', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    ...(withTime ? { hour: '2-digit', minute: '2-digit' } : {}),
    timeZone: 'Africa/Nairobi',
  });
}

/** "Theology" → "theology" style comparisons for filters. */
export const sameText = (a = '', b = '') => a.trim().toLowerCase() === b.trim().toLowerCase();

/** Client-side mirrors of the server validation rules. */
export const EMAIL_PATTERN = /^[A-Za-z0-9._%+'-]+@[A-Za-z0-9-]+(\.[A-Za-z0-9-]+)*\.[A-Za-z]{2,}$/;

export function isValidPhone(raw = '') {
  let phone = raw.replace(/[\s\-().]/g, '');
  if (phone.startsWith('00')) phone = `+${phone.slice(2)}`;
  return /^(?:\+?254|0)[17]\d{8}$/.test(phone) || /^\+[1-9]\d{7,14}$/.test(phone);
}
