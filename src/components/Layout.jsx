export function Header({ lastUpdated, loading, onRefresh, errors, stats }) {
  return (
    <header className="app-header">
      <div className="header-copy">
        <p className="eyebrow">USCIS · I-485 · Community data</p>
        <h1>USCIS Green Card Tracker</h1>
        <p>
          Analyze your USCIS case JSON and compare it with community I-485 tracker data — timelines, block numbers, approval estimates, and next steps.
        </p>
        {stats ? (
          <p className="header-stats">
            {stats.cases} cases · {stats.agents} agent chats
          </p>
        ) : null}
      </div>
      <div className="header-actions">
        <button type="button" className="refresh-button" onClick={onRefresh} disabled={loading}>
          {loading ? 'Refreshing…' : 'Refresh data'}
        </button>
        {lastUpdated ? <span className="updated-at">Updated {lastUpdated.toLocaleString()}</span> : null}
        {errors.length ? (
          <details className="error-box">
            <summary>{errors.length} sheet(s) failed to load</summary>
            <ul>{errors.map((error) => <li key={error}>{error}</li>)}</ul>
          </details>
        ) : null}
      </div>
    </header>
  );
}

export function NavTabs({ activeTab, onChange }) {
  const tabs = [
    { id: 'my-uscis', label: 'My USCIS case' },
    { id: 'finder', label: 'Find in community' },
    { id: 'detail', label: 'Action plan' },
    { id: 'dashboard', label: 'Trends' },
    { id: 'cases', label: 'All cases' },
    { id: 'agents', label: 'Emma agents' },
    { id: 'reddit', label: 'Reddit' },
    { id: 'tutorial', label: 'Tutorial' },
  ];

  return (
    <nav className="tab-nav">
      {tabs.map((tab) => (
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
