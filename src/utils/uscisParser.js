import { getEventInfo } from '../data/eventCodes';
import { parseGoogleDate } from './dates';

const APPROVAL_CODES = new Set(['DA', 'DH', 'IEA', 'IEE', 'IEC', 'H008', 'SA']);
const DENIAL_CODES = new Set(['EA', 'IFA']);
const INTERVIEW_CODES = new Set(['FJ', 'HG', 'IM', 'FM']);
const BG_CODES = new Set(['FTA0', 'FTA1', 'FNB', 'FNA']);

export function sanitizeJSONInput(raw) {
  let text = String(raw ?? '').trim();
  text = text.replace(/^\uFEFF/, '');

  if (!text) return '';

  if (!text.startsWith('{') && !text.startsWith('[')) {
    const match = text.match(/(\{[\s\S]*\})/);
    if (match) text = match[1];
  }

  return text;
}

export function parseUSCISJSON(raw) {
  const text = sanitizeJSONInput(raw);
  if (!text) {
    throw new Error('Please paste your USCIS JSON first.');
  }

  let parsed;
  try {
    parsed = JSON.parse(text);
  } catch (error) {
    throw new Error(`Invalid JSON — ${error.message}`);
  }

  const data = normalizeCasePayload(parsed);

  if (!data.receiptNumber && !data.formType && !data.events?.length) {
    throw new Error('This does not look like USCIS case JSON. Expected receiptNumber, formType, or events.');
  }

  return analyzeCase(data);
}

function normalizeCasePayload(parsed) {
  if (Array.isArray(parsed)) {
    return parsed[0]?.data || parsed[0] || {};
  }

  if (parsed?.data && typeof parsed.data === 'object') {
    return parsed.data;
  }

  if (parsed?.case && typeof parsed.case === 'object') {
    return parsed.case;
  }

  return parsed;
}

export function analyzeCase(data) {
  const events = Array.isArray(data.events) ? data.events : [];
  const notices = Array.isArray(data.notices) ? data.notices : [];
  const codes = events.map((event) => event.eventCode).filter(Boolean);
  const submissionTs = data.submissionTimestamp || data.submissionDate;
  const updatedTs = data.updatedAtTimestamp || data.updatedAt;

  const isApproved = codes.some((code) => APPROVAL_CODES.has(code));
  const isDenied = codes.some((code) => DENIAL_CODES.has(code));
  const hasInterview = codes.some((code) => INTERVIEW_CODES.has(code));
  const hasBgChecks = codes.some((code) => BG_CODES.has(code));
  const hasRFE = codes.some((code) => ['FBA', 'FBB', 'IK', 'IKA'].includes(code));
  const hasDecision = isApproved || isDenied || codes.includes('LDA');
  const interviewWaived = hasDecision && !hasInterview;

  const submissionDate = parseGoogleDate(submissionTs);
  const updatedDate = parseGoogleDate(updatedTs);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const caseEnded = data.closed === true || isApproved || isDenied;
  const daysSinceFiling = submissionDate
    ? Math.round(
        ((caseEnded && updatedDate ? updatedDate : today) - submissionDate) /
          (1000 * 60 * 60 * 24)
      )
    : null;

  const timeline = buildTimeline(events, submissionTs, updatedTs);
  const stages = buildStages(codes, hasInterview, hasBgChecks, hasDecision, interviewWaived);
  const narrative = buildNarrative(data, {
    isApproved,
    isDenied,
    hasInterview,
    interviewWaived,
    hasRFE,
    hasBgChecks,
    daysSinceFiling,
  });

  const fta0Count = events.filter((event) => event.eventCode === 'FTA0').length;
  const silentUpdate = detectSilentUpdate(events, updatedTs);

  return {
    receiptNumber: data.receiptNumber || '',
    blockNumber: extractBlockPrefix(data.receiptNumber),
    formType: data.formType || 'I-485',
    formName: data.formName || '',
    applicantName: data.applicantName || '',
    submissionDate,
    updatedDate,
    daysSinceFiling,
    closed: data.closed === true,
    isApproved,
    isDenied,
    hasInterview,
    interviewWaived,
    hasBgChecks,
    hasRFE,
    hasDecision,
    actionRequired: Boolean(data.actionRequired),
    ackedByAdjudicator: Boolean(data.ackedByAdjudicatorAndCms),
    fta0Count,
    silentUpdate,
    events,
    notices,
    timeline,
    stages,
    narrative,
    latestEvent: events.length
      ? [...events].sort(
          (a, b) =>
            new Date(b.createdAtTimestamp || b.eventTimestamp) -
            new Date(a.createdAtTimestamp || a.eventTimestamp)
        )[0]
      : null,
  };
}

function extractBlockPrefix(receiptNumber) {
  if (!receiptNumber) return '';
  const match = String(receiptNumber).toUpperCase().match(/^([A-Z]{3}\d{5})/);
  return match ? match[1] : String(receiptNumber).slice(0, 8).toUpperCase();
}

function detectSilentUpdate(events, updatedTs) {
  if (!updatedTs || !events.length) return null;
  const updTime = new Date(updatedTs);
  if (Number.isNaN(updTime.getTime())) return null;

  const maxEvTime = events.reduce((max, event) => {
    const time = new Date(event.eventTimestamp || event.createdAtTimestamp);
    return !Number.isNaN(time.getTime()) && time > max ? time : max;
  }, new Date(0));

  return updTime > maxEvTime ? parseGoogleDate(updatedTs) : null;
}

function buildTimeline(events, submissionTs, updatedTs) {
  const items = events
    .filter((event) => event.eventCode)
    .map((event, index) => ({
      id: `${event.eventCode}-${event.eventId || event.createdAtTimestamp || index}`,
      type: 'event',
      sortTs: event.createdAtTimestamp || event.eventTimestamp,
      code: event.eventCode,
      info: getEventInfo(event.eventCode),
    }));

  if (submissionTs) {
    items.push({
      id: 'submission',
      type: 'submission',
      sortTs: submissionTs,
      code: 'SUBMIT',
      info: { name: 'Application Filed', desc: 'Submitted to USCIS.', cat: 'receipt' },
    });
  }

  if (detectSilentUpdate(events, updatedTs)) {
    items.push({
      id: 'silent',
      type: 'silent',
      sortTs: updatedTs,
      code: 'SILENT',
      info: {
        name: 'Silent Case Update',
        desc: 'Case updated without formal event code — officer touch or internal review.',
        cat: 'processing',
      },
    });
  }

  return items
    .filter((item) => item.sortTs)
    .sort((a, b) => new Date(b.sortTs) - new Date(a.sortTs));
}

function buildStages(codes, hasInterview, hasBgChecks, hasDecision, interviewWaived) {
  let stageIdx = 0;
  if (codes.some((code) => ['IAF', 'IAA', 'AALB'].includes(code))) stageIdx = 1;
  if (hasBgChecks) stageIdx = 2;
  if (hasInterview) stageIdx = 3;
  if (codes.includes('FTA1')) stageIdx = 4;
  if (interviewWaived || hasDecision) stageIdx = 5;

  if (interviewWaived) {
    return [
      { name: 'Filed', done: stageIdx >= 1 },
      { name: 'Receipt', done: stageIdx >= 1 },
      { name: 'Bg Checks', done: stageIdx >= 2 },
      { name: 'Interview Waived', done: true },
      { name: 'Decision', done: stageIdx >= 5 },
    ];
  }

  return [
    { name: 'Filed', done: stageIdx >= 1 },
    { name: 'Receipt', done: stageIdx >= 1 },
    { name: 'Bg Checks', done: stageIdx >= 2 },
    { name: 'Interview', done: stageIdx >= 3 },
    { name: 'Post-Interview', done: stageIdx >= 4 },
    { name: 'Decision', done: stageIdx >= 5 },
  ];
}

function buildNarrative(data, flags) {
  const name = data.applicantName || 'the applicant';
  const form = data.formType || 'I-485';

  if (flags.isApproved) {
    let text = `The ${form} for ${name} appears APPROVED based on USCIS event codes.`;
    if (flags.interviewWaived) text += ' Interview was waived — direct approval path.';
    if (flags.daysSinceFiling != null) text += ` Total timeline: ${flags.daysSinceFiling} days from filing.`;
    return text;
  }

  if (flags.isDenied) {
    return `The ${form} for ${name} shows denial event codes. Review notices and consult an immigration attorney.`;
  }

  if (flags.hasRFE) {
    return 'An RFE is on record. Respond before the deadline — community cases often pause until RFE replies are received.';
  }

  if (flags.hasInterview) {
    return 'Interview activity detected. Compare with community filers at the same field office.';
  }

  if (flags.hasBgChecks) {
    return 'Background checks recorded. Watch for silent updates and field office transfer next.';
  }

  return 'Case received and in early processing. Compare your block number and receipt month with community peers.';
}

export function getUSCISApiUrl(receiptNumber) {
  const cleaned = String(receiptNumber || '').trim().toUpperCase();
  return `https://my.uscis.gov/account/case-service/api/cases/${cleaned}`;
}
