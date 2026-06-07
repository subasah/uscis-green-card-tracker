import ThemeToggle from './ThemeToggle';

const TABS = [
  { id: 'my-uscis', label: 'My USCIS case' },
  { id: 'finder', label: 'Find in community' },
  { id: 'detail', label: 'Action plan' },
  { id: 'dashboard', label: 'Trends' },
  { id: 'cases', label: 'All cases' },
  { id: 'agents', label: 'Emma agents' },
  { id: 'reddit', label: 'Reddit' },
  { id: 'tutorial', label: 'Tutorial' },
];

export function AppTopBar({ activeTab, onChange, themePreference, onThemeChange, chatSlot }) {
  return (
    <header className="app-topbar">
      <div className="app-topbar-row">
        <h1 className="app-title">USCIS Green Card Tracker</h1>
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
          {caseCount} cases
          {lastUpdated ? ` · updated ${lastUpdated.toLocaleString()}` : ''}
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
          {loading ? 'Refreshing…' : 'Refresh spreadsheet'}
        </button>
      </div>
    </div>
  );
}

export function SearchBar({ filters, options, onChange }) {
  return (
    <div className="filters">
      <label className="search-field">
        <span>Search</span>
        <input
          type="search"
          placeholder="Block #, IOE receipt, priority date, field office, comments…"
          value={filters.query}
          onChange={(event) => onChange({ ...filters, query: event.target.value })}
        />
      </label>

      <label>
        <span>Receipt month tab</span>
        <select value={filters.receiptMonth} onChange={(event) => onChange({ ...filters, receiptMonth: event.target.value })}>
          <option value="all">All months</option>
          {options.receiptMonths?.map((item) => (
            <option key={item.value} value={item.value}>{item.label}</option>
          ))}
        </select>
      </label>

      <label>
        <span>Category</span>
        <select value={filters.category} onChange={(event) => onChange({ ...filters, category: event.target.value })}>
          <option value="all">All categories</option>
          {options.categories.map((item) => <option key={item} value={item}>{item}</option>)}
        </select>
      </label>

      <label>
        <span>Status</span>
        <select value={filters.status} onChange={(event) => onChange({ ...filters, status: event.target.value })}>
          <option value="all">All statuses</option>
          <option value="approved">Approved</option>
          <option value="in_progress">In Progress</option>
          <option value="submitted">Submitted</option>
        </select>
      </label>

      <label>
        <span>Field office</span>
        <select value={filters.fieldOffice} onChange={(event) => onChange({ ...filters, fieldOffice: event.target.value })}>
          <option value="all">All offices</option>
          {options.fieldOffices.map((item) => <option key={item} value={item}>{item}</option>)}
        </select>
      </label>

      <label>
        <span>Country of concern</span>
        <select value={filters.country} onChange={(event) => onChange({ ...filters, country: event.target.value })}>
          <option value="all">All</option>
          {options.countries.map((item) => <option key={item} value={item}>{item}</option>)}
        </select>
      </label>
    </div>
  );
}
