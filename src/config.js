export const SPREADSHEET_ID = '1rg0ZqadJ3_fd8pWQ9WoDpzZCU6KQEJ5vX1vUkd0DKXI';

/** Case tabs — choose by I-485 receipt date (per spreadsheet rules). */
export const CASE_SHEETS = [
  { gid: '1783561377', name: "May '26", receiptMonth: '2026-05', format: 'new' },
  { gid: '1830186092', name: "Apr '26", receiptMonth: '2026-04', format: 'new' },
  { gid: '1251047621', name: "Mar '26", receiptMonth: '2026-03', format: 'main' },
  { gid: '1632428141', name: "Feb '26", receiptMonth: '2026-02', format: 'archive' },
  { gid: '1942672604', name: "Jan '26", receiptMonth: '2026-01', format: 'standard' },
  { gid: '792864653', name: "Dec '25", receiptMonth: '2025-12', format: 'standard' },
  { gid: '1848080157', name: "Nov '25", receiptMonth: '2025-11', format: 'standard' },
  { gid: '0', name: "Oct '25", receiptMonth: '2025-10', format: 'legacy' },
  { gid: '1415801280', name: "Jul '25", receiptMonth: '2025-07', format: 'legacy' },
  { gid: '661913085', name: "Sep '25", receiptMonth: '2025-09', format: 'legacy' },
  { gid: '236390846', name: 'Recent / Mixed', receiptMonth: null, format: 'legacy' },
];

export const AGENT_SHEET = { gid: '602920648', name: 'Emma Agents' };
export const RULES_SHEET = { gid: '1559220255', name: 'Please Read' };

export const SOURCE_URL =
  'https://docs.google.com/spreadsheets/d/1rg0ZqadJ3_fd8pWQ9WoDpzZCU6KQEJ5vX1vUkd0DKXI/htmlview';

export const EXTERNAL_RESOURCES = [
  { label: 'Web-based tracker', url: 'https://i485tracker.opentoolkits.com/' },
  { label: 'Discord — EB AOS', url: 'https://discord.gg/2tKmMEvW3k' },
  { label: 'NY Field Office transfers (Telegram)', url: 'https://t.me/I485_ny_fo_eb' },
];

export const EMMA_URL = 'https://egov.uscis.gov/emma/chat';

export const REDDIT_SUBREDDIT = 'EB2_NIW';
export const REDDIT_SOURCE_URL = `https://www.reddit.com/r/${REDDIT_SUBREDDIT}/`;
export const REDDIT_DATA_URL = `${import.meta.env.BASE_URL}data/reddit-eb2niw.json`;

export const REDDIT_TOPICS = [
  { id: 'approval', label: 'Approval' },
  { id: 'i485', label: 'I-485 / AOS' },
  { id: 'i140', label: 'I-140 / NIW' },
  { id: 'lawyer', label: 'Lawyer / firm' },
  { id: 'timeline', label: 'Timeline' },
  { id: 'question', label: 'Question' },
];

export const CHAT_CONFIG = {
  url: import.meta.env.VITE_SUPABASE_URL || '',
  anonKey: import.meta.env.VITE_SUPABASE_ANON_KEY || '',
  retentionDays: 15,
  maxMessageLength: 2000,
  maxDisplayNameLength: 40,
};

export const CHAT_CASE_TAGS = [
  { id: '', label: 'General' },
  { id: 'biometrics', label: 'Biometrics pending' },
  { id: 'interview', label: 'Interview stage' },
  { id: 'rfe', label: 'RFE / evidence' },
  { id: 'approved', label: 'Approved' },
  { id: 'processing', label: 'Still processing' },
  { id: 'block', label: 'Block / receipt month' },
];

export function chatCaseTagLabel(id) {
  return CHAT_CASE_TAGS.find((tag) => tag.id === id)?.label || null;
}

export function receiptMonthKey(date) {
  if (!date) return null;
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
}

export function recommendSheetForReceiptDate(receiptDate) {
  if (!receiptDate) return null;
  const key = receiptMonthKey(receiptDate);
  return CASE_SHEETS.find((sheet) => sheet.receiptMonth === key) ?? null;
}

export function formatReceiptMonthLabel(key) {
  if (!key) return 'Unknown';
  const [year, month] = key.split('-');
  const date = new Date(Number(year), Number(month) - 1, 1);
  return date.toLocaleDateString('en-US', { month: 'short', year: '2-digit' }).replace(' ', " '");
}
