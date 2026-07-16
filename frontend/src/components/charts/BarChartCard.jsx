import { motion } from 'framer-motion';
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid,
} from 'recharts';
import Card from '../ui/Card';
import EmptyState from '../ui/EmptyState';
import { BarChart3 } from 'lucide-react';

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
export default function BarChartCard({ title, icon: Icon = BarChart3, data = [], color = '#00A0F5', height = 220 }) {
  return (
    <Card>
      <h2 className="text-sm font-semibold text-ink mb-4 flex items-center gap-2">
        <Icon className="w-4 h-4 text-ink-faint" />
        {title}
      </h2>

      {data.length === 0 ? (
        <EmptyState icon={Icon} title="No data yet" />
      ) : (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          style={{ width: '100%', height }}
        >
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(18,20,28,0.06)" />
              <XAxis
                dataKey="name"
                tick={{ fontSize: 11, fill: '#6B7080' }}
                axisLine={{ stroke: 'rgba(18,20,28,0.08)' }}
                tickLine={false}
                interval={0}
                angle={data.length > 5 ? -25 : 0}
                textAnchor={data.length > 5 ? 'end' : 'middle'}
                height={data.length > 5 ? 46 : 24}
              />
              <YAxis tick={{ fontSize: 11, fill: '#6B7080' }} axisLine={false} tickLine={false} allowDecimals={false} />
              <Tooltip content={<ChartTooltip />} cursor={{ fill: 'rgba(0,160,245,0.06)' }} />
              <Bar dataKey="value" fill={color} radius={[6, 6, 0, 0]} maxBarSize={38} />
            </BarChart>
          </ResponsiveContainer>
        </motion.div>
      )}
    </Card>
  );
}
