import { useState, useEffect } from 'react';
import { Printer, FileText } from 'lucide-react';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import { Select } from '../ui/Field';
import { SkeletonRows } from '../ui/Skeleton';
import EmptyState from '../ui/EmptyState';
import dashboardService from '../../services/dashboardService';

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

function buildReportHtml(report) {
  const { student, guardian, period, summary, courses, enrollments_this_month } = report;

  const courseRows = courses.map((c) => `
    <tr>
      <td>${c.name} (${c.code})</td>
      <td>${c.total_activities}</td>
      <td>${c.graded_activities}</td>
      <td>${c.average_progress_pct != null ? c.average_progress_pct + '%' : '—'}</td>
    </tr>
  `).join('') || '<tr><td colspan="4">No courses.</td></tr>';

  const activityRows = courses.flatMap((c) =>
    c.activities.map((a) => `
      <tr>
        <td>${c.code}</td>
        <td>${a.name}</td>
        <td>${a.due_date || '—'}</td>
        <td>${a.progress_pct != null ? a.progress_pct + '%' : 'Not graded yet'}</td>
      </tr>
    `)
  ).join('') || '<tr><td colspan="4">No activities.</td></tr>';

  const enrollmentRows = enrollments_this_month.map((e) => `
    <tr><td>${e.course.name} (${e.course.code})</td><td>${e.enrolled_date}</td></tr>
  `).join('') || '<tr><td colspan="2">No new enrollments this month.</td></tr>';

  return `<!doctype html>
<html><head><meta charset="utf-8"><title>${student.name} — ${period.label} report</title>
<style>
  body { font-family: -apple-system, Segoe UI, Arial, sans-serif; color: #1a1a1a; padding: 32px; max-width: 800px; margin: 0 auto; }
  h1 { font-size: 20px; margin-bottom: 4px; }
  h2 { font-size: 14px; margin-top: 28px; margin-bottom: 8px; text-transform: uppercase; letter-spacing: 0.04em; color: #555; }
  .meta { color: #666; font-size: 13px; margin-bottom: 20px; }
  table { width: 100%; border-collapse: collapse; font-size: 13px; }
  th, td { text-align: left; padding: 6px 8px; border-bottom: 1px solid #e5e5e5; }
  th { color: #666; font-weight: 600; }
  .stats { display: flex; gap: 24px; margin: 16px 0; }
  .stat { }
  .stat .value { font-size: 20px; font-weight: 700; }
  .stat .label { font-size: 11px; color: #777; text-transform: uppercase; }
  @media print { body { padding: 0; } }
</style></head>
<body>
  <h1>${student.name} — Monthly Report</h1>
  <p class="meta">
    ${period.label} · Registration No: ${student.registration_no}
    ${student.institution ? ' · ' + student.institution : ''}
    ${student.batch ? ' · Batch: ' + student.batch : ''}
    <br>Prepared for guardian: ${guardian.name}
    <br>Generated: ${new Date(report.generated_at).toLocaleString()}
  </p>

  <div class="stats">
    <div class="stat"><div class="value">${summary.total_courses}</div><div class="label">Courses</div></div>
    <div class="stat"><div class="value">${summary.graded_activities}/${summary.total_activities}</div><div class="label">Activities graded</div></div>
    <div class="stat"><div class="value">${summary.overall_average_progress_pct != null ? summary.overall_average_progress_pct + '%' : '—'}</div><div class="label">Average progress</div></div>
    <div class="stat"><div class="value">${summary.enrollments_this_month}</div><div class="label">New enrollments this month</div></div>
  </div>

  <h2>Courses</h2>
  <table><thead><tr><th>Course</th><th>Total activities</th><th>Graded</th><th>Avg. progress</th></tr></thead>
  <tbody>${courseRows}</tbody></table>

  <h2>Activities</h2>
  <table><thead><tr><th>Course</th><th>Activity</th><th>Due</th><th>Progress</th></tr></thead>
  <tbody>${activityRows}</tbody></table>

  <h2>Enrollments in ${period.label}</h2>
  <table><thead><tr><th>Course</th><th>Enrolled on</th></tr></thead>
  <tbody>${enrollmentRows}</tbody></table>
</body></html>`;
}

export default function MonthlyReportModal({ open, onClose, student }) {
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!open || !student) return;
    setLoading(true);
    setError(null);
    dashboardService.getParentMonthlyReport(student.id, year, month)
      .then(setReport)
      .catch(() => setError('Could not load the report for this period.'))
      .finally(() => setLoading(false));
  }, [open, student, year, month]);

  const handlePrint = () => {
    if (!report) return;
    const win = window.open('', '_blank');
    win.document.write(buildReportHtml(report));
    win.document.close();
    win.focus();
    win.print();
  };

  const years = Array.from({ length: 5 }, (_, i) => now.getFullYear() - i);

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={student ? `${student.name}'s monthly report` : 'Monthly report'}
      width="max-w-2xl"
      footer={
        <>
          <Button variant="outline" size="md" onClick={onClose}>Close</Button>
          <Button variant="ocean" size="md" icon={Printer} onClick={handlePrint} disabled={!report}>
            Print / Save as PDF
          </Button>
        </>
      }
    >
      <div className="flex gap-3 mb-5">
        <Select label="Month" value={month} onChange={(e) => setMonth(Number(e.target.value))} wrapperClassName="flex-1">
          {MONTH_NAMES.map((m, i) => (
            <option key={m} value={i + 1}>{m}</option>
          ))}
        </Select>
        <Select label="Year" value={year} onChange={(e) => setYear(Number(e.target.value))} wrapperClassName="w-28">
          {years.map((y) => <option key={y} value={y}>{y}</option>)}
        </Select>
      </div>

      {loading ? (
        <SkeletonRows rows={5} />
      ) : error ? (
        <div className="text-sm text-danger">{error}</div>
      ) : !report ? (
        <EmptyState icon={FileText} title="No data" message="No report data available." />
      ) : (
        <div className="flex flex-col gap-5 text-sm">
          <div className="grid grid-cols-4 gap-3">
            {[
              ['Courses', report.summary.total_courses],
              ['Graded', `${report.summary.graded_activities}/${report.summary.total_activities}`],
              ['Avg. progress', report.summary.overall_average_progress_pct != null ? `${report.summary.overall_average_progress_pct}%` : '—'],
              ['New enrollments', report.summary.enrollments_this_month],
            ].map(([label, value]) => (
              <div key={label} className="rounded-lg bg-ink/[0.03] px-3 py-2.5">
                <p className="text-lg font-semibold text-ink">{value}</p>
                <p className="text-[10px] uppercase tracking-wide text-ink-faint">{label}</p>
              </div>
            ))}
          </div>

          {report.courses.length === 0 ? (
            <EmptyState icon={FileText} title="No courses" message="No course activity to report for this period." />
          ) : (
            <div className="flex flex-col gap-3">
              {report.courses.map((c) => (
                <div key={c.id} className="border border-ink/[0.06] rounded-lg p-3">
                  <div className="flex items-center justify-between mb-1">
                    <p className="font-medium text-ink">{c.name}</p>
                    <span className="text-xs text-ink-faint">
                      {c.average_progress_pct != null ? `${c.average_progress_pct}% avg` : 'Not graded yet'}
                    </span>
                  </div>
                  <p className="text-xs text-ink-faint">
                    {c.graded_activities}/{c.total_activities} activities graded
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </Modal>
  );
}
