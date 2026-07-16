import { motion } from 'framer-motion';
import {
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid,
} from 'recharts';
import Card from '../ui/Card';
import { TrendingUp } from 'lucide-react';

function ChartTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-ink text-white text-xs rounded-lg px-3 py-2 shadow-lift">
      <p className="font-semibold mb-0.5">{label}</p>
      <p className="text-white/80">{payload[0].value}</p>
    </div>
  );
}

/**
 * data: [{ name, value }]
 */
export default function LineChartCard({ title, icon: Icon = TrendingUp, data = [], color = '#00A0F5', height = 220 }) {
  return (
    <Card>
      <h2 className="text-sm font-semibold text-ink mb-4 flex items-center gap-2">
        <Icon className="w-4 h-4 text-ink-faint" />
        {title}
      </h2>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        style={{ width: '100%', height }}
      >
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="lineFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={color} stopOpacity={0.35} />
                <stop offset="100%" stopColor={color} stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(18,20,28,0.06)" />
            <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#6B7080' }} axisLine={{ stroke: 'rgba(18,20,28,0.08)' }} tickLine={false} />
            <YAxis tick={{ fontSize: 11, fill: '#6B7080' }} axisLine={false} tickLine={false} />
            <Tooltip content={<ChartTooltip />} />
            <Area type="monotone" dataKey="value" stroke={color} strokeWidth={2.5} fill="url(#lineFill)" />
          </AreaChart>
        </ResponsiveContainer>
      </motion.div>
    </Card>
  );
}
