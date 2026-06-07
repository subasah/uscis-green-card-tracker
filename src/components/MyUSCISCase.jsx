import { useMemo, useState } from 'react';
import ActionPlan from './ActionPlan';
import CaseDetailDrawer from './CaseDetailDrawer';
import JsonFetchGuide from './JsonFetchGuide';
import Timeline from './Timeline';
import VisitorMap from './VisitorMap';
import { CAT_STYLE } from '../data/eventCodes';
import { bridgePersonalAndCommunity } from '../utils/caseBridge';
import { formatDate } from '../utils/dates';
import { parseUSCISJSON } from '../utils/uscisParser';

export default function MyUSCISCase({
  communityCases,
  agents,
  onSelectCommunityCase,
  onGoToFinder,
  theme = 'dark',
  selectedCommunityId,
  communityCaseDetail,
}) {
  const [jsonInput, setJsonInput] = useState('');
  const [receiptInput, setReceiptInput] = useState('');
  const [error, setError] = useState('');
  const [personalCase, setPersonalCase] = useState(null);

  const bridge = useMemo(() => {
    if (!personalCase) return null;
    try {
      return bridgePersonalAndCommunity(personalCase, communityCases, agents);
    } catch {
      return null;
    }
  }, [personalCase, communityCases, agents]);

  const runAnalyze = (input = jsonInput) => {
    setError('');
    try {
      const result = parseUSCISJSON(input);
      setPersonalCase(result);
      if (result.receiptNumber && !receiptInput) {
        setReceiptInput(result.receiptNumber);
      }
      requestAnimationFrame(() => {
        document.getElementById('case-results')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      });
    } catch (err) {
      setError(err.message);
      setPersonalCase(null);
    }
  };

  const handleFile = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (loadEvent) => {
      const text = String(loadEvent.target?.result || '');
      setJsonInput(text);
      runAnalyze(text);
    };
    reader.readAsText(file);
  };

  const stageTimeline = personalCase
    ? personalCase.stages.map((stage) => ({
        id: stage.name,
        label: stage.name,
        value: stage.done ? 'Complete' : 'Pending',
        state: stage.done ? 'done' : 'future',
      }))
    : [];

  const eventTimeline = personalCase
    ? [...personalCase.timeline].reverse().map((item) => {
        const style = CAT_STYLE[item.info.cat] || CAT_STYLE.default;
        return {
          id: item.id,
          label: item.info.name,
          value: formatDate(item.sortTs),
          hint: item.code,
          state: 'done',
          color: style.color,
        };
      })
    : [];

  return (
    <div className="my-case-stack">
      <section className="panel case-workspace-panel">
        <div className="case-hero case-hero-compact">
          <h2>My USCIS case</h2>
          <div className="case-hero-actions">
            <button type="button" className="toolbar-button" onClick={onGoToFinder}>
              Search community
            </button>
          </div>
        </div>

        <form
          className="case-workspace"
          onSubmit={(event) => {
            event.preventDefault();
            runAnalyze();
          }}
        >
          <div className="case-editor-shell">
            <div className="case-editor-toolbar">
              <span className="case-editor-label">USCIS JSON workspace</span>
              <span className="case-editor-meta">{jsonInput.length ? `${jsonInput.length.toLocaleString()} chars` : 'Waiting for paste'}</span>
            </div>
            <textarea
              id="json-input"
              className="case-editor-input"
              rows={11}
              spellCheck={false}
              placeholder={`{\n  "receiptNumber": "IOE09...",\n  "formType": "I-485",\n  "events": [ ... ]\n}`}
              value={jsonInput}
              onChange={(event) => setJsonInput(event.target.value)}
            />
          </div>

          <div className="case-workspace-actions">
            <label className="case-file-button">
              <input type="file" accept=".json,.txt,application/json" onChange={handleFile} />
              Upload .json
            </label>
            <button type="submit" className="case-analyze-button">
              Analyze case
            </button>
          </div>

          {error ? <p className="case-error-banner">{error}</p> : null}
        </form>

        <JsonFetchGuide receiptInput={receiptInput} onReceiptChange={setReceiptInput} />
      </section>

      {personalCase ? (
        <div id="case-results" className="case-results-stack">
          <section className="panel case-results-panel">
            <div className="case-results-hero">
              <div>
                <p className="case-hero-eyebrow">Analysis ready</p>
                <h2>{personalCase.receiptNumber}</h2>
                <p>
                  {personalCase.formType} · {personalCase.applicantName || 'Applicant'} · Block{' '}
                  {personalCase.blockNumber || '—'}
                </p>
              </div>
              <div className="stat-pills">
                <span className="tag">{personalCase.daysSinceFiling ?? '—'} days since filing</span>
                <span className="tag">{personalCase.events.length} events</span>
                {personalCase.fta0Count ? <span className="tag">{personalCase.fta0Count}× FTA0</span> : null}
                {personalCase.interviewWaived ? <span className="tag">Interview waived</span> : null}
                {personalCase.isApproved ? <span className="tag tag-approved">Approved</span> : null}
              </div>
            </div>

            <p className="narrative-box">{personalCase.narrative}</p>

            <div className="detail-card">
              <Timeline title="Case progress" items={stageTimeline} bare />
            </div>

            <div className="detail-grid">
              <div className="detail-card">
                <h3>Application info</h3>
                <dl className="detail-list">
                  <div><dt>Receipt</dt><dd>{personalCase.receiptNumber}</dd></div>
                  <div><dt>Block #</dt><dd>{personalCase.blockNumber || '—'}</dd></div>
                  <div><dt>Filed</dt><dd>{formatDate(personalCase.submissionDate)}</dd></div>
                  <div><dt>Last updated</dt><dd>{formatDate(personalCase.updatedDate)}</dd></div>
                  <div><dt>Adjudicator ack</dt><dd>{personalCase.ackedByAdjudicator ? 'Yes' : 'No'}</dd></div>
                  <div><dt>Action required</dt><dd>{personalCase.actionRequired ? 'Yes' : 'No'}</dd></div>
                </dl>
              </div>

              <div className="detail-card">
                <h3>Flags</h3>
                <dl className="detail-list">
                  <div><dt>Background checks</dt><dd>{personalCase.hasBgChecks ? 'Yes' : 'No'}</dd></div>
                  <div><dt>Interview</dt><dd>{personalCase.hasInterview ? 'Yes' : personalCase.interviewWaived ? 'Waived' : 'No'}</dd></div>
                  <div><dt>RFE</dt><dd>{personalCase.hasRFE ? 'Yes' : 'No'}</dd></div>
                  <div><dt>Silent update</dt><dd>{personalCase.silentUpdate ? formatDate(personalCase.silentUpdate) : 'None detected'}</dd></div>
                  <div><dt>Case status</dt><dd>{personalCase.closed ? 'Closed' : 'Open'}</dd></div>
                </dl>
              </div>
            </div>

            <div className="detail-card">
              <Timeline title="USCIS event timeline" items={eventTimeline} bare />
            </div>

            {bridge?.similarCases.length ? (
              <div className="detail-card">
                <h3>Community peers to compare</h3>
                <div className="similar-list">
                  {bridge.similarCases.map((record) => (
                    <button
                      key={record.id}
                      type="button"
                      className={`similar-item${record.id === selectedCommunityId ? ' selected' : ''}`}
                      onClick={() => onSelectCommunityCase(record)}
                      aria-expanded={record.id === selectedCommunityId}
                    >
                      <span>{record.blockNumber || record.category} · {record.sheetName}</span>
                      <span>RD {formatDate(record.receiptDate)} → {formatDate(record.gcApprovalDate) || 'Pending'}</span>
                    </button>
                  ))}
                </div>
              </div>
            ) : bridge ? (
              <div className="detail-card">
                <h3>Community peers to compare</h3>
                <p className="muted-copy">No community entries for this block yet. Try Find in community with your receipt date.</p>
              </div>
            ) : null}
          </section>

          {bridge ? (
            <section className="panel combined-panel">
              <div className="panel-header">
                <div>
                  <h2>Community comparison</h2>
                  <p>
                    Block <strong>{personalCase.blockNumber}</strong>
                    {bridge.receiptSheet ? ` · ${bridge.receiptSheet.name} tab` : ''}
                    {' · '}
                    {bridge.matchedByBlock.length} block matches · {bridge.matchedByReceiptMonth.length} receipt-month peers
                  </p>
                </div>
              </div>

              {bridge.communitySignals.length ? (
                <div className="signals-grid">
                  {bridge.communitySignals.map((signal) => (
                    <div key={signal.title} className="signal-card">
                      <strong>{signal.title}</strong>
                      <p>{signal.detail}</p>
                    </div>
                  ))}
                </div>
              ) : null}

              <ActionPlan guidance={bridge.guidance} estimate={bridge.estimate} />
            </section>
          ) : null}
        </div>
      ) : (
        <section className="panel case-empty-state">
          <h3>Your timeline appears here</h3>
          <p>Paste USCIS JSON above to unlock progress stages, event history, and community comparisons.</p>
        </section>
      )}

      <VisitorMap theme={theme} />

      <CaseDetailDrawer
        open={Boolean(selectedCommunityId && communityCaseDetail)}
        caseDetail={communityCaseDetail}
        onClose={communityCaseDetail?.onClose}
      />
    </div>
  );
}
