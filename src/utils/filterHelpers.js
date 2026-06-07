export const COMMUNITY_FILTER_DEFAULTS = {
  query: '',
  receiptMonth: 'all',
  category: 'all',
  status: 'all',
};

export const TRENDS_FILTER_DEFAULTS = {
  receiptMonth: 'all',
  category: 'all',
  status: 'all',
  country: 'all',
};

/** Full defaults passed to filterCases (unused keys stay open). */
export const FILTER_ALL_OPEN = {
  query: '',
  category: 'all',
  status: 'all',
  fieldOffice: 'all',
  country: 'all',
  sheet: 'all',
  receiptMonth: 'all',
};

export const STATUS_OPTIONS = [
  { value: 'all', label: 'All statuses' },
  { value: 'approved', label: 'Approved' },
  { value: 'in_progress', label: 'In progress' },
  { value: 'submitted', label: 'Submitted' },
];

export function countActiveFilters(filters) {
  return Object.entries(filters).filter(
    ([, value]) => value && value !== 'all' && value !== ''
  ).length;
}

export function buildFilterChips(filters, options = {}) {
  const chips = [];

  if (filters.query?.trim()) {
    chips.push({ key: 'query', label: `Search: ${filters.query.trim()}` });
  }
  if (filters.receiptMonth && filters.receiptMonth !== 'all') {
    const match = options.receiptMonths?.find((item) => item.value === filters.receiptMonth);
    chips.push({ key: 'receiptMonth', label: match?.label || filters.receiptMonth });
  }
  if (filters.category && filters.category !== 'all') {
    chips.push({ key: 'category', label: filters.category });
  }
  if (filters.status && filters.status !== 'all') {
    chips.push({
      key: 'status',
      label: filters.status.replace('_', ' ').replace(/\b\w/g, (c) => c.toUpperCase()),
    });
  }
  if (filters.country && filters.country !== 'all') {
    chips.push({ key: 'country', label: `COC: ${filters.country}` });
  }

  return chips;
}

export function toFilterCasesInput(partial) {
  return { ...FILTER_ALL_OPEN, ...partial };
}
