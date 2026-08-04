import { useState } from 'react';
import { UploadCloud, Download, CheckCircle2, AlertTriangle } from 'lucide-react';
import Modal from './ui/Modal';
import Button from './ui/Button';
import { Select } from './ui/Field';

/**
 * Generic "upload a CSV, get back created/errors" flow — shared by
 * StudentPage (students) and EducatorManagement (educators). The caller
 * owns what the columns mean and how the upload is submitted; this just
 * handles the file picker, the institution/batch pickers, and the results
 * view after submit.
 */
export default function CsvImportModal({
  open,
  onClose,
  title,
  templateHeaders,
  helpText,
  institutions = [],
  showBatchSelect = false,
  batches = [],
  onSubmit,
}) {
  const [file, setFile] = useState(null);
  const [institutionId, setInstitutionId] = useState(institutions[0]?.id ?? '');
  const [batchId, setBatchId] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState(null);

  const reset = () => {
    setFile(null);
    setInstitutionId(institutions[0]?.id ?? '');
    setBatchId('');
    setError('');
    setResult(null);
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const downloadTemplate = () => {
    const blob = new Blob([templateHeaders.join(',') + '\n'], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'import-template.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleSubmit = async () => {
    if (!file) return setError('Choose a CSV file first.');
    if (institutions.length > 1 && !institutionId) return setError('Choose an institution.');

    setSubmitting(true);
    setError('');
    try {
      const data = await onSubmit(file, { institutionId: institutionId || institutions[0]?.id, batchId });
      setResult(data);
    } catch (err) {
      setError(err.response?.data?.error || 'Import failed.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal open={open} onClose={handleClose} title={title} width="max-w-lg">
      <div className="space-y-5">
        {!result ? (
          <>
            {helpText && <p className="text-sm text-ink-faint">{helpText}</p>}

            <button
              type="button"
              onClick={downloadTemplate}
              className="flex items-center gap-1.5 text-sm text-brand-700 hover:underline"
            >
              <Download size={14} /> Download CSV template
            </button>

            {institutions.length > 1 && (
              <Select
                label="Institution"
                required
                value={institutionId}
                onChange={(e) => setInstitutionId(e.target.value)}
              >
                <option value="">Select institution…</option>
                {institutions.map((i) => (
                  <option key={i.id} value={i.id}>{i.name}</option>
                ))}
              </Select>
            )}

            {showBatchSelect && (
              <Select
                label="Batch (optional — applies to every row in this file)"
                value={batchId}
                onChange={(e) => setBatchId(e.target.value)}
              >
                <option value="">No batch</option>
                {batches.map((b) => (
                  <option key={b.id} value={b.id}>{b.name}</option>
                ))}
              </Select>
            )}

            <label className="flex flex-col items-center justify-center gap-2 border-2 border-dashed border-ink/15 rounded-2xl p-8 text-center cursor-pointer hover:border-brand-300 transition-colors">
              <UploadCloud size={22} className="text-ink-faint" />
              <span className="text-sm text-ink-soft">
                {file ? file.name : 'Click to choose a .csv file'}
              </span>
              <input
                type="file"
                accept=".csv,text/csv"
                className="hidden"
                onChange={(e) => setFile(e.target.files[0] || null)}
              />
            </label>

            {error && <p className="text-sm text-danger">{error}</p>}

            <div className="flex justify-end gap-3">
              <Button variant="outline" size="md" onClick={handleClose}>Cancel</Button>
              <Button variant="brand" size="md" disabled={submitting} onClick={handleSubmit}>
                {submitting ? 'Importing…' : 'Import'}
              </Button>
            </div>
          </>
        ) : (
          <>
            <div className="flex items-center gap-2 text-success">
              <CheckCircle2 size={18} />
              <p className="text-sm font-medium text-ink">{result.created} created successfully.</p>
            </div>

            {result.errors?.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-amber-600">
                  <AlertTriangle size={16} />
                  <p className="text-sm font-medium">{result.errors.length} row(s) skipped</p>
                </div>
                <div className="max-h-40 overflow-y-auto scroll-thin rounded-xl border border-ink/[0.06] divide-y divide-ink/[0.06]">
                  {result.errors.map((e, idx) => (
                    <div key={idx} className="px-3 py-2 text-xs text-ink-faint">
                      Row {e.row}: {e.error}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {result.results?.length > 0 && (
              <div className="space-y-2">
                <p className="text-xs font-semibold tracking-widest text-ink-faint uppercase">
                  Created accounts
                </p>
                <div className="max-h-48 overflow-y-auto scroll-thin rounded-xl border border-ink/[0.06] divide-y divide-ink/[0.06]">
                  {result.results.map((r, idx) => (
                    <div key={idx} className="px-3 py-2 text-xs text-ink-soft flex justify-between gap-2">
                      <span className="truncate">{r.name} — {r.email}</span>
                      <span className="text-ink-faint shrink-0">
                        {r.registration_no || r.edu_id}
                      </span>
                    </div>
                  ))}
                </div>
                <p className="text-[11px] text-ink-faint">
                  The value on the right is each account's initial login password.
                </p>
              </div>
            )}

            <div className="flex justify-end gap-3">
              <Button variant="outline" size="md" onClick={reset}>Import another file</Button>
              <Button variant="brand" size="md" onClick={handleClose}>Done</Button>
            </div>
          </>
        )}
      </div>
    </Modal>
  );
}
