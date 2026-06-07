import { formatDate, statusLabel } from '../utils/dates';

export default function CaseResultsTable({
  cases,
  selectedId,
  onSelectCase,
  limit = 100,
  emptyTitle = 'No cases found',
  emptyMessage = 'Try adjusting your search or filters.',
}) {
  const visibleCases = cases.slice(0, limit);

  if (!cases.length) {
    return (
      <div className="empty-state compact">
        <h3>{emptyTitle}</h3>
        <p>{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className="table-wrap case-results-table">
      <table>
        <thead>
          <tr>
            <th>Tab</th>
            <th>Block #</th>
            <th>Category</th>
            <th>Priority Date</th>
            <th>Receipt</th>
            <th>Biometrics</th>
            <th>Field Office</th>
            <th>GC Approval</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          {visibleCases.map((record) => {
            const selected = record.id === selectedId;
            return (
              <tr
                key={record.id}
                className={selected ? 'selected' : ''}
                onClick={() => onSelectCase(record)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault();
                    onSelectCase(record);
                  }
                }}
                tabIndex={0}
                role="button"
                aria-pressed={selected}
                aria-label={`View ${record.blockNumber || record.category}, ${statusLabel(record.status)}`}
              >
                <td>{record.sheetName || '—'}</td>
                <td>{record.blockNumber || '—'}</td>
                <td>{record.category || '—'}</td>
                <td>{formatDate(record.priorityDate)}</td>
                <td>{formatDate(record.receiptDate)}</td>
                <td>{formatDate(record.biometricDate)}</td>
                <td>{record.fieldOffice || '—'}</td>
                <td>{formatDate(record.gcApprovalDate)}</td>
                <td><span className={`badge badge-${record.status}`}>{statusLabel(record.status)}</span></td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
