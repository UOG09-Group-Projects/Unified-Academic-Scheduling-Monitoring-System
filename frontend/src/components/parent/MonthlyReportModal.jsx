import { useState, useEffect } from 'react';
import { Download, FileText } from 'lucide-react';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import { Select } from '../ui/Field';
import { SkeletonRows } from '../ui/Skeleton';
import EmptyState from '../ui/EmptyState';
import { useToast } from '../ui/Toast';
import dashboardService from '../../services/dashboardService';

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

export default function MonthlyReportModal({ open, onClose, student }) {
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [downloading, setDownloading] = useState(false);
  const toast = useToast();

  useEffect(() => {
    if (!open || !student) return;
    setLoading(true);
    setError(null);
    dashboardService.getParentMonthlyReport(student.id, year, month)
      .then(setReport)
      .catch(() => setError('Could not load the report for this period.'))
      .finally(() => setLoading(false));
  }, [open, student, year, month]);

  const handleDownload = async () => {
    if (!student) return;
    setDownloading(true);
    try {
      const res = await dashboardService.downloadParentMonthlyReport(student.id, year, month);
      const disposition = res.headers?.['content-disposition'] ?? '';
      const match = disposition.match(/filename="?([^"]+)"?/);
      const filename = match ? match[1] : `${student.name.toLowerCase()}-report-${year}-${month}.pdf`;

      const url = URL.createObjectURL(res.data);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      toast.success('Report downloaded.');
    } catch {
      toast.error('Could not download the report.');
    } finally {
      setDownloading(false);
    }
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
          <Button variant="ocean" size="md" icon={Download} onClick={handleDownload} disabled={!report || downloading}>
            {downloading ? 'Downloading…' : 'Download PDF'}
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
