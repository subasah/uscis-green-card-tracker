import { formatDate } from '../utils/dates';

function PriorityBadge({ priority }) {
  const className = priority === 'high' ? 'priority-high' : priority === 'medium' ? 'priority-medium' : 'priority-low';
  return <span className={`priority-badge ${className}`}>{priority}</span>;
}

export default function ActionPlan({ guidance, estimate, showResources = true }) {
  if (!guidance) return null;

  return (
    <div className="guidance-stack">
      <div className="estimate-card highlight">
        <h3>Recommended next steps</h3>
        <p>{estimate?.nextStep}</p>
        <div className="estimate-meta">
          {estimate?.projectedApprovalDate ? (
            <span>Estimated approval around {formatDate(estimate.projectedApprovalDate)}</span>
          ) : null}
          {estimate?.projectedRange ? (
            <span>
              Typical range for similar cases: {formatDate(estimate.projectedRange.low)} – {formatDate(estimate.projectedRange.high)}
              {' '}({estimate.projectedRange.p25}–{estimate.projectedRange.p75} days from receipt)
            </span>
          ) : null}
          {estimate?.medianTotalDays != null ? (
            <span>Median receipt → approval: {estimate.medianTotalDays} days ({estimate.sampleSize} similar cases)</span>
          ) : null}
          {guidance.receiptSheet ? (
            <span>Use tracker tab: <strong>{guidance.receiptSheet.name}</strong></span>
          ) : null}
        </div>
      </div>

      <div className="detail-grid">
        <div className="detail-card">
          <h3>USCIS actions you can take</h3>
          <div className="action-list">
            {guidance.actions.map((action) => (
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

        <div className="detail-card">
          <h3>Ask Emma (live agent)</h3>
          <p className="muted-copy">
            {guidance.agentStats.helpfulRate}% of logged chats were helpful ({guidance.agentStats.helpful}/{guidance.agentStats.total}).
            {' '}<a href={guidance.emmaUrl} target="_blank" rel="noreferrer">Open Emma chat</a>
          </p>
          <ul className="question-list">
            {guidance.recommendedQuestions.map((question) => (
              <li key={question}>{question}</li>
            ))}
          </ul>
          <div className="tip-list">
            {guidance.emmaTips.map((tip) => (
              <p key={tip} className="tip-item">{tip}</p>
            ))}
          </div>
          {guidance.helpfulAgents.length ? (
            <>
              <h4 className="subheading">Agents rated helpful recently</h4>
              <div className="agent-list">
                {guidance.helpfulAgents.slice(0, 5).map((agent) => (
                  <div key={agent.id} className="agent-card">
                    <strong>{agent.name}</strong>
                    <span>{agent.agentId || 'No ID logged'}</span>
                    <p>{agent.comment.slice(0, 140)}{agent.comment.length > 140 ? '…' : ''}</p>
                  </div>
                ))}
              </div>
            </>
          ) : null}
        </div>
      </div>

      {showResources ? (
        <div className="detail-card">
          <h3>Helpful resources</h3>
          <div className="resource-links">
            {guidance.externalResources.map((resource) => (
              <a key={resource.url} href={resource.url} target="_blank" rel="noreferrer">{resource.label}</a>
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
