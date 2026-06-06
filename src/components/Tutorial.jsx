import { EXTERNAL_RESOURCES, SOURCE_URL } from '../config';

const SECTIONS = [
  {
    title: 'Analyze your USCIS case',
    steps: [
      'Sign in at myaccount.uscis.gov in your browser.',
      'Open https://my.uscis.gov/account/case-service/api/cases/IOE09XXXXXXXX (replace with your receipt number).',
      'Select all JSON (Ctrl+A / Cmd+A), copy, paste into My USCIS case, and click Analyze case.',
    ],
    note: 'Your JSON is processed only in your browser — nothing is uploaded.',
  },
  {
    title: 'Find yourself in the community tracker',
    steps: [
      'Go to Find in community.',
      'Enter your I-485 receipt date to match the correct monthly tab (e.g. receipt 4/1/2026 → Apr \'26).',
      'Add your block number (e.g. IOE09358) or priority date to locate similar filers.',
    ],
  },
  {
    title: 'Read the action plan',
    steps: [
      'After analyzing JSON or selecting a community case, open Action plan.',
      'Review estimated approval timing, Emma questions, and USCIS steps.',
    ],
  },
];

export default function Tutorial() {
  return (
    <section className="panel about-panel">
      <div className="panel-header">
        <div>
          <h2>Tutorial</h2>
          <p>Step-by-step guides for each part of the tool. Most users can start directly on My USCIS case or Find in community.</p>
        </div>
      </div>

      <div className="tutorial-grid">
        {SECTIONS.map((section) => (
          <div key={section.title} className="detail-card">
            <h3>{section.title}</h3>
            <ol className="steps-list">
              {section.steps.map((step) => (
                <li key={step}>{step}</li>
              ))}
            </ol>
            {section.note ? <p className="muted-copy">{section.note}</p> : null}
          </div>
        ))}
      </div>

      <div className="detail-card">
        <h3>Community spreadsheet</h3>
        <p className="muted-copy">
          Live tracker data comes from the{' '}
          <a href={SOURCE_URL} target="_blank" rel="noreferrer">I-485 Status Filer</a>{' '}
          Google Sheet — receipt-month tabs and Emma agent logs.
        </p>
        <div className="resource-links">
          {EXTERNAL_RESOURCES.map((resource) => (
            <a key={resource.url} href={resource.url} target="_blank" rel="noreferrer">{resource.label}</a>
          ))}
        </div>
      </div>

      <p className="disclaimer-copy">
        Unofficial third-party tool — not affiliated with USCIS. Informational only, not legal advice or official USCIS guidance.
      </p>
    </section>
  );
}
