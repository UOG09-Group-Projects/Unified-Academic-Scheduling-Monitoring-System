import { useState, useMemo } from "react";
import { ChevronDown } from "lucide-react";

const formatName = (name) =>
  name.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

// ── Reusable panel ────────────────────────────────────────────────────────────
const Panel = ({ title, items, checkedSet, setChecked, search, setSearch, count, onToggle }) => (
  <div className="flex-1 flex flex-col border border-[#D5DEEF] rounded-lg overflow-hidden">
    <div className="px-4 py-3 bg-[#F0F3FA] border-b border-[#D5DEEF] flex items-center justify-between">
      <span className="text-xs font-semibold text-[#395886] uppercase tracking-wider">
        {title}
      </span>
      <span className="text-xs text-[#638ECB] tabular-nums">{count}</span>
    </div>
    <div className="px-3 py-2 border-b border-[#D5DEEF]">
      <input
        type="text"
        placeholder="Search…"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="w-full text-sm px-2 py-1.5 border border-[#D5DEEF] rounded
                   focus:outline-none focus:border-[#638ECB] bg-white"
      />
    </div>
    <div className="flex-1 overflow-y-auto max-h-64">
      {items.length === 0 ? (
        <p className="text-xs text-gray-400 text-center py-8">No permissions</p>
      ) : (
        <ul>
          {items.map((p) => (
            <li
              key={p.id}
              onClick={() => onToggle(p.id, checkedSet, setChecked)}
              className={`flex items-center gap-2 px-4 py-2 cursor-pointer text-sm
                          select-none transition-colors ${
                checkedSet.has(p.id)
                  ? "bg-[#E8EDF7] text-[#395886]"
                  : "hover:bg-[#F7F9FC] text-gray-700"
              }`}
            >
              <div
                className={`w-4 h-4 rounded border flex-shrink-0 flex items-center
                            justify-center transition-colors ${
                  checkedSet.has(p.id)
                    ? "bg-[#395886] border-[#395886]"
                    : "border-[#B1C9EF]"
                }`}
              >
                {checkedSet.has(p.id) && (
                  <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 10 8">
                    <path
                      d="M1 4l3 3 5-6"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                )}
              </div>
              {formatName(p.name)}
            </li>
          ))}
        </ul>
      )}
    </div>
  </div>
);

// ── Main component ────────────────────────────────────────────────────────────
// groups:   [{ module: string, permissions: [{id, name}] }]
// selected: Set of permission ids
// onChange: (newSet) => void
export default function PermissionTransfer({ groups = [], selected, onChange }) {
  const [activeModule, setActiveModule] = useState("__all__");
  const [leftSearch,   setLeftSearch]   = useState("");
  const [rightSearch,  setRightSearch]  = useState("");
  const [leftChecked,  setLeftChecked]  = useState(new Set());
  const [rightChecked, setRightChecked] = useState(new Set());

  // Flat list of every permission across all modules
  const allPerms = useMemo(
    () => groups.flatMap((g) => g.permissions),
    [groups]
  );

  // Permissions that belong to the currently selected module
  const modulePerms = useMemo(() => {
    if (activeModule === "__all__") return allPerms;
    const group = groups.find((g) => g.module === activeModule);
    return group ? group.permissions : [];
  }, [activeModule, allPerms, groups]);

  // Left panel — unassigned, filtered by module + search
  const available = useMemo(
    () =>
      modulePerms.filter(
        (p) =>
          !selected.has(p.id) &&
          p.name.toLowerCase().includes(leftSearch.toLowerCase())
      ),
    [modulePerms, selected, leftSearch]
  );

  // Right panel — assigned, filtered by module + search
  // (we still show ALL assigned perms; module filter only scopes the left panel)
  const assigned = useMemo(
    () =>
      allPerms.filter(
        (p) =>
          selected.has(p.id) &&
          p.name.toLowerCase().includes(rightSearch.toLowerCase())
      ),
    [allPerms, selected, rightSearch]
  );

  // ── Helpers ────────────────────────────────────────────────────────────────
  const toggle = (id, checkedSet, setChecked) => {
    const next = new Set(checkedSet);
    next.has(id) ? next.delete(id) : next.add(id);
    setChecked(next);
  };

  const moveRight = () => {
    const next = new Set(selected);
    leftChecked.forEach((id) => next.add(id));
    onChange(next);
    setLeftChecked(new Set());
  };

  const moveLeft = () => {
    const next = new Set(selected);
    rightChecked.forEach((id) => next.delete(id));
    onChange(next);
    setRightChecked(new Set());
  };

  // "Add all" only adds what's currently visible in the left panel
  const moveAllRight = () => {
    const next = new Set(selected);
    available.forEach((p) => next.add(p.id));
    onChange(next);
    setLeftChecked(new Set());
  };

  // "Remove all" removes everything visible on the right panel
  const moveAllLeft = () => {
    const next = new Set(selected);
    assigned.forEach((p) => next.delete(p.id));
    onChange(next);
    setRightChecked(new Set());
  };

  // Reset left-panel checked state whenever the module filter changes
  const handleModuleChange = (module) => {
    setActiveModule(module);
    setLeftChecked(new Set());
    setLeftSearch("");
  };

  // ── Per-module assigned count (for badge on dropdown options) ──────────────
  const assignedCountFor = (moduleName) => {
    const group = groups.find((g) => g.module === moduleName);
    if (!group) return 0;
    return group.permissions.filter((p) => selected.has(p.id)).length;
  };

  return (
    <div className="space-y-3">
      {/* ── Module filter dropdown ─────────────────────────────────────────── */}
      <div className="flex items-center gap-2">
        <label className="text-xs text-gray-500 whitespace-nowrap">
          Filter by module
        </label>
        <div className="relative">
          <select
            value={activeModule}
            onChange={(e) => handleModuleChange(e.target.value)}
            className="appearance-none pl-3 pr-8 py-1.5 text-sm border border-[#D5DEEF]
                       rounded-lg bg-white text-[#395886] font-medium
                       focus:outline-none focus:border-[#638ECB] cursor-pointer
                       transition-colors hover:border-[#8AAEE0]"
          >
            <option value="__all__">All modules ({allPerms.length})</option>
            {groups.map((g) => {
              const count = assignedCountFor(g.module);
              return (
                <option key={g.module} value={g.module}>
                  {g.module}
                  {count > 0 ? ` (${count} assigned)` : ` (${g.permissions.length})`}
                </option>
              );
            })}
          </select>
          <ChevronDown
            size={13}
            className="absolute right-2.5 top-1/2 -translate-y-1/2
                       text-[#638ECB] pointer-events-none"
          />
        </div>

        {/* Active module pill */}
        {activeModule !== "__all__" && (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1
                           bg-[#395886]/10 text-[#395886] text-xs font-medium rounded-full">
            {activeModule}
            <button
              onClick={() => handleModuleChange("__all__")}
              className="hover:text-red-400 transition-colors leading-none"
              aria-label="Clear filter"
            >
              ×
            </button>
          </span>
        )}
      </div>

      {/* ── Transfer UI ────────────────────────────────────────────────────── */}
      <div className="flex gap-3 items-stretch">
        <Panel
          title="Available"
          items={available}
          checkedSet={leftChecked}
          setChecked={setLeftChecked}
          search={leftSearch}
          setSearch={setLeftSearch}
          count={available.length}
          onToggle={toggle}
        />

        {/* Controls */}
        <div className="flex flex-col items-center justify-center gap-2 pt-4">
          <button
            onClick={moveAllRight}
            title="Add all visible"
            className="w-8 h-8 rounded border border-[#D5DEEF] bg-white hover:bg-[#F0F3FA]
                       text-[#638ECB] flex items-center justify-center text-xs font-bold
                       transition-colors"
          >
            »
          </button>
          <button
            onClick={moveRight}
            disabled={leftChecked.size === 0}
            title="Add selected"
            className="w-8 h-8 rounded border border-[#D5DEEF] bg-white hover:bg-[#F0F3FA]
                       text-[#638ECB] flex items-center justify-center transition-colors
                       disabled:opacity-30 disabled:cursor-not-allowed"
          >
            ›
          </button>
          <button
            onClick={moveLeft}
            disabled={rightChecked.size === 0}
            title="Remove selected"
            className="w-8 h-8 rounded border border-[#D5DEEF] bg-white hover:bg-[#F0F3FA]
                       text-[#638ECB] flex items-center justify-center transition-colors
                       disabled:opacity-30 disabled:cursor-not-allowed"
          >
            ‹
          </button>
          <button
            onClick={moveAllLeft}
            title="Remove all visible"
            className="w-8 h-8 rounded border border-[#D5DEEF] bg-white hover:bg-[#F0F3FA]
                       text-[#638ECB] flex items-center justify-center text-xs font-bold
                       transition-colors"
          >
            «
          </button>
        </div>

        <Panel
          title="Assigned"
          items={assigned}
          checkedSet={rightChecked}
          setChecked={setRightChecked}
          search={rightSearch}
          setSearch={setRightSearch}
          count={assigned.length}
          onToggle={toggle}
        />
      </div>

      {/* ── Module assignment summary ──────────────────────────────────────── */}
      {selected.size > 0 && (
        <div className="flex flex-wrap gap-1.5 pt-1">
          {groups.map((g) => {
            const count = assignedCountFor(g.module);
            if (count === 0) return null;
            return (
              <span
                key={g.module}
                onClick={() => handleModuleChange(g.module)}
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full
                           bg-[#395886]/10 text-[#395886] text-[11px] font-medium
                           cursor-pointer hover:bg-[#395886]/20 transition-colors"
                title={`Click to filter by ${g.module}`}
              >
                {g.module}
                <span className="bg-[#395886] text-white rounded-full w-4 h-4
                                 flex items-center justify-center text-[10px] font-bold">
                  {count}
                </span>
              </span>
            );
          })}
        </div>
      )}
    </div>
  );
}