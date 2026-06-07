import FilterChips from './FilterChips';
import { STATUS_OPTIONS, buildFilterChips, countActiveFilters } from '../utils/filterHelpers';

const FIELDSETS = {
  community: ['query', 'receiptMonth', 'category', 'status'],
  trends: ['receiptMonth', 'category', 'status', 'country'],
};

export default function FilterBar({
  variant,
  values,
  options,
  onChange,
  onClear,
}) {
  const fields = FIELDSETS[variant] ?? FIELDSETS.community;
  const activeCount = countActiveFilters(values);
  const chips = buildFilterChips(values, options);

  const update = (key, value) => onChange({ ...values, [key]: value });

  const removeChip = (key) => {
    onChange({
      ...values,
      [key]: key === 'query' ? '' : 'all',
    });
  };

  return (
    <div className={`filter-bar filter-bar-${variant}`}>
      <div className="filter-bar-fields">
        {fields.includes('query') ? (
          <label className="filter-field filter-field-search">
            <span>Search</span>
            <input
              type="search"
              placeholder="Block # or IOE receipt"
              value={values.query || ''}
              onChange={(event) => update('query', event.target.value)}
            />
          </label>
        ) : null}

        {fields.includes('receiptMonth') ? (
          <label className="filter-field">
            <span>Receipt month</span>
            <select
              value={values.receiptMonth || 'all'}
              onChange={(event) => update('receiptMonth', event.target.value)}
            >
              <option value="all">All months</option>
              {options.receiptMonths?.map((item) => (
                <option key={item.value} value={item.value}>{item.label}</option>
              ))}
            </select>
          </label>
        ) : null}

        {fields.includes('category') ? (
          <label className="filter-field">
            <span>Category</span>
            <select
              value={values.category || 'all'}
              onChange={(event) => update('category', event.target.value)}
            >
              <option value="all">All categories</option>
              {options.categories?.map((item) => (
                <option key={item} value={item}>{item}</option>
              ))}
            </select>
          </label>
        ) : null}

        {fields.includes('status') ? (
          <label className="filter-field">
            <span>Status</span>
            <select
              value={values.status || 'all'}
              onChange={(event) => update('status', event.target.value)}
            >
              {STATUS_OPTIONS.map((item) => (
                <option key={item.value} value={item.value}>{item.label}</option>
              ))}
            </select>
          </label>
        ) : null}

        {fields.includes('country') ? (
          <label className="filter-field">
            <span>Country of concern</span>
            <select
              value={values.country || 'all'}
              onChange={(event) => update('country', event.target.value)}
            >
              <option value="all">All</option>
              {options.countries?.map((item) => (
                <option key={item} value={item}>{item}</option>
              ))}
            </select>
          </label>
        ) : null}
      </div>

      <div className="filter-bar-footer">
        {activeCount > 0 ? (
          <>
            <FilterChips chips={chips} onRemove={removeChip} />
            {onClear ? (
              <button type="button" className="filter-clear" onClick={onClear}>
                Clear
              </button>
            ) : null}
          </>
        ) : (
          <span className="filter-bar-hint">
            {variant === 'community'
              ? 'Pick your receipt month tab, then search by block #.'
              : 'Filter charts by receipt cohort, category, or country of concern.'}
          </span>
        )}
      </div>
    </div>
  );
}
