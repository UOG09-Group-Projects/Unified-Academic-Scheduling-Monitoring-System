// Shared "frosted glass" tooltip for all chart cards — stays dark regardless
// of theme (a common, high-contrast pattern for floating chart overlays),
// but softened with blur/border/shadow to match the app's glass-card look
// rather than a flat solid chip.
export default function ChartTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;

  // Category charts (bar/line) already show the category as the header
  // `label` above, so a single series showing its name too would just
  // repeat the literal dataKey ("value") — skip it. But once there's more
  // than one series (a stacked/grouped chart), each row needs its own name
  // or the reader has nothing but color to tell them apart.
  const showName = !label || payload.length > 1;

  return (
    <div className="min-w-[120px] rounded-xl border border-white/10 bg-[#12141C]/90 backdrop-blur-md px-3.5 py-2.5 shadow-lift">
      {label && <p className="text-[11px] font-medium text-white/60 mb-1">{label}</p>}
      <div className="space-y-1">
        {payload.map((p, i) => (
          <div key={i} className="flex items-center gap-2">
            <span
              className="w-2 h-2 rounded-full shrink-0"
              style={{ backgroundColor: p.color ?? p.payload?.color ?? p.fill }}
            />
            {showName && <span className="text-xs text-white/80 truncate">{p.name}</span>}
            <span className={`text-xs font-semibold text-white tabular-nums ${showName ? '' : 'ml-auto'}`}>{p.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
