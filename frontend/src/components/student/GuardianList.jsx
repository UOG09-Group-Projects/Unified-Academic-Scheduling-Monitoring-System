import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { UserPlus, Users, Mail, Phone } from 'lucide-react';
import Card from '../ui/Card';
import Button from '../ui/Button';
import EmptyState from '../ui/EmptyState';
import AddGuardianModal from './AddGuardianModal';

export default function GuardianList({ guardians, onChange }) {
  const [modalOpen, setModalOpen] = useState(false);

  return (
    <>
      <Card padding="p-0" className="overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-ink/[0.06]">
          <h2 className="text-sm font-semibold text-ink flex items-center gap-2">
            <Users size={15} className="text-ink-faint" />
            Guardians
          </h2>
          <Button variant="brand" size="sm" icon={UserPlus} onClick={() => setModalOpen(true)}>
            Add guardian
          </Button>
        </div>

        {guardians.length === 0 ? (
          <EmptyState
            icon={Users}
            title="No guardians linked"
            message="Add a parent or guardian so they can follow your progress."
            action={
              <Button variant="outline" size="sm" icon={UserPlus} onClick={() => setModalOpen(true)}>
                Add guardian
              </Button>
            }
          />
        ) : (
          <div className="divide-y divide-ink/[0.05]">
            <AnimatePresence initial={false}>
              {guardians.map((g) => (
                <motion.div
                  key={g.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.2 }}
                  className="px-5 py-3.5"
                >
                  <p className="text-sm font-medium text-ink">{g.name}</p>
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-0.5 mt-0.5">
                    {g.email && (
                      <span className="inline-flex items-center gap-1 text-xs text-ink-faint">
                        <Mail size={11} /> {g.email}
                      </span>
                    )}
                    {g.phone && (
                      <span className="inline-flex items-center gap-1 text-xs text-ink-faint">
                        <Phone size={11} /> {g.phone}
                      </span>
                    )}
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </Card>

      <AddGuardianModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onAdded={onChange}
      />
    </>
  );
}
