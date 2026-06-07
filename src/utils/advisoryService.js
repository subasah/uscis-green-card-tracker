import { CASE_SHEETS, EMMA_URL, EXTERNAL_RESOURCES, formatReceiptMonthLabel, recommendSheetForReceiptDate } from '../config';
import { formatDate } from './dates';

const AGENT_QUESTIONS = {
  post_receipt: [
    'Has my biometrics appointment been scheduled? It may appear under Documents before online status changes.',
    'Which lockbox received my I-485, and is my case still at NBC?',
  ],
  post_biometric: [
    'Has my interview been waived?',
    'Is my case at NBC or has it transferred to a field office? If transferred, which field office?',
    'Is my case undergoing background checks prior to a final decision?',
  ],
  post_transfer: [
    'Which field office is processing my case (local or non-local)?',
    'Has my interview been waived after transfer?',
    'What is the current internal processing stage of my I-485?',
  ],
  approved: [
    'Has my green card been mailed? What is the expected delivery timeline?',
  ],
  early: [
    'Has USCIS received my I-485 package and assigned a receipt number?',
  ],
};

const USCIS_ACTIONS = {
  post_receipt: [
    {
      title: 'Check Documents tab in myUSCIS',
      detail: 'Biometrics appointments can appear under Documents before the case status changes.',
      priority: 'high',
    },
    {
      title: 'Find your receipt-month tab in the tracker',
      detail: 'Use the spreadsheet tab matching your I-485 receipt date to compare block # progress with peers.',
      priority: 'high',
    },
    {
      title: 'Track your block number',
      detail: 'Watch which block numbers in your receipt month are getting biometrics and approvals.',
      priority: 'medium',
    },
  ],
  post_biometric: [
    {
      title: 'Monitor silent updates & FTA0',
      detail: 'After biometrics, cases often show silent updates or FTA0 changes before approval. A 3rd FTA0 does not always mean approval within 24 hours.',
      priority: 'high',
    },
    {
      title: 'Ask Emma about interview waiver',
      detail: 'Helpful agents can confirm if your interview is waived. If one agent gives a template answer, try another agent.',
      priority: 'high',
    },
    {
      title: 'Compare similar cases in your receipt month',
      detail: 'Filter by your receipt month tab and category to see median time from biometrics to approval.',
      priority: 'medium',
    },
  ],
  post_transfer: [
    {
      title: 'Confirm field office with Emma',
      detail: 'After NBC transfer, ask Emma which field office has your case and whether it is local or non-local.',
      priority: 'high',
    },
    {
      title: 'Do not assume 3rd FTA0 = next-day approval',
      detail: 'FO transfers can trigger FTA0 without immediate approval.',
      priority: 'high',
    },
    {
      title: 'Watch for interview notice',
      detail: 'Monitor for interview scheduling if waiver was removed or never granted.',
      priority: 'medium',
    },
  ],
  approved: [
    {
      title: 'Track GC card delivery',
      detail: 'After approval, monitor mail for the physical green card.',
      priority: 'high',
    },
  ],
  early: [
    {
      title: 'Confirm receipt in myUSCIS',
      detail: 'Ensure your case appears online with the correct receipt date before comparing to tracker data.',
      priority: 'high',
    },
  ],
};

export function buildCaseGuidance({ target, similarCases, agents, estimate, blockProgress }) {
  const stage = estimate?.latestStage ?? 'early';

  const helpfulAgents = agents
    .filter((agent) => agent.helpful)
    .slice(0, 8);

  const uselessCount = agents.filter((agent) => agent.rating.toLowerCase() === 'useless').length;
  const helpfulRate = agents.length
    ? Math.round((helpfulAgents.length / agents.length) * 100)
    : null;

  const emmaTips = [
    'If Emma gives a template answer, start a new chat and try a different agent.',
    `${helpfulRate ?? 70}% of logged chats were rated helpful — ask specific yes/no questions.`,
    'Ask one focused question at a time before the agent closes the session.',
  ];

  const recommendedQuestions = AGENT_QUESTIONS[stage] ?? AGENT_QUESTIONS.early;
  const actions = [...(USCIS_ACTIONS[stage] ?? USCIS_ACTIONS.early)];

  if (target?.countryOfConcern && /75|39|coc/i.test(target.countryOfConcern)) {
    actions.push({
      title: 'Country-of-chargeability review may add time',
      detail: 'Cases with country-of-concern codes sometimes show longer post-biometric waits.',
      priority: 'medium',
    });
  }

  if (blockProgress?.pending && blockProgress.approved > 0) {
    actions.unshift({
      title: `Block ${target.blockNumber}: ${blockProgress.approved}/${blockProgress.total} approved in tracker`,
      detail: blockProgress.latestApproval
        ? `Latest approval in this block was ${formatDate(blockProgress.latestApproval)}.`
        : 'Some cases on your block have approved.',
      priority: 'high',
    });
  }

  const receiptSheet = target?.receiptDate ? recommendSheetForReceiptDate(target.receiptDate) : null;

  return {
    stage,
    actions,
    recommendedQuestions,
    emmaTips,
    emmaUrl: EMMA_URL,
    helpfulAgents,
    agentStats: {
      total: agents.length,
      helpful: helpfulAgents.length,
      useless: uselessCount,
      helpfulRate,
    },
    receiptSheet,
    externalResources: EXTERNAL_RESOURCES,
    receiptMonthLabel: target?.receiptDate
      ? formatReceiptMonthLabel(recommendSheetForReceiptDate(target.receiptDate)?.receiptMonth)
      : null,
  };
}

export function buildFinderGuidance({ receiptDate, receiptMonth, cases }) {
  const sheet = receiptMonth && receiptMonth !== 'all'
    ? CASE_SHEETS.find((item) => item.receiptMonth === receiptMonth) ?? null
    : receiptDate
      ? recommendSheetForReceiptDate(receiptDate)
      : null;

  const monthCases = sheet
    ? cases.filter((record) => record.receiptMonth === sheet.receiptMonth)
    : [];

  const approved = monthCases.filter((record) => record.status === 'approved');
  const bioToApproval = approved
    .map((record) => {
      if (!record.biometricDate || !record.gcApprovalDate) return null;
      return Math.round((record.gcApprovalDate - record.biometricDate) / (1000 * 60 * 60 * 24));
    })
    .filter((value) => value != null && value >= 0);

  const medianBio = bioToApproval.length
    ? bioToApproval.sort((a, b) => a - b)[Math.floor(bioToApproval.length / 2)]
    : null;

  const tips = [];
  if (sheet) {
    tips.push(`"${sheet.name}" tab — ${monthCases.length} cases in current results.`);
  } else if (receiptDate) {
    tips.push('No exact receipt-month tab found — try searching by block number.');
  }

  if (medianBio != null) {
    tips.push(`Median ${medianBio} days from biometrics to approval in ${sheet?.name ?? 'this month'}.`);
  }

  return { sheet, monthCases: monthCases.length, approved: approved.length, medianBio, tips };
}
