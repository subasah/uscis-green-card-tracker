const PENDING_VALUES = new Set([
  '',
  'pending',
  'not yet',
  'not applied',
  'n/a',
  'na',
  'none',
  '----',
  '------',
  'unknown',
  'haven\'t received any info, only approval notice',
]);

export function parseGoogleDate(value) {
  if (value == null || value === '') return null;

  if (typeof value === 'string') {
    const dateMatch = value.match(/^Date\((\d+),(\d+),(\d+)\)$/);
    if (dateMatch) {
      const year = Number(dateMatch[1]);
      const month = Number(dateMatch[2]);
      const day = Number(dateMatch[3]);
      const date = new Date(year, month, day);
      return Number.isNaN(date.getTime()) ? null : date;
    }
  }

  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return value;
  }

  const text = String(value).trim();
  if (!text || PENDING_VALUES.has(text.toLowerCase())) return null;

  const parsed = new Date(text);
  if (!Number.isNaN(parsed.getTime()) && parsed.getFullYear() > 1990) {
    return parsed;
  }

  const slashMatch = text.match(/^(\d{1,2})\/(\d{1,2})\/(\d{2,4})$/);
  if (slashMatch) {
    let year = Number(slashMatch[3]);
    if (year < 100) year += 2000;
    const date = new Date(year, Number(slashMatch[1]) - 1, Number(slashMatch[2]));
    return Number.isNaN(date.getTime()) ? null : date;
  }

  const monthYear = text.match(/^(\d{1,2})\/(\d{4})$/);
  if (monthYear) {
    return new Date(Number(monthYear[2]), Number(monthYear[1]) - 1, 1);
  }

  return null;
}

export function formatDate(date) {
  if (date == null || date === '') return '—';

  let value = date;
  if (!(value instanceof Date)) {
    value = parseGoogleDate(value) ?? new Date(value);
  }

  if (!(value instanceof Date) || Number.isNaN(value.getTime())) return '—';

  return value.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export function daysBetween(start, end) {
  if (!start || !end) return null;
  const ms = end.getTime() - start.getTime();
  return Math.round(ms / (1000 * 60 * 60 * 24));
}

export function normalizeText(value) {
  if (value == null) return '';
  return String(value).trim();
}

export function normalizeCountryOfConcern(value) {
  const text = normalizeText(value).replace(/[\u200b\u200c\u200d\ufeff]/g, '');
  if (!text) return '';

  const lower = text.toLowerCase();
  if (lower === 'none' || lower === 'no' || lower === 'n/a') return 'None';

  const numericMatch = text.match(/^(\d+)\s*(?:coc|cuc)?$/i);
  if (numericMatch) return `${numericMatch[1]} COC`;

  const labeledMatch = text.match(/^(\d+)\s+(?:coc|cuc)$/i);
  if (labeledMatch) return `${labeledMatch[1]} COC`;

  return text;
}

export function countryFilterMatches(recordValue, filterValue) {
  if (!filterValue || filterValue === 'all') return true;
  return normalizeCountryOfConcern(recordValue) === normalizeCountryOfConcern(filterValue);
}

export function isPendingValue(value) {
  if (value instanceof Date && !Number.isNaN(value.getTime())) return false;
  const text = normalizeText(value).toLowerCase();
  return !text || PENDING_VALUES.has(text);
}

export function normalizeCategory(value) {
  return normalizeText(value).replace(/\s+/g, ' ').toUpperCase();
}

export function deriveStatus(record) {
  if (record.gcApprovalDate) return 'approved';
  if (record.gcReceivedDate && !isPendingValue(record.gcReceivedDate)) return 'approved';
  if (record.biometricDate || record.receiptDate) return 'in_progress';
  return 'submitted';
}

export function statusLabel(status) {
  switch (status) {
    case 'approved':
      return 'Approved';
    case 'in_progress':
      return 'In Progress';
    default:
      return 'Submitted';
  }
}

export function median(values) {
  if (!values.length) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0
    ? Math.round((sorted[mid - 1] + sorted[mid]) / 2)
    : sorted[mid];
}

export function average(values) {
  if (!values.length) return null;
  return Math.round(values.reduce((sum, value) => sum + value, 0) / values.length);
}

export function percentile(values, p) {
  if (!values.length) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const index = Math.ceil((p / 100) * sorted.length) - 1;
  return sorted[Math.max(0, Math.min(index, sorted.length - 1))];
}

export function extractReceiptNumbers(text) {
  const matches = String(text || '').match(/\b(?:IOE|MSC|EAC|WAC|LIN|SRC|NBC)[A-Z0-9]{7,12}\b/gi);
  return matches ? [...new Set(matches.map((m) => m.toUpperCase()))] : [];
}

export function parseSilentUpdates(text) {
  const raw = normalizeText(text);
  if (!raw) return [];

  const datePatterns = raw.match(/\b\d{1,2}\/\d{1,2}\/\d{2,4}\b/g) || [];
  const isoPatterns = raw.match(/\b\d{4}-\d{2}-\d{2}\b/g) || [];

  return [...datePatterns, ...isoPatterns].map((part) => {
    const parsed = parseGoogleDate(part) || parseGoogleDate(part.replace(/-/g, '/'));
    return parsed ? { date: parsed, label: part } : null;
  }).filter(Boolean);
}

export function monthKey(date) {
  if (!date) return null;
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
}

export function monthLabel(key) {
  if (!key) return '';
  const [year, month] = key.split('-');
  const date = new Date(Number(year), Number(month) - 1, 1);
  return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
}
