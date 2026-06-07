import { useState } from 'react';
import { getUSCISApiUrl } from '../utils/uscisParser';

const STEPS = [
  {
    title: 'Sign in to USCIS',
    body: (
      <>
        Open{' '}
        <a href="https://myaccount.uscis.gov/sign-in" target="_blank" rel="noreferrer">
          myaccount.uscis.gov
        </a>{' '}
        in another tab and stay logged in.
      </>
    ),
  },
  {
    title: 'Open your case JSON',
    body: 'Enter your receipt number and launch the official USCIS API in a new tab.',
    hasReceipt: true,
  },
  {
    title: 'Copy the response',
    body: 'In the new tab: Select all (Ctrl+A / Cmd+A), then copy (Ctrl+C / Cmd+C).',
  },
  {
    title: 'Paste & analyze',
    body: 'Paste into the workspace above and click Analyze case. Everything stays in your browser.',
  },
];

export default function JsonFetchGuide({ receiptInput, onReceiptChange }) {
  const [showManual, setShowManual] = useState(false);
  const apiUrl = receiptInput ? getUSCISApiUrl(receiptInput) : '';
  const exampleUrl = 'https://my.uscis.gov/account/case-service/api/cases/IOE09XXXXXXXX';

  return (
    <div className="case-guide">
      <div className="case-guide-header">
        <div>
          <h3>Get your USCIS JSON</h3>
          <p>Four quick steps — no account data leaves your device.</p>
        </div>
        <span className="case-privacy-badge">Local-only analysis</span>
      </div>

      <ol className="case-step-track">
        {STEPS.map((step, index) => (
          <li key={step.title} className="case-step-item">
            <div className="case-step-marker">{index + 1}</div>
            <div className="case-step-body">
              <strong>{step.title}</strong>
              <p>{step.body}</p>
              {step.hasReceipt ? (
                <div className="case-step-receipt">
                  <input
                    type="text"
                    placeholder="IOE0912345678"
                    value={receiptInput}
                    onChange={(event) => onReceiptChange(event.target.value.toUpperCase())}
                    aria-label="Receipt number"
                  />
                  {apiUrl ? (
                    <a className="case-step-link" href={apiUrl} target="_blank" rel="noreferrer">
                      Open USCIS API
                    </a>
                  ) : (
                    <span className="case-step-link disabled">Open USCIS API</span>
                  )}
                </div>
              ) : null}
            </div>
          </li>
        ))}
      </ol>

      <details className="case-guide-details" open={showManual} onToggle={(e) => setShowManual(e.target.open)}>
        <summary>Manual URL method &amp; privacy notes</summary>
        <div className="case-guide-details-body">
          <p>
            After signing in, you can also paste this URL into a new tab (swap in your receipt number):
          </p>
          <code className="case-guide-url">{exampleUrl}</code>
          <ul>
            <li>USCIS blocks direct imports from other sites (CORS) — copy/paste is required.</li>
            <li>JSON is read only in your browser; we never upload or store your case file.</li>
            <li>You must be signed in to USCIS in the same browser session for the link to work.</li>
          </ul>
        </div>
      </details>
    </div>
  );
}
