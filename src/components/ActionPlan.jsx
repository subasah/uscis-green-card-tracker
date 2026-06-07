import { formatDate } from '../utils/dates';

const STAGE_LABELS = {
  early: 'Early stage',
  post_receipt: 'After I-485 receipt',
  post_biometric: 'After biometrics',
  post_transfer: 'After field office transfer',
  approved: 'Approved',
};

function PriorityBadge({ priority }) {
  const className = priority === 'high' ? 'priority-high' : priority === 'medium' ? 'priority-medium' : 'priority-low';
  return <span className={`priority-badge ${className}`}>{priority}</span>;
}

export default function ActionPlan({ guidance, estimate }) {
  if (!guidance && !estimate) return null;

  const stage = estimate?.latestStage || guidance?.stage || 'early';
  const stageLabel = STAGE_LABELS[stage] || 'In progress';
  const nextStep =
    estimate?.nextStep ||
    'Pick a community case with a receipt date to unlock stage-based guidance and approval estimates.';

  const metaItems = [
    estimate?.projectedApprovalDate
      ? `Estimated approval around ${formatDate(estimate.projectedApprovalDate)}`
      : null,
    estimate?.projectedRange
      ? `Typical range: ${formatDate(estimate.projectedRange.low)} – ${formatDate(estimate.projectedRange.high)} (${estimate.projectedRange.p25}–${estimate.projectedRange.p75} days from receipt)`
      : null,
    estimate?.medianTotalDays != null
      ? `Median receipt → approval: ${estimate.medianTotalDays} days (${estimate.sampleSize} similar cases)`
      : estimate?.sampleSize
        ? `${estimate.sampleSize} similar community cases compared`
        : null,
    guidance?.receiptSheet ? `Tracker tab: ${guidance.receiptSheet.name}` : null,
  ].filter(Boolean);

  const actions = guidance?.actions ?? [];

  return (
    <div className="guidance-stack">
      <div className="estimate-card highlight">
        <div className="action-plan-head">
          <h3>Recommended next steps</h3>
          <span className="tag action-plan-stage">{stageLabel}</span>
        </div>
        <p className="action-plan-summary">{nextStep}</p>
        {metaItems.length ? (
          <div className="estimate-meta">
            {metaItems.map((item) => (
              <span key={item}>{item}</span>
            ))}
          </div>
        ) : null}
      </div>

      {actions.length ? (
        <div className="detail-card action-plan-steps">
          <h3>Suggested actions</h3>
          <div className="action-list">
            {actions.map((action) => (
              <div key={action.title} className="action-item">
                <div className="action-head">
                  <strong>{action.title}</strong>
                  <PriorityBadge priority={action.priority} />
                </div>
                <p>{action.detail}</p>
              </div>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}

export function FinderGuidancePanel({ guidance }) {
  if (!guidance?.sheet && !guidance?.tips?.length) return null;

  return (
    <div className="finder-guidance">
      {guidance.sheet ? (
        <div className="guidance-banner">
          <strong>Receipt month tab: {guidance.sheet.name}</strong>
          <span>{guidance.monthCases} cases · {guidance.approved} approved</span>
        </div>
      ) : null}
      {guidance.tips.map((tip) => (
        <p key={tip} className="tip-item">{tip}</p>
      ))}
    </div>
  );
}
