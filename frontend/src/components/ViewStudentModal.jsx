import Modal from './ui/Modal';
import Button from './ui/Button';
import Badge from './ui/Badge';

export default function ViewStudentModal({ student, onClose }) {
  if (!student) return null;

  return (
    <Modal
      open={Boolean(student)}
      onClose={onClose}
      title={student.name}
      width="max-w-md"
      footer={<Button variant="outline" size="md" className="w-full" onClick={onClose}>Close</Button>}
    >
      <p className="text-sm text-ink-faint -mt-3 mb-4">{student.registration_no}</p>

      <div className="space-y-3 mb-4">
        <div className="flex gap-2">
          <span className="text-sm font-medium text-ink-faint w-24">Email</span>
          <span className="text-sm text-ink">{student.email}</span>
        </div>
        <div className="flex gap-2">
          <span className="text-sm font-medium text-ink-faint w-24">Phone</span>
          <span className="text-sm text-ink">{student.phone || '—'}</span>
        </div>
        <div className="flex gap-2">
          <span className="text-sm font-medium text-ink-faint w-24">Batch</span>
          <span className="text-sm text-ink">{student.batch_name || '—'}</span>
        </div>
      </div>

      <div>
        <p className="text-sm font-medium text-ink mb-2">Guardians</p>
        {student.guardians?.length === 0 ? (
          <p className="text-sm text-ink-faint">No guardians linked.</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {student.guardians?.map((g) => (
              <Badge key={g.id} tone="accent">
                {g.name}{g.email ? ` · ${g.email}` : ''}{g.phone ? ` · ${g.phone}` : ''}
              </Badge>
            ))}
          </div>
        )}
      </div>
    </Modal>
  );
}
