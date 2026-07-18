import { motion } from 'framer-motion';
import { AlertCircle, RefreshCw } from 'lucide-react';

export default function ErrorState({ title = 'Something went wrong', message, onRetry }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
      className="flex flex-col items-center justify-center text-center py-14 px-6"
    >
      <div className="w-12 h-12 rounded-2xl bg-red-50 flex items-center justify-center mb-4 text-danger">
        <AlertCircle size={20} />
      </div>
      <p className="text-sm font-semibold text-ink mb-1">{title}</p>
      {message && <p className="text-xs text-ink-faint max-w-xs mb-4">{message}</p>}
      {onRetry && (
        <button
          onClick={onRetry}
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-medium text-brand-700 border border-brand-200 hover:bg-brand-50 transition-colors"
        >
          <RefreshCw size={12} /> Try again
        </button>
      )}
    </motion.div>
  );
}
