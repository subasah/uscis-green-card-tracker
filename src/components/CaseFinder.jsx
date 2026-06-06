import { useMemo, useState } from 'react';
import { FinderGuidancePanel } from './ActionPlan';
import { formatDate } from '../utils/dates';
import { buildFinderGuidance } from '../utils/advisoryService';
import { getCasesForReceiptMonth } from '../utils/dataService';

export default function CaseFinder({ cases, onSelectCase }) {
  const [priorityDate, setPriorityDate] = useState('');
  const [receiptDate, setReceiptDate] = useState('');
  const [category, setCategory] = useState('');
  const [blockNumber, setBlockNumber] = useState('');

  const categories = useMemo(
    () => [...new Set(cases.map((record) => record.category).filter(Boolean))].sort(),
    [cases]
  );

  const finderGuidance = useMemo(
    () => buildFinderGuidance({
      receiptDate: receiptDate ? new Date(receiptDate) : null,
      cases,
    }),
    [receiptDate, cases]
  );

  const matches = useMemo(() => {
    const pool = receiptDate
      ? getCasesForReceiptMonth(cases, new Date(receiptDate))
      : cases;

    return pool
      .filter((record) => {
        if (blockNumber && !`${record.blockNumber} ${record.receiptNumbers.join(' ')}`.toUpperCase().includes(blockNumber.toUpperCase())) {
          return false;
        }
        if (category && record.category !== category) return false;
        if (priorityDate && record.priorityDate) {
          const target = new Date(priorityDate);
          const diff = Math.abs(record.priorityDate.getTime() - target.getTime()) / (1000 * 60 * 60 * 24);
          if (diff > 120) return false;
        } else if (priorityDate && !record.priorityDate) {
          return false;
        }
        if (receiptDate && record.receiptDate) {
          const target = new Date(receiptDate);
          const diff = Math.abs(record.receiptDate.getTime() - target.getTime()) / (1000 * 60 * 60 * 24);
          if (diff > 21) return false;
        } else if (receiptDate && !record.receiptDate) {
          return false;
        }
        return true;
      })
      .slice(0, 12);
  }, [cases, blockNumber, category, priorityDate, receiptDate]);

  return (
    <section className="panel finder-panel">
      <div className="panel-header">
        <div>
          <h2>Find my case</h2>
          <p>
            Start with your <strong>I-485 receipt date</strong> to match the correct monthly tab
            (e.g. receipt on 4/1/2026 → Apr &apos;26 tab). Then narrow by block number or priority date.
          </p>
        </div>
      </div>

      <div className="finder-form finder-form-wide">
        <label>
          I-485 receipt date
          <input
            type="date"
            value={receiptDate}
            onChange={(event) => setReceiptDate(event.target.value)}
          />
        </label>
        <label>
          Block # / Receipt prefix
          <input
            type="text"
            placeholder="e.g. IOE09358"
            value={blockNumber}
            onChange={(event) => setBlockNumber(event.target.value)}
          />
        </label>
        <label>
          Priority date (I-140/I-130 PD)
          <input
            type="date"
            value={priorityDate}
            onChange={(event) => setPriorityDate(event.target.value)}
          />
        </label>
        <label>
          Category
          <select value={category} onChange={(event) => setCategory(event.target.value)}>
            <option value="">Any category</option>
            {categories.map((item) => (
              <option key={item} value={item}>{item}</option>
            ))}
          </select>
        </label>
      </div>

      <FinderGuidancePanel guidance={finderGuidance} />

      <div className="finder-results">
        {matches.length ? (
          matches.map((record) => (
            <button
              key={record.id}
              type="button"
              className="finder-card"
              onClick={() => onSelectCase(record)}
            >
              <div>
                <strong>{record.blockNumber || record.category}</strong>
                <span>{record.sheetName} · {record.fieldOffice || 'Unknown FO'}</span>
              </div>
              <div>
                <span>PD {formatDate(record.priorityDate)} · RD {formatDate(record.receiptDate)}</span>
                <span>{formatDate(record.gcApprovalDate) ? `Approved ${formatDate(record.gcApprovalDate)}` : 'Pending'}</span>
              </div>
            </button>
          ))
        ) : (
          <div className="empty-state compact">
            <p>No close matches yet. Enter your I-485 receipt date first, then try block number alone.</p>
          </div>
        )}
      </div>
    </section>
  );
}
