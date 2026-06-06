import {
  AGENT_SHEET,
  CASE_SHEETS,
  RULES_SHEET,
  SPREADSHEET_ID,
  receiptMonthKey,
} from '../config';
import {
  countryFilterMatches,
  deriveStatus,
  extractReceiptNumbers,
  normalizeCategory,
  normalizeCountryOfConcern,
  normalizeText,
  parseGoogleDate,
} from './dates';

const FIELD_ALIASES = {
  priorityDate: ['priority date', 'i-140 priority date', 'pd'],
  category: ['category'],
  submissionDate: ['i-485 submission date'],
  receiptDate: [
    'i-485 receipt date',
    'i-485 received date (rd)',
    'i-485 received date',
    'i-485 receipt date (rd)',
  ],
  noticeDate: ['i-485 notice (i-797) date'],
  blockNumber: ['block #'],
  lockbox: ['lockbox'],
  biometricDate: ['biometric date'],
  eadApprovalDate: [
    'ead approval date if applied',
    'ead approval date (if applied)',
    'ead (i-765) approval date if applied',
  ],
  apApprovalDate: ['advanced parole (i-131) approval if applied'],
  fieldOffice: ['field office name', 'field office'],
  transferDate: ['field office transfer date'],
  interview: ['interview yes or no', 'interview (yes or no)', 'interview'],
  silentUpdates: [
    'silent updates date',
    'silent updates date after biometric',
    'silent updates after biometrics',
    'silent updates after biometric',
  ],
  fta0Updates: ['fta0 updates'],
  gcApprovalDate: ['gc approval date', 'gc approved date'],
  gcReceivedDate: ['gc received date'],
  countryOfConcern: ['are you from a country of concern'],
  comments: ['comments', 'any comments', 'single/spouse status', 'questions', 'additional comments'],
};

function normalizeHeader(label) {
  return normalizeText(label).toLowerCase().replace(/\s+/g, ' ');
}

function buildColumnMap(cols) {
  const map = {};
  cols.forEach((col, index) => {
    const header = normalizeHeader(col.label);
    if (!header) return;
    Object.entries(FIELD_ALIASES).forEach(([field, aliases]) => {
      if (aliases.some((alias) => header === alias || header.startsWith(alias))) {
        map[field] = index;
      }
    });
  });
  return map;
}

function cellValue(row, index) {
  if (index == null || !row?.c?.[index]) return null;
  const cell = row.c[index];
  if (cell.v == null && cell.f == null) return null;
  return cell.v ?? cell.f;
}

function cellDate(row, index) {
  return parseGoogleDate(cellValue(row, index));
}

function cellText(row, index) {
  return normalizeText(cellValue(row, index));
}

function hasMeaningfulData(record) {
  return Boolean(
    record.priorityDate ||
      record.receiptDate ||
      record.blockNumber ||
      record.category ||
      record.biometricDate ||
      record.gcApprovalDate
  );
}

function normalizeRow(row, columnMap, sheetMeta, rowIndex) {
  const priorityDate = cellDate(row, columnMap.priorityDate);
  const receiptDate = cellDate(row, columnMap.receiptDate);
  const biometricDate = cellDate(row, columnMap.biometricDate);
  const gcApprovalDate = cellDate(row, columnMap.gcApprovalDate);
  const blockNumber = cellText(row, columnMap.blockNumber);
  const comments = cellText(row, columnMap.comments);
  const silentUpdates = cellText(row, columnMap.silentUpdates);
  const fta0Updates = cellText(row, columnMap.fta0Updates);
  const combinedText = [blockNumber, comments, silentUpdates, fta0Updates].join(' ');

  const record = {
    id: `${sheetMeta.gid}-${rowIndex}`,
    sheetName: sheetMeta.name,
    sheetGid: sheetMeta.gid,
    receiptMonth: sheetMeta.receiptMonth,
    priorityDate,
    category: normalizeCategory(cellText(row, columnMap.category)),
    submissionDate: cellDate(row, columnMap.submissionDate),
    receiptDate,
    noticeDate: cellDate(row, columnMap.noticeDate),
    blockNumber: blockNumber.toUpperCase(),
    lockbox: cellText(row, columnMap.lockbox),
    biometricDate,
    eadApprovalDate: cellText(row, columnMap.eadApprovalDate),
    apApprovalDate: cellText(row, columnMap.apApprovalDate),
    fieldOffice: cellText(row, columnMap.fieldOffice),
    transferDate: cellDate(row, columnMap.transferDate),
    interview: cellText(row, columnMap.interview),
    silentUpdates,
    fta0Updates,
    gcApprovalDate,
    gcReceivedDate: cellDate(row, columnMap.gcReceivedDate) ?? cellText(row, columnMap.gcReceivedDate),
    countryOfConcern: normalizeCountryOfConcern(cellText(row, columnMap.countryOfConcern)),
    comments,
    receiptNumbers: extractReceiptNumbers(combinedText),
  };

  record.status = deriveStatus(record);
  return record;
}

function parseCaseResponse(payload, sheetMeta) {
  const table = payload?.table;
  if (!table?.cols?.length) return [];

  const columnMap = buildColumnMap(table.cols);
  return (table.rows || [])
    .map((row, index) => normalizeRow(row, columnMap, sheetMeta, index))
    .filter(hasMeaningfulData);
}

async function fetchGoogleSheet(gid) {
  const url = `https://docs.google.com/spreadsheets/d/${SPREADSHEET_ID}/gviz/tq?tqx=out:json&gid=${gid}`;
  const response = await fetch(url);
  if (!response.ok) throw new Error(`HTTP ${response.status}`);

  const text = await response.text();
  const jsonText = text.replace(/^[\s\S]*?(\{[\s\S]*\})[\s\S]*$/, '$1');
  return JSON.parse(jsonText);
}

async function fetchCasesFromSheet(sheetMeta) {
  const payload = await fetchGoogleSheet(sheetMeta.gid);
  return parseCaseResponse(payload, sheetMeta);
}

function parseAgentResponse(payload) {
  const rows = payload?.table?.rows || [];
  const agents = [];

  rows.forEach((row, index) => {
    const cells = row.c || [];
    const number = normalizeText(cellValue({ c: cells }, 0));
    const name = normalizeText(cellValue({ c: cells }, 1));
    const agentId = normalizeText(cellValue({ c: cells }, 2));
    const dateContacted = parseGoogleDate(cellValue({ c: cells }, 3));
    const rating = normalizeText(cellValue({ c: cells }, 4));
    const comment = normalizeText(cellValue({ c: cells }, 5));

    if (!name || name.toLowerCase() === 'agent name') return;

    agents.push({
      id: `agent-${index}`,
      number,
      name,
      agentId,
      dateContacted,
      rating,
      comment,
      helpful: rating.toLowerCase() === 'helpful',
    });
  });

  return agents;
}

function parseRulesResponse(payload) {
  const cols = payload?.table?.cols || [];
  const text = cols.map((col) => col.label).join('\n');
  const links = [...text.matchAll(/https?:\/\/[^\s)"]+/g)].map((match) => match[0]);
  return {
    rulesText: text.slice(0, 1200),
    links: [...new Set(links)],
  };
}


export async function fetchAllData() {
  const caseResults = await Promise.allSettled(CASE_SHEETS.map((sheet) => fetchCasesFromSheet(sheet)));
  const cases = [];
  const errors = [];

  caseResults.forEach((result, index) => {
    if (result.status === 'fulfilled') {
      cases.push(...result.value);
    } else {
      errors.push(`${CASE_SHEETS[index].name}: ${result.reason.message}`);
    }
  });

  let agents = [];
  let rules = { rulesText: '', links: [] };

  try {
    agents = parseAgentResponse(await fetchGoogleSheet(AGENT_SHEET.gid));
  } catch (error) {
    errors.push(`Agents: ${error.message}`);
  }

  try {
    rules = parseRulesResponse(await fetchGoogleSheet(RULES_SHEET.gid));
  } catch (error) {
    errors.push(`Rules: ${error.message}`);
  }

  return {
    cases: dedupeCases(cases),
    agents,
    rules,
    errors,
  };
}

/** @deprecated use fetchAllData */
export async function fetchAllCases() {
  const data = await fetchAllData();
  return { cases: data.cases, errors: data.errors };
}

function dedupeCases(cases) {
  const seen = new Map();

  cases.forEach((record) => {
    const key = [
      record.blockNumber,
      record.priorityDate?.toISOString() ?? '',
      record.receiptDate?.toISOString() ?? '',
      record.category,
      record.biometricDate?.toISOString() ?? '',
    ].join('|');

    const existing = seen.get(key);
    if (!existing || scoreRecord(record) > scoreRecord(existing)) {
      seen.set(key, record);
    }
  });

  return [...seen.values()];
}

function scoreRecord(record) {
  let score = 0;
  if (record.gcApprovalDate) score += 4;
  if (record.biometricDate) score += 2;
  if (record.comments) score += 1;
  if (record.silentUpdates) score += 1;
  if (record.fta0Updates) score += 1;
  return score;
}

export function uniqueValues(cases, field) {
  return [...new Set(cases.map((item) => item[field]).filter(Boolean))].sort();
}

export function uniqueCountryValues(cases) {
  return [...new Set(cases.map((item) => item.countryOfConcern).filter(Boolean))].sort((a, b) => {
    if (a === 'None') return 1;
    if (b === 'None') return -1;
    return a.localeCompare(b, undefined, { numeric: true });
  });
}

export function filterCases(cases, filters) {
  const query = normalizeText(filters.query).toLowerCase();

  return cases.filter((record) => {
    if (filters.category !== 'all' && record.category !== filters.category) return false;
    if (filters.status !== 'all' && record.status !== filters.status) return false;
    if (filters.fieldOffice !== 'all' && record.fieldOffice !== filters.fieldOffice) return false;
    if (!countryFilterMatches(record.countryOfConcern, filters.country)) return false;
    if (filters.sheet !== 'all' && record.sheetName !== filters.sheet) return false;
    if (filters.receiptMonth !== 'all' && record.receiptMonth !== filters.receiptMonth) return false;

    if (!query) return true;

    const haystack = [
      record.blockNumber,
      record.category,
      record.fieldOffice,
      record.lockbox,
      record.comments,
      record.silentUpdates,
      record.fta0Updates,
      record.countryOfConcern,
      record.receiptNumbers.join(' '),
      record.sheetName,
      record.priorityDate?.toLocaleDateString('en-US'),
      record.receiptDate?.toLocaleDateString('en-US'),
      record.biometricDate?.toLocaleDateString('en-US'),
      record.gcApprovalDate?.toLocaleDateString('en-US'),
    ]
      .join(' ')
      .toLowerCase();

    return haystack.includes(query);
  });
}

export function findSimilarCases(cases, target) {
  if (!target) return [];

  return cases
    .filter((record) => record.id !== target.id)
    .map((record) => {
      let score = 0;
      if (record.category && record.category === target.category) score += 4;
      if (record.receiptMonth && record.receiptMonth === target.receiptMonth) score += 3;
      if (record.blockNumber && target.blockNumber && record.blockNumber === target.blockNumber) score += 5;
      if (record.fieldOffice && record.fieldOffice === target.fieldOffice) score += 2;
      if (
        record.countryOfConcern &&
        countryFilterMatches(record.countryOfConcern, target.countryOfConcern)
      ) {
        score += 1;
      }
      if (record.lockbox && record.lockbox === target.lockbox) score += 1;

      if (target.priorityDate && record.priorityDate) {
        const diff = Math.abs(daysBetween(record.priorityDate, target.priorityDate) ?? 9999);
        if (diff <= 90) score += 3;
        else if (diff <= 180) score += 2;
        else if (diff <= 365) score += 1;
      }

      if (target.receiptDate && record.receiptDate) {
        const diff = Math.abs(daysBetween(record.receiptDate, target.receiptDate) ?? 9999);
        if (diff <= 14) score += 3;
        else if (diff <= 30) score += 2;
        else if (diff <= 90) score += 1;
      }

      return { record, score };
    })
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 10)
    .map((item) => item.record);
}

function daysBetween(a, b) {
  const ms = Math.abs(a.getTime() - b.getTime());
  return Math.round(ms / (1000 * 60 * 60 * 24));
}

function diffDays(start, end) {
  if (!start || !end) return null;
  return Math.round((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
}

function median(values) {
  if (!values.length) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0
    ? Math.round((sorted[mid - 1] + sorted[mid]) / 2)
    : sorted[mid];
}

function percentile(values, p) {
  if (!values.length) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const index = Math.ceil((p / 100) * sorted.length) - 1;
  return sorted[Math.max(0, Math.min(index, sorted.length - 1))];
}

export function buildInsights(cases) {
  const approved = cases.filter((record) => record.status === 'approved');

  const receiptToBio = approved
    .map((record) => diffDays(record.receiptDate, record.biometricDate))
    .filter((value) => value != null && value >= 0);

  const bioToApproval = approved
    .map((record) => diffDays(record.biometricDate, record.gcApprovalDate))
    .filter((value) => value != null && value >= 0);

  const receiptToApproval = approved
    .map((record) => diffDays(record.receiptDate, record.gcApprovalDate))
    .filter((value) => value != null && value >= 0);

  const byCategory = groupStats(approved, 'category');
  const byFieldOffice = groupStats(approved, 'fieldOffice');
  const byReceiptMonth = groupStats(approved, 'receiptMonth');

  const monthlyApprovals = {};
  approved.forEach((record) => {
    if (!record.gcApprovalDate) return;
    const key = receiptMonthKey(record.gcApprovalDate);
    monthlyApprovals[key] = (monthlyApprovals[key] || 0) + 1;
  });

  return {
    totalCases: cases.length,
    approvedCount: approved.length,
    inProgressCount: cases.filter((record) => record.status === 'in_progress').length,
    receiptToBio,
    bioToApproval,
    receiptToApproval,
    byCategory,
    byFieldOffice,
    byReceiptMonth,
    monthlyApprovals: Object.entries(monthlyApprovals)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([month, count]) => ({ month, count })),
  };
}

function groupStats(records, field) {
  const groups = {};
  const minCount = records.length <= 40 ? 1 : 2;

  records.forEach((record) => {
    const key = record[field] || 'Unknown';
    if (!groups[key]) groups[key] = [];
    const duration = diffDays(record.receiptDate, record.gcApprovalDate);
    if (duration != null && duration >= 0) groups[key].push(duration);
  });

  return Object.entries(groups)
    .map(([name, values]) => ({
      name,
      count: values.length,
      medianDays: median(values),
    }))
    .filter((item) => item.count >= minCount)
    .sort((a, b) => b.count - a.count)
    .slice(0, 12);
}

export function estimateForCase(target, similarCases) {
  const approvedSimilar = similarCases.filter((record) => record.status === 'approved');
  const sameMonth = similarCases.filter(
    (record) => record.receiptMonth && record.receiptMonth === target.receiptMonth
  );
  const pool = approvedSimilar.length ? approvedSimilar : sameMonth.length ? sameMonth : similarCases;

  const receiptToApproval = pool
    .map((record) => diffDays(record.receiptDate, record.gcApprovalDate))
    .filter((value) => value != null && value >= 0);

  const bioToApproval = pool
    .map((record) => diffDays(record.biometricDate, record.gcApprovalDate))
    .filter((value) => value != null && value >= 0);

  const receiptToBio = pool
    .map((record) => diffDays(record.receiptDate, record.biometricDate))
    .filter((value) => value != null && value >= 0);

  const latestStage = target.gcApprovalDate
    ? 'approved'
    : target.transferDate || /transfer|nbc|fo/i.test(target.fieldOffice)
      ? 'post_transfer'
      : target.biometricDate
        ? 'post_biometric'
        : target.receiptDate
          ? 'post_receipt'
          : 'early';

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  let estimatedDays = null;
  let projectedApprovalDate = null;
  let projectedRange = null;
  let nextStep = 'Add your I-485 receipt date to unlock month-tab matching and better estimates.';

  if (latestStage === 'approved') {
    nextStep = 'Your case appears approved in the tracker. Monitor GC card delivery and confirm status on USCIS online.';
  } else if (latestStage === 'post_transfer') {
    estimatedDays = median(bioToApproval);
    nextStep = estimatedDays
      ? `After FO transfer, similar ${target.category || ''} cases took a median of ${estimatedDays} days from biometrics to approval. Watch for 3rd FTA0 — community notes it can indicate review, not always approval within 24 hours.`
      : 'Field office transfer detected. Community discussions suggest silent updates often precede FO assignment — ask Emma which FO has your case.';
  } else if (latestStage === 'post_biometric') {
    estimatedDays = median(bioToApproval);
    const daysSinceBio = diffDays(target.biometricDate, today);
    nextStep = estimatedDays
      ? `You are ${daysSinceBio ?? 0} days past biometrics. Similar cases took a median of ${estimatedDays} days from biometrics to approval. Watch silent updates and block # movement in your receipt month tab (${target.sheetName}).`
      : 'Post-biometrics stage: monitor for silent updates, FTA0 entries, and FO transfer. Compare your block # with approved cases in the same receipt month.';
  } else if (latestStage === 'post_receipt') {
    estimatedDays = median(receiptToBio);
    nextStep = estimatedDays
      ? `Biometrics in similar cases were scheduled around ${estimatedDays} days after receipt. Check the Documents tab in myUSCIS — appointments sometimes appear there before online status updates.`
      : 'After receipt, expect biometrics scheduling. Use your receipt month tab in the spreadsheet to compare block # progress with peers.';
  }

  if (latestStage !== 'approved' && target.receiptDate && receiptToApproval.length >= 3) {
    const totalMedian = median(receiptToApproval);
    const p25 = percentile(receiptToApproval, 25);
    const p75 = percentile(receiptToApproval, 75);
    const daysSinceReceipt = diffDays(target.receiptDate, today) ?? 0;
    const remainingMedian = Math.max(0, (totalMedian ?? 0) - daysSinceReceipt);

    projectedApprovalDate = new Date(today);
    projectedApprovalDate.setDate(projectedApprovalDate.getDate() + remainingMedian);

    if (p25 != null && p75 != null) {
      const low = new Date(target.receiptDate);
      low.setDate(low.getDate() + p25);
      const high = new Date(target.receiptDate);
      high.setDate(high.getDate() + p75);
      projectedRange = { low, high, p25, p75 };
    }
  }

  return {
    latestStage,
    nextStep,
    estimatedDays,
    medianTotalDays: median(receiptToApproval),
    medianBioToApproval: median(bioToApproval),
    medianReceiptToBio: median(receiptToBio),
    projectedApprovalDate,
    projectedRange,
    sampleSize: pool.length,
    sameMonthSample: sameMonth.length,
  };
}

export function getCasesForReceiptMonth(cases, receiptDate) {
  const key = receiptMonthKey(receiptDate);
  if (!key) return cases;
  return cases.filter((record) => record.receiptMonth === key || receiptMonthKey(record.receiptDate) === key);
}

export function getBlockProgress(cases, blockNumber) {
  if (!blockNumber) return null;
  const normalized = blockNumber.toUpperCase();
  const blockCases = cases.filter((record) => record.blockNumber === normalized);
  if (!blockCases.length) return null;

  const approved = blockCases.filter((record) => record.status === 'approved');
  return {
    total: blockCases.length,
    approved: approved.length,
    pending: blockCases.length - approved.length,
    latestApproval: approved
      .map((record) => record.gcApprovalDate)
      .filter(Boolean)
      .sort((a, b) => b - a)[0] ?? null,
  };
}
