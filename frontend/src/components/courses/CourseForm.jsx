import { useState } from 'react';
import { Input } from '../ui/Field';
import Button from '../ui/Button';
import TransferList from '../ui/TransferList';

export default function CourseForm({
  selectedCourse,
  allBatches,
  allEducators,
  onInsert,
  onUpdate,
  onCancel,
}) {
  const [name, setName] = useState(selectedCourse?.name || '');
  const [code, setCode] = useState(selectedCourse?.code || '');
  const [batchIds, setBatchIds] = useState(
    selectedCourse ? selectedCourse.batches.map((b) => b.batch) : []
  );
  const [educatorIds, setEducatorIds] = useState(
    selectedCourse ? selectedCourse.educators.map((e) => e.educator) : []
  );
  const [saving, setSaving] = useState(false);

  const buildPayload = () => ({
    name,
    code,
    batch_ids: batchIds,
    educator_ids: educatorIds,
  });

  const handleSubmit = async () => {
    setSaving(true);
    try {
      if (selectedCourse) {
        await onUpdate(selectedCourse.id, buildPayload());
      } else {
        await onInsert(buildPayload());
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Input label="Course name" required value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Information Technology" />
        <Input label="Course code" required value={code} onChange={(e) => setCode(e.target.value)} placeholder="e.g. IT101" />
      </div>

      <div>
        <label className="block text-xs font-semibold text-ink-soft tracking-wide mb-1.5">Assign batches</label>
        <TransferList
          items={allBatches.map((b) => ({ id: b.id, label: b.name }))}
          value={batchIds}
          onChange={setBatchIds}
          leftTitle="Available"
          rightTitle="Assigned"
        />
      </div>

      <div>
        <label className="block text-xs font-semibold text-ink-soft tracking-wide mb-1.5">Assign educators</label>
        <TransferList
          items={allEducators.map((e) => ({ id: e.id, label: e.name }))}
          value={educatorIds}
          onChange={setEducatorIds}
          leftTitle="Available"
          rightTitle="Assigned"
        />
      </div>

      <div className="flex gap-3 pt-4 border-t border-ink/[0.06]">
        <Button variant="outline" size="md" onClick={onCancel}>Cancel</Button>
        <Button variant="brand" size="md" disabled={saving} onClick={handleSubmit}>
          {saving ? 'Saving…' : selectedCourse ? 'Save changes' : 'Create course'}
        </Button>
      </div>
    </div>
  );
}
