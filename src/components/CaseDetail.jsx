import ActionPlan from './ActionPlan';
import Timeline from './Timeline';
import { formatDate, parseSilentUpdates, statusLabel } from '../utils/dates';
import { formatReceiptMonthLabel } from '../config';

const STEPS = [
  { key: 'priorityDate', label: 'Priority Date', field: 'priorityDate' },
  { key: 'receiptDate', label: 'I-485 Receipt', field: 'receiptDate' },
  { key: 'biometricDate', label: 'Biometrics', field: 'biometricDate' },
  { key: 'eadApprovalDate', label: 'EAD Approval', field: 'eadApprovalDate', text: true },
  { key: 'transferDate', label: 'FO Transfer', field: 'transferDate' },
  { key: 'gcApprovalDate', label: 'GC Approval', field: 'gcApprovalDate' },
  { key: 'gcReceivedDate', label: 'GC Received', field: 'gcReceivedDate', text: true },
];

function stepState(record, step) {
  if (step.text) {
    const value = record[step.field];
    if (!value || value.toLowerCase() === 'pending') return 'pending';
    if (['not yet', 'n/a', 'none'].includes(String(value).toLowerCase())) return 'future';
    return 'done';
  }

  const date = record[step.field];
  if (date instanceof Date) return 'done';
  return 'future';
}

export default function CaseDetail({
  record,
  estimate,
  guidance,
  blockProgress,
  similarCases,
  onSelectCase,
  onClose,
  embedded = false,
  drawer = false,
}) {
  if (!record) return null;

  const silentEvents = parseSilentUpdates(record.silentUpdates);

  const timelineItems = STEPS.map((step) => ({
    id: step.key,
    label: step.label,
    value: step.text ? record[step.field] || '—' : formatDate(record[step.field]),
    state: stepState(record, step),
  }));

  const content = (
    <>
      {embedded && !drawer ? (
        <div className="case-detail-embedded-header">
          <div>
            <span className="case-detail-embedded-label">Case details</span>
            <strong>{record.blockNumber || record.category || 'Selected case'}</strong>
            <span className="case-detail-embedded-meta">
              {record.category || 'Unknown category'} · {record.fieldOffice || 'Field office unknown'}
              {record.receiptMonth ? ` · ${formatReceiptMonthLabel(record.receiptMonth)} tab` : ''}
            </span>
          </div>
          <div className="panel-header-actions">
            <span className={`badge badge-${record.status}`}>{statusLabel(record.status)}</span>
            {onClose ? (
              <button type="button" className="toolbar-button detail-close" onClick={onClose}>
                Hide
              </button>
            ) : null}
          </div>
        </div>
      ) : !embedded ? (
        <div className="panel-header">
          <div>
            <h2>{record.blockNumber || 'Case details'}</h2>
            <p>
              {record.category || 'Unknown category'} · {record.fieldOffice || 'Field office unknown'}
              {record.receiptMonth ? ` · ${formatReceiptMonthLabel(record.receiptMonth)} filers tab` : ''}
            </p>
          </div>
          <div className="panel-header-actions">
            <span className={`badge badge-${record.status}`}>{statusLabel(record.status)}</span>
            {onClose ? (
              <button type="button" className="toolbar-button detail-close" onClick={onClose}>
                Close
              </button>
            ) : null}
          </div>
        </div>
      ) : null}

      {drawer ? (
        <div className="case-detail-drawer-intro">
          <span className={`badge badge-${record.status}`}>{statusLabel(record.status)}</span>
          <p>
            {record.category || 'Unknown category'} · {record.fieldOffice || 'Field office unknown'}
            {record.receiptMonth ? ` · ${formatReceiptMonthLabel(record.receiptMonth)} tab` : ''}
          </p>
        </div>
      ) : null}

      {blockProgress ? (
        <div className="guidance-banner">
          <strong>Block {record.blockNumber} progress</strong>
          <span>
            {blockProgress.approved}/{blockProgress.total} approved in tracker
            {blockProgress.latestApproval ? ` · latest ${formatDate(blockProgress.latestApproval)}` : ''}
          </span>
        </div>
      ) : null}

      <ActionPlan guidance={guidance} estimate={estimate} />

      <div className="detail-grid">
        <div className="detail-card">
          <h3>Key dates</h3>
          <dl className="detail-list">
            <div><dt>Priority date</dt><dd>{formatDate(record.priorityDate)}</dd></div>
            <div><dt>I-485 receipt</dt><dd>{formatDate(record.receiptDate)}</dd></div>
            <div><dt>Notice (I-797)</dt><dd>{formatDate(record.noticeDate)}</dd></div>
            <div><dt>Biometrics</dt><dd>{formatDate(record.biometricDate)}</dd></div>
            <div><dt>EAD approval</dt><dd>{record.eadApprovalDate || '—'}</dd></div>
            <div><dt>GC approval</dt><dd>{formatDate(record.gcApprovalDate)}</dd></div>
            <div><dt>GC received</dt><dd>{record.gcReceivedDate || '—'}</dd></div>
          </dl>
        </div>

        <div className="detail-card">
          <h3>Case info</h3>
          <dl className="detail-list">
            <div><dt>Block / receipt</dt><dd>{record.blockNumber || record.receiptNumbers.join(', ') || '—'}</dd></div>
            <div><dt>Lockbox</dt><dd>{record.lockbox || '—'}</dd></div>
            <div><dt>Field office</dt><dd>{record.fieldOffice || '—'}</dd></div>
            <div><dt>Interview</dt><dd>{record.interview || '—'}</dd></div>
            <div><dt>Country of concern</dt><dd>{record.countryOfConcern || '—'}</dd></div>
            <div><dt>Receipt month tab</dt><dd>{record.sheetName}</dd></div>
          </dl>
        </div>
      </div>

      <div className="detail-card">
        <Timeline title="Processing timeline" items={timelineItems} bare />
      </div>

      {silentEvents.length || record.fta0Updates ? (
        <div className="detail-card">
          <h3>Activity signals</h3>
          {silentEvents.length ? (
            <>
              <p className="subheading">Silent updates</p>
              <div className="tag-row">
                {silentEvents.map((event) => (
                  <span key={event.label} className="tag">{formatDate(event.date)}</span>
                ))}
              </div>
            </>
          ) : null}
          {record.silentUpdates ? <p className="muted-copy">{record.silentUpdates}</p> : null}
          {record.fta0Updates ? (
            <>
              <p className="subheading">FTA0 updates</p>
              <p className="muted-copy">{record.fta0Updates}</p>
            </>
          ) : null}
        </div>
      ) : null}

      {record.comments ? (
        <div className="detail-card">
          <h3>Community comments</h3>
          <p className="comment-copy">{record.comments}</p>
        </div>
      ) : null}

      {similarCases.length ? (
        <div className="detail-card">
          <h3>Similar cases ({estimate?.sameMonthSample ?? 0} from same receipt month)</h3>
          <div className="similar-list">
            {similarCases.map((item) => (
              <button key={item.id} type="button" className="similar-item" onClick={() => onSelectCase(item)}>
                <span>{item.blockNumber || item.category} · {item.sheetName}</span>
                <span>{formatDate(item.priorityDate)} → {formatDate(item.gcApprovalDate) || 'Pending'}</span>
              </button>
            ))}
          </div>
        </div>
      ) : null}
    </>
  );

  if (embedded) {
    return <div className="case-detail-embedded">{content}</div>;
  }

  return <section className="panel detail-panel">{content}</section>;
}
