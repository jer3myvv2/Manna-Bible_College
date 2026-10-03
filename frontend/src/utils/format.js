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

const NUMBER = new Intl.NumberFormat('en-KE');

/** 1284 → "1,284" */
export const formatNumber = (value) => NUMBER.format(value ?? 0);

/** ISO date → "3 min ago", "yesterday", "2 Oct" */
export function timeAgo(value) {
  if (!value) return '';
  const date = new Date(value);
  const seconds = Math.round((date.getTime() - Date.now()) / 1000);
  const abs = Math.abs(seconds);
  const rtf = new Intl.RelativeTimeFormat('en', { numeric: 'auto' });
  if (abs < 45) return 'just now';
  if (abs < 3600) return rtf.format(Math.round(seconds / 60), 'minute');
  if (abs < 86400) return rtf.format(Math.round(seconds / 3600), 'hour');
  if (abs < 7 * 86400) return rtf.format(Math.round(seconds / 86400), 'day');
  return date.toLocaleDateString('en-KE', { day: 'numeric', month: 'short', timeZone: 'Africa/Nairobi' });
}

/** "2026-10-03" → "3 Oct" (dates from the API are already local calendar days) */
export function shortDay(isoDay) {
  const [year, month, day] = isoDay.split('-').map(Number);
  return new Date(Date.UTC(year, month - 1, day)).toLocaleDateString('en-KE', {
    day: 'numeric',
    month: 'short',
    timeZone: 'UTC',
  });
}
