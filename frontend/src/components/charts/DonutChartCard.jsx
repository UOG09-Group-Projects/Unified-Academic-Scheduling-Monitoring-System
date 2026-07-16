import { motion } from 'framer-motion';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from 'recharts';
import Card from '../ui/Card';
import EmptyState from '../ui/EmptyState';
import { PieChart as PieIcon } from 'lucide-react';

function ChartTooltip({ active, payload }) {
  if (!active || !payload?.length) return null;
  const p = payload[0];
  return (
    <div className="bg-ink text-white text-xs rounded-lg px-3 py-2 shadow-lift">
      <p className="font-semibold">{p.name}</p>
      <p className="text-white/80">{p.value}</p>
    </div>
  );
}

/**
 * data: [{ name, value, color }]
 */
export default function DonutChartCard({ title, icon: Icon = PieIcon, data = [], height = 220 }) {
  const total = data.reduce((s, d) => s + d.value, 0);

  return (
    <Card>
      <h2 className="text-sm font-semibold text-ink mb-4 flex items-center gap-2">
        <Icon className="w-4 h-4 text-ink-faint" />
        {title}
      </h2>

      {total === 0 ? (
        <EmptyState icon={Icon} title="No data yet" />
      ) : (
        <div className="flex items-center gap-6 flex-wrap">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4 }}
            style={{ width: height, height }}
            className="shrink-0 relative"
          >
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data}
                  dataKey="value"
                  nameKey="name"
                  innerRadius="62%"
                  outerRadius="90%"
                  paddingAngle={2}
                  strokeWidth={0}
                >
                  {data.map((d, i) => (
                    <Cell key={i} fill={d.color} />
                  ))}
                </Pie>
                <Tooltip content={<ChartTooltip />} />
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-2xl font-display font-bold text-ink">{total}</span>
              <span className="text-[10px] text-ink-faint uppercase tracking-wide">Total</span>
            </div>
          </motion.div>

          <div className="flex flex-col gap-2 flex-1 min-w-[140px]">
            {data.map((d) => (
              <div key={d.name} className="flex items-center justify-between gap-3 text-sm">
                <span className="flex items-center gap-2 text-ink-soft">
                  <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: d.color }} />
                  {d.name}
                </span>
                <span className="font-semibold text-ink">{d.value}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </Card>
  );
}
