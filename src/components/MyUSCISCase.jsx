import { useMemo, useState } from 'react';
import ActionPlan from './ActionPlan';
import Timeline from './Timeline';
import { CAT_STYLE } from '../data/eventCodes';
import { bridgePersonalAndCommunity } from '../utils/caseBridge';
import { formatDate } from '../utils/dates';
import { getUSCISApiUrl, parseUSCISJSON } from '../utils/uscisParser';

export default function MyUSCISCase({
  communityCases,
  agents,
  onSelectCommunityCase,
  onGoToFinder,
  onGoToTutorial,
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

  const apiUrl = receiptInput ? getUSCISApiUrl(receiptInput) : '';

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
      <section className="panel">
        <div className="panel-header">
          <div>
            <h2>My USCIS case</h2>
            <p>Paste your USCIS JSON below to see your timeline and compare with community block data.</p>
          </div>
          <button type="button" className="text-link-button" onClick={onGoToTutorial}>
            Need help? View tutorial
          </button>
        </div>

        <div className="quick-actions">
          <button type="button" className="quick-action" onClick={() => document.getElementById('json-input')?.focus()}>
            Paste USCIS JSON
          </button>
          <button type="button" className="quick-action" onClick={onGoToFinder}>
            Search community tracker
          </button>
        </div>

        <form
          className="uscis-input-grid"
          onSubmit={(event) => {
            event.preventDefault();
            runAnalyze();
          }}
        >
          <label className="json-field">
            <span>USCIS API JSON</span>
            <textarea
              id="json-input"
              rows={8}
              placeholder='Paste JSON from my.uscis.gov/account/case-service/api/cases/IOE09...'
              value={jsonInput}
              onChange={(event) => setJsonInput(event.target.value)}
            />
          </label>

          <div className="uscis-side-panel">
            <label>
              Receipt number
              <input
                type="text"
                placeholder="IOE0912345678"
                value={receiptInput}
                onChange={(event) => setReceiptInput(event.target.value.toUpperCase())}
              />
            </label>
            {apiUrl ? (
              <a className="api-link-button" href={apiUrl} target="_blank" rel="noreferrer">
                Open USCIS API (sign in first)
              </a>
            ) : null}

            <label className="file-upload">
              <span>Upload .json file</span>
              <input type="file" accept=".json,.txt,application/json" onChange={handleFile} />
            </label>

            <button type="submit" className="refresh-button">
              Analyze case
            </button>
            {error ? <p className="error-text">{error}</p> : null}
          </div>
        </form>
      </section>

      {personalCase ? (
        <div id="case-results">
          <section className="panel">
            <div className="panel-header">
              <div>
                <h2>Your case · {personalCase.receiptNumber}</h2>
                <p>{personalCase.formType} · {personalCase.applicantName || 'Applicant'} · Block {personalCase.blockNumber || '—'}</p>
              </div>
              <div className="stat-pills">
                <span className="tag">{personalCase.daysSinceFiling ?? '—'} days since filing</span>
                <span className="tag">{personalCase.events.length} USCIS events</span>
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
                      className="similar-item"
                      onClick={() => onSelectCommunityCase(record)}
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

              <ActionPlan
                guidance={bridge.guidance}
                estimate={bridge.estimate}
                showResources={false}
              />
            </section>
          ) : null}

          {bridge?.guidance.externalResources?.length ? (
            <section className="panel">
              <div className="detail-card">
                <h3>Helpful resources</h3>
                <div className="resource-links">
                  {bridge.guidance.externalResources.map((resource) => (
                    <a key={resource.url} href={resource.url} target="_blank" rel="noreferrer">{resource.label}</a>
                  ))}
                </div>
              </div>
            </section>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
