import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { formatReceiptMonthLabel } from '../config';
import { average, formatDate, median, monthLabel } from '../utils/dates';
import { getChartTheme } from '../utils/theme';

function StatCard({ label, value, hint }) {
  return (
    <div className="stat-card">
      <span className="stat-label">{label}</span>
      <strong className="stat-value">{value}</strong>
      {hint ? <span className="stat-hint">{hint}</span> : null}
    </div>
  );
}

function formatDays(values) {
  if (!values?.length) return '—';
  const med = median(values);
  const avg = average(values);
  return `${med ?? '—'} days median · ${avg ?? '—'} avg (${values.length} cases)`;
}

function EmptyChart({ title, message }) {
  return (
    <div className="chart-empty">
      <strong>{title}</strong>
      <p>{message}</p>
    </div>
  );
}

function describeActiveFilters(filters) {
  const parts = [];

  if (filters.receiptMonth !== 'all') {
    parts.push(formatReceiptMonthLabel(filters.receiptMonth));
  }
  if (filters.country !== 'all') parts.push(filters.country);
  if (filters.category !== 'all') parts.push(filters.category);
  if (filters.status !== 'all') parts.push(filters.status.replace('_', ' '));
  if (filters.fieldOffice !== 'all') parts.push(filters.fieldOffice);
  if (filters.query) parts.push(`"${filters.query}"`);

  return parts;
}

export default function Dashboard({ insights, cases, filters, chartKey, theme = 'dark' }) {
  const chartTheme = getChartTheme(theme);
  const categoryData = insights.byCategory.slice(0, 8).map((item) => ({
    name: item.name,
    medianDays: item.medianDays ?? 0,
    count: item.count,
  }));

  const fieldOfficeData = insights.byFieldOffice.slice(0, 8).map((item) => ({
    name: item.name.length > 18 ? `${item.name.slice(0, 18)}…` : item.name,
    fullName: item.name,
    medianDays: item.medianDays ?? 0,
    count: item.count,
  }));

  const monthlyData = insights.monthlyApprovals.map((item) => ({
    ...item,
    label: monthLabel(item.month),
  }));

  const statusBreakdown = [
    { name: 'Approved', value: insights.approvedCount },
    { name: 'In Progress', value: insights.inProgressCount },
    {
      name: 'Submitted',
      value: Math.max(0, insights.totalCases - insights.approvedCount - insights.inProgressCount),
    },
  ];

  const activeFilters = describeActiveFilters(filters ?? {});
  const hasApprovedData = insights.approvedCount > 0;
  const noApprovedMessage =
    insights.totalCases > 0
      ? `No approved cases match the current filters yet (${insights.inProgressCount} still in progress). Try clearing the receipt month or status filters, or choose All for country of concern.`
      : 'No cases match the current filters. Try clearing one or more filters above.';

  return (
    <section className="panel">
      <div className="panel-header">
        <div>
          <h2>Dashboard</h2>
          <p>Community-reported processing patterns across all tracker tabs.</p>
          {activeFilters.length ? (
            <p className="filter-summary">
              Filtered by {activeFilters.join(' · ')} · {insights.totalCases} case
              {insights.totalCases === 1 ? '' : 's'}
            </p>
          ) : null}
        </div>
      </div>

      <div className="stat-grid">
        <StatCard label="Total cases" value={insights.totalCases} />
        <StatCard label="Approved" value={insights.approvedCount} />
        <StatCard label="In progress" value={insights.inProgressCount} />
        <StatCard
          label="Receipt → Biometrics"
          value={formatDays(insights.receiptToBio)}
          hint="Approved cases only"
        />
        <StatCard
          label="Biometrics → Approval"
          value={formatDays(insights.bioToApproval)}
          hint="Approved cases only"
        />
        <StatCard
          label="Receipt → Approval"
          value={formatDays(insights.receiptToApproval)}
          hint="End-to-end for approved cases"
        />
      </div>

      <div className="chart-grid">
        <div className="chart-card">
          <h3>Monthly GC approvals</h3>
          {monthlyData.length ? (
            <ResponsiveContainer key={`monthly-${chartKey}`} width="100%" height={260}>
              <LineChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" stroke={chartTheme.grid} />
                <XAxis dataKey="label" tick={{ fill: chartTheme.tick, fontSize: 12 }} />
                <YAxis allowDecimals={false} tick={{ fill: chartTheme.tick, fontSize: 12 }} />
                <Tooltip
                  contentStyle={{
                    background: chartTheme.tooltip.background,
                    border: `1px solid ${chartTheme.tooltip.border}`,
                    borderRadius: 12,
                    color: chartTheme.tooltip.color,
                  }}
                />
                <Line type="monotone" dataKey="count" stroke={chartTheme.line} strokeWidth={3} dot={{ r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <EmptyChart
              title="No approval trend yet"
              message={hasApprovedData ? 'Approved cases are missing GC approval dates.' : noApprovedMessage}
            />
          )}
        </div>

        <div className="chart-card">
          <h3>Median days to approval by category</h3>
          {categoryData.length ? (
            <ResponsiveContainer key={`category-${chartKey}`} width="100%" height={260}>
              <BarChart data={categoryData}>
                <CartesianGrid strokeDasharray="3 3" stroke={chartTheme.grid} />
                <XAxis dataKey="name" tick={{ fill: chartTheme.tick, fontSize: 11 }} />
                <YAxis tick={{ fill: chartTheme.tick, fontSize: 12 }} />
                <Tooltip
                  contentStyle={{
                    background: chartTheme.tooltip.background,
                    border: `1px solid ${chartTheme.tooltip.border}`,
                    borderRadius: 12,
                    color: chartTheme.tooltip.color,
                  }}
                />
                <Bar dataKey="medianDays" fill={chartTheme.barGreen} radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <EmptyChart
              title="No category timing yet"
              message={
                hasApprovedData
                  ? 'Approved cases need both receipt and GC approval dates to compute medians.'
                  : noApprovedMessage
              }
            />
          )}
        </div>

        <div className="chart-card wide">
          <h3>Median processing time by field office</h3>
          {fieldOfficeData.length ? (
            <ResponsiveContainer key={`office-${chartKey}`} width="100%" height={280}>
              <BarChart data={fieldOfficeData} layout="vertical" margin={{ left: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={chartTheme.grid} />
                <XAxis type="number" tick={{ fill: chartTheme.tick, fontSize: 12 }} />
                <YAxis
                  type="category"
                  dataKey="name"
                  width={120}
                  tick={{ fill: chartTheme.tick, fontSize: 11 }}
                />
                <Tooltip
                  formatter={(value, _name, props) => [`${value} days`, props.payload.fullName]}
                  contentStyle={{
                    background: chartTheme.tooltip.background,
                    border: `1px solid ${chartTheme.tooltip.border}`,
                    borderRadius: 12,
                    color: chartTheme.tooltip.color,
                  }}
                />
                <Bar dataKey="medianDays" fill={chartTheme.barPurple} radius={[0, 8, 8, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <EmptyChart
              title="No field office timing yet"
              message={
                hasApprovedData
                  ? 'Approved cases need receipt and GC approval dates grouped by field office.'
                  : noApprovedMessage
              }
            />
          )}
        </div>
      </div>

      <div className="status-strip">
        {statusBreakdown.map((item) => (
          <div key={item.name} className="status-chip">
            <span>{item.name}</span>
            <strong>{item.value}</strong>
          </div>
        ))}
        <div className="status-chip muted">
          <span>Categories tracked</span>
          <strong>{new Set(cases.map((record) => record.category).filter(Boolean)).size}</strong>
        </div>
      </div>
    </section>
  );
}

export function formatCaseSummary(record) {
  return `${record.category || 'Unknown'} · PD ${formatDate(record.priorityDate)} · RD ${formatDate(record.receiptDate)}`;
}
