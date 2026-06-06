import { recommendSheetForReceiptDate, receiptMonthKey } from '../config';
import { buildCaseGuidance } from './advisoryService';
import { estimateForCase, findSimilarCases, getBlockProgress } from './dataService';
import { formatDate } from './dates';

export function bridgePersonalAndCommunity(personalCase, communityCases, agents) {
  if (!personalCase) return null;

  const blockNumber = personalCase.blockNumber;
  const receiptDate = personalCase.submissionDate;

  const matchedByBlock = communityCases.filter(
    (record) => blockNumber && record.blockNumber === blockNumber
  );

  const matchedByReceiptMonth = receiptDate
    ? communityCases.filter(
        (record) =>
          record.receiptMonth === receiptMonthKey(receiptDate) ||
          (record.receiptDate &&
            Math.abs(record.receiptDate - receiptDate) < 21 * 24 * 60 * 60 * 1000)
      )
    : [];

  const syntheticRecord = {
    id: 'personal-bridge',
    blockNumber,
    receiptDate,
    priorityDate: null,
    biometricDate: findEventDate(personalCase, 'FNB'),
    gcApprovalDate: personalCase.isApproved ? personalCase.updatedDate : null,
    category: '',
    fieldOffice: '',
    sheetName: recommendSheetForReceiptDate(receiptDate)?.name ?? 'Unknown',
    receiptMonth: receiptMonthKey(receiptDate),
    status: personalCase.isApproved ? 'approved' : personalCase.hasBgChecks ? 'in_progress' : 'submitted',
    interview: personalCase.interviewWaived ? 'Waived' : personalCase.hasInterview ? 'Scheduled/Done' : 'Unknown',
    silentUpdates: personalCase.silentUpdate ? formatDate(personalCase.silentUpdate) : '',
    fta0Updates: personalCase.fta0Count ? `${personalCase.fta0Count}x FTA0 in your USCIS JSON` : '',
    comments: personalCase.narrative,
  };

  const similarCases = findSimilarCases(communityCases, syntheticRecord);
  const pool = matchedByBlock.length ? matchedByBlock : matchedByReceiptMonth.length ? matchedByReceiptMonth : similarCases;
  const estimate = estimateForCase(syntheticRecord, pool.length ? pool : similarCases);
  const blockProgress = blockNumber ? getBlockProgress(communityCases, blockNumber) : null;
  const guidance = buildCaseGuidance({
    target: syntheticRecord,
    similarCases: pool.length ? pool : similarCases,
    agents,
    estimate,
    blockProgress,
  });

  const communitySignals = buildCommunitySignals(personalCase, pool, blockProgress);

  return {
    syntheticRecord,
    matchedByBlock,
    matchedByReceiptMonth,
    similarCases: pool.slice(0, 8),
    estimate,
    guidance,
    blockProgress,
    communitySignals,
    receiptSheet: recommendSheetForReceiptDate(receiptDate),
  };
}

function findEventDate(personalCase, code) {
  const event = personalCase.events?.find((item) => item.eventCode === code);
  if (!event) return null;
  return new Date(event.createdAtTimestamp || event.eventTimestamp);
}

function buildCommunitySignals(personalCase, peers, blockProgress) {
  const signals = [];

  if (blockProgress) {
    signals.push({
      type: 'block',
      title: `Block ${personalCase.blockNumber}`,
      detail: `${blockProgress.approved} of ${blockProgress.total} tracker entries on this block have GC approval${blockProgress.latestApproval ? ` (latest ${formatDate(blockProgress.latestApproval)})` : ''}.`,
    });
  }

  if (personalCase.fta0Count >= 2) {
    const approvedWithFta0 = peers.filter(
      (record) => record.status === 'approved' && /fta0|FTA0/i.test(record.silentUpdates || record.fta0Updates || record.comments)
    );
    signals.push({
      type: 'fta0',
      title: `${personalCase.fta0Count} FTA0 events in your case`,
      detail: approvedWithFta0.length
        ? `${approvedWithFta0.length} similar community cases with FTA0 activity have approved. Community notes: 3rd FTA0 does not always mean approval within 24 hours.`
        : 'Community discussions note multiple FTA0s often precede approval or FO transfer — not always same-day approval.',
    });
  }

  if (personalCase.silentUpdate) {
    signals.push({
      type: 'silent',
      title: 'Silent update detected in your JSON',
      detail: 'Community filers report silent updates often coincide with FO transfers or officer review. Ask Emma which field office has your case.',
    });
  }

  if (personalCase.interviewWaived) {
    signals.push({
      type: 'interview',
      title: 'Interview appears waived',
      detail: 'Your USCIS events show approval path without interview codes. Community agents confirm waiver via Emma when helpful.',
    });
  }

  const approvedPeers = peers.filter((record) => record.status === 'approved');
  if (approvedPeers.length >= 2 && personalCase.submissionDate) {
    const durations = approvedPeers
      .map((record) => {
        if (!record.receiptDate || !record.gcApprovalDate) return null;
        return Math.round((record.gcApprovalDate - record.receiptDate) / (1000 * 60 * 60 * 24));
      })
      .filter((value) => value != null && value >= 0);

    if (durations.length) {
      durations.sort((a, b) => a - b);
      const median = durations[Math.floor(durations.length / 2)];
      signals.push({
        type: 'timing',
        title: 'Community approval timing',
        detail: `${approvedPeers.length} peers in your block/month approved in a median of ${median} days from receipt.`,
      });
    }
  }

  return signals;
}
