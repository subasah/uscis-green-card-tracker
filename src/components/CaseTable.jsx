import { formatDate, statusLabel } from '../utils/dates';

export default function CaseTable({ cases, selectedId, onSelectCase }) {
  if (!cases.length) {
    return (
      <section className="panel">
        <div className="empty-state">
          <h3>No cases match your filters</h3>
          <p>Try clearing filters or searching by block number, priority date, or field office.</p>
        </div>
      </section>
    );
  }

  return (
    <section className="panel">
      <div className="panel-header">
        <div>
          <h2>Cases</h2>
          <p>{cases.length} matching records</p>
        </div>
      </div>

      <div className="table-wrap">
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
            {cases.slice(0, 100).map((record) => (
              <tr
                key={record.id}
                className={record.id === selectedId ? 'selected' : ''}
                onClick={() => onSelectCase(record)}
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
            ))}
          </tbody>
        </table>
      </div>

      {cases.length > 100 ? (
        <p className="table-note">Showing first 100 of {cases.length} results. Refine search to narrow down.</p>
      ) : null}
    </section>
  );
}
