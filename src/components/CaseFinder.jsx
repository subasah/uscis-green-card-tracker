import { useMemo } from 'react';
import CaseDetailDrawer from './CaseDetailDrawer';
import CaseResultsTable from './CaseResultsTable';
import FilterBar from './FilterBar';
import { FinderGuidancePanel } from './ActionPlan';
import { buildFinderGuidance } from '../utils/advisoryService';
import { COMMUNITY_FILTER_DEFAULTS, toFilterCasesInput } from '../utils/filterHelpers';
import { filterCases } from '../utils/dataService';

export default function CaseFinder({
  cases,
  filters,
  filterOptions,
  onFiltersChange,
  selectedId,
  onSelectCase,
  caseDetail,
}) {
  const matches = useMemo(
    () => filterCases(cases, toFilterCasesInput(filters)),
    [cases, filters]
  );

  const finderGuidance = useMemo(
    () => buildFinderGuidance({
      receiptMonth: filters.receiptMonth,
      cases: matches,
    }),
    [filters.receiptMonth, matches]
  );

  return (
    <section className="panel finder-panel">
      <div className="panel-header panel-header-compact">
        <div>
          <h2>Find in community</h2>
          <p>Browse community cases by receipt month and block number. Click a row to open full details.</p>
        </div>
      </div>

      <FilterBar
        variant="community"
        values={filters}
        options={filterOptions}
        onChange={onFiltersChange}
        onClear={() => onFiltersChange(COMMUNITY_FILTER_DEFAULTS)}
      />

      <FinderGuidancePanel guidance={finderGuidance} />

      <p className="results-count">
        <strong>{matches.length.toLocaleString()}</strong> matching {matches.length === 1 ? 'case' : 'cases'}
      </p>

      <CaseResultsTable
        cases={matches}
        selectedId={selectedId}
        onSelectCase={onSelectCase}
        emptyTitle="No cases match"
        emptyMessage="Select a receipt month tab or search by block # / IOE receipt."
      />

      {matches.length > 100 ? (
        <p className="table-note">Showing first 100 of {matches.length.toLocaleString()} results.</p>
      ) : null}

      <CaseDetailDrawer
        open={Boolean(selectedId && caseDetail)}
        caseDetail={caseDetail}
        onClose={caseDetail?.onClose}
      />
    </section>
  );
}
