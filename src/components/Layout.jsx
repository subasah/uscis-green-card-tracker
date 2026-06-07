import ThemeToggle from './ThemeToggle';

const TABS = [
  { id: 'my-uscis', label: 'My case' },
  { id: 'finder', label: 'Community' },
  { id: 'dashboard', label: 'Trends' },
  { id: 'agents', label: 'Emma' },
  { id: 'reddit', label: 'Reddit' },
];

const TAB_LABELS = {
  'my-uscis': 'My USCIS case',
  finder: 'Find in community',
  dashboard: 'Approval trends',
  agents: 'Emma agents',
  reddit: 'Reddit r/EB2_NIW',
};

export function AppTopBar({ activeTab, onChange, themePreference, onThemeChange, chatSlot }) {
  return (
    <header className="app-topbar">
      <div className="app-topbar-row">
        <div className="app-brand">
          <h1 className="app-title">
            <span className="app-title-full">USCIS Green Card Tracker</span>
            <span className="app-title-short">USCIS Tracker</span>
          </h1>
          <p className="app-tagline">Community I-485 insights · processed locally in your browser</p>
        </div>
        <div className="app-topbar-tools">
          {chatSlot}
          {onThemeChange ? (
            <ThemeToggle preference={themePreference} onChange={onThemeChange} />
          ) : null}
        </div>
      </div>

      <nav className="tab-nav tab-nav-compact" aria-label="Main navigation">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            className={activeTab === tab.id ? 'active' : ''}
            onClick={() => onChange(tab.id)}
            aria-current={activeTab === tab.id ? 'page' : undefined}
            title={TAB_LABELS[tab.id]}
          >
            {tab.label}
          </button>
        ))}
      </nav>
    </header>
  );
}

export function DataRefreshBar({ loading, lastUpdated, caseCount, onRefresh, errors }) {
  return (
    <div className="data-refresh-bar">
      <div className="data-refresh-copy">
        <strong>Community spreadsheet</strong>
        <span className="data-refresh-meta">
          {caseCount.toLocaleString()} cases
          {lastUpdated ? ` · updated ${lastUpdated.toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })}` : ''}
        </span>
      </div>
      <div className="data-refresh-actions">
        {errors.length ? (
          <details className="error-box error-box-inline">
            <summary>{errors.length} sheet(s) failed</summary>
            <ul>{errors.map((error) => <li key={error}>{error}</li>)}</ul>
          </details>
        ) : null}
        <button type="button" className="toolbar-button" onClick={onRefresh} disabled={loading}>
          {loading ? 'Refreshing…' : 'Refresh'}
        </button>
      </div>
    </div>
  );
}
