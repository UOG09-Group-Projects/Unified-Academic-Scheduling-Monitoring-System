import { motion } from 'framer-motion';
import { Inbox } from 'lucide-react';

export default function EmptyState({ icon: Icon = Inbox, title = 'Nothing here yet', message, action }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
      className="flex flex-col items-center justify-center text-center py-16 px-6"
    >
      <div className="w-14 h-14 rounded-3xl bg-ink/[0.04] flex items-center justify-center mb-4 text-ink-faint">
        <Icon size={20} />
      </div>
      <p className="text-sm font-semibold text-ink mb-1">{title}</p>
      {message && <p className="text-xs text-ink-faint max-w-xs mb-4">{message}</p>}
      {action}
    </motion.div>
  );
}
