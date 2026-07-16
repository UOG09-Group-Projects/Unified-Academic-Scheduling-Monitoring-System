// src/pages/superadmin/Institutions.jsx
import { useState } from "react";
import {
  Search, Plus,  Building2,
  Users, BookOpen, CheckCircle, XCircle, Clock,
  Eye, Trash2, Ban, RefreshCw, CreditCard, AlertTriangle, X, Download, Mail
} from "lucide-react";

const INSTITUTIONS = [
  {
    id: 1,
    name: "Riverside Academy",
    email: "admin@riverside.edu",
    contactPerson: "Dr. Sarah Mitchell",
    phone: "+1 (555) 012-3456",
    address: "123 River Rd, Portland, OR 97201",
    students: 1240,
    courses: 48,
    instructors: 36,
    status: "active",
    plan: "Enterprise",
    planPrice: "$499/mo",
    subscriptionStart: "2024-01-15",
    subscriptionEnd: "2025-01-15",
    joinedDate: "2024-01-15",
    lastActive: "2 hours ago",
    revenue: "$5,988",
    avatar: "RA",
    color: "#395886",
  },
  {
    id: 2,
    name: "Northview University",
    email: "contact@northview.edu",
    contactPerson: "Prof. James Carter",
    phone: "+1 (555) 234-5678",
    address: "456 North Ave, Seattle, WA 98101",
    students: 3820,
    courses: 124,
    instructors: 89,
    status: "active",
    plan: "Enterprise",
    planPrice: "$499/mo",
    subscriptionStart: "2023-08-01",
    subscriptionEnd: "2024-08-01",
    joinedDate: "2023-08-01",
    lastActive: "5 mins ago",
    revenue: "$4,990",
    avatar: "NU",
    color: "#4a7c59",
  },
  {
    id: 3,
    name: "Lakeside College",
    email: "info@lakeside.edu",
    contactPerson: "Ms. Patricia Wong",
    phone: "+1 (555) 345-6789",
    address: "789 Lake Dr, Chicago, IL 60601",
    students: 890,
    courses: 32,
    instructors: 24,
    status: "suspended",
    plan: "Professional",
    planPrice: "$199/mo",
    subscriptionStart: "2023-11-01",
    subscriptionEnd: "2024-11-01",
    joinedDate: "2023-11-01",
    lastActive: "3 days ago",
    revenue: "$2,388",
    avatar: "LC",
    color: "#8b5e3c",
  },
  {
    id: 4,
    name: "Summit Tech Institute",
    email: "hello@summittech.edu",
    contactPerson: "Mr. David Kim",
    phone: "+1 (555) 456-7890",
    address: "321 Summit Blvd, Austin, TX 78701",
    students: 560,
    courses: 21,
    instructors: 15,
    status: "trial",
    plan: "Starter",
    planPrice: "$49/mo",
    subscriptionStart: "2024-06-01",
    subscriptionEnd: "2024-06-30",
    joinedDate: "2024-06-01",
    lastActive: "1 hour ago",
    revenue: "$0",
    avatar: "ST",
    color: "#7b4f9e",
  },
  {
    id: 5,
    name: "Crestwood School",
    email: "admin@crestwood.edu",
    contactPerson: "Dr. Angela Brooks",
    phone: "+1 (555) 567-8901",
    address: "654 Crest Way, Denver, CO 80201",
    students: 320,
    courses: 18,
    instructors: 12,
    status: "expired",
    plan: "Professional",
    planPrice: "$199/mo",
    subscriptionStart: "2023-06-01",
    subscriptionEnd: "2024-06-01",
    joinedDate: "2023-06-01",
    lastActive: "12 days ago",
    revenue: "$2,388",
    avatar: "CW",
    color: "#c0392b",
  },
];

const STATUS_CONFIG = {
  active: {
    label: "Active",
    bg: "bg-emerald-50",
    text: "text-emerald-700",
    dot: "bg-emerald-500",
    icon: CheckCircle,
  },
  suspended: {
    label: "Suspended",
    bg: "bg-red-50",
    text: "text-red-700",
    dot: "bg-red-500",
    icon: Ban,
  },
  trial: {
    label: "Trial",
    bg: "bg-amber-50",
    text: "text-amber-700",
    dot: "bg-amber-500",
    icon: Clock,
  },
  expired: {
    label: "Expired",
    bg: "bg-gray-100",
    text: "text-gray-600",
    dot: "bg-gray-400",
    icon: XCircle,
  },
};

const PLAN_CONFIG = {
  Enterprise: { bg: "bg-brand-600/10", text: "text-brand-700" },
  Professional: { bg: "bg-purple-50", text: "text-purple-700" },
  Starter: { bg: "bg-sky-50", text: "text-sky-700" },
};

// ─── Confirm Dialog ──────────────────────────────────────────────
function ConfirmDialog({ open, title, message, confirmLabel, confirmClass, onConfirm, onCancel }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onCancel} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 animate-fade-in">
        <div className="flex items-start gap-4">
          <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center shrink-0">
            <AlertTriangle className="w-5 h-5 text-red-600" />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-ink">{title}</h3>
            <p className="text-sm text-ink-faint mt-1">{message}</p>
          </div>
        </div>
        <div className="flex gap-3 mt-6 justify-end">
          <button
            onClick={onCancel}
            className="px-4 py-2 rounded-lg text-sm font-medium text-ink-soft border border-ink/10 hover:bg-ink/[0.03] transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className={`px-4 py-2 rounded-lg text-sm font-medium text-white transition-colors ${confirmClass}`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Institution Detail Modal ────────────────────────────────────
function InstitutionModal({ institution, onClose, onAction }) {
  if (!institution) return null;
  const status = STATUS_CONFIG[institution.status];
  const plan = PLAN_CONFIG[institution.plan] || PLAN_CONFIG.Starter;
  //const StatusIcon = status.icon;

  const daysLeft = () => {
    const end = new Date(institution.subscriptionEnd);
    const now = new Date();
    const diff = Math.ceil((end - now) / (1000 * 60 * 60 * 24));
    return diff;
  };
  const days = daysLeft();

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto animate-fade-in">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-ink/[0.06] px-6 py-4 flex items-center justify-between z-10 rounded-t-2xl">
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold text-sm"
              style={{ backgroundColor: institution.color }}
            >
              {institution.avatar}
            </div>
            <div>
              <h2 className="text-lg font-semibold text-ink">{institution.name}</h2>
              <p className="text-xs text-ink-faint">{institution.email}</p>
            </div>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-lg hover:bg-gray-100 flex items-center justify-center text-ink-faint hover:text-gray-600 transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Status + Plan */}
          <div className="flex flex-wrap gap-3">
            <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium ${status.bg} ${status.text}`}>
              <span className={`w-1.5 h-1.5 rounded-full ${status.dot}`} />
              {status.label}
            </span>
            <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium ${plan.bg} ${plan.text}`}>
              <CreditCard className="w-3.5 h-3.5" />
              {institution.plan} Plan · {institution.planPrice}
            </span>
          </div>

          {/* Stats row */}
          <div className="grid grid-cols-3 gap-4">
            {[
              { icon: Users, label: "Students", value: institution.students.toLocaleString() },
              { icon: BookOpen, label: "Courses", value: institution.courses },
              { icon: Building2, label: "Instructors", value: institution.instructors },
            ].map(({ icon: Icon, label, value }) => (
              <div key={label} className="bg-paper-soft rounded-xl p-4 text-center">
                <Icon className="w-5 h-5 text-brand-700 mx-auto mb-1" />
                <p className="text-xl font-bold text-ink">{value}</p>
                <p className="text-xs text-ink-faint mt-0.5">{label}</p>
              </div>
            ))}
          </div>

          {/* Subscription details */}
          <div className="border border-ink/[0.06] rounded-xl p-4 space-y-3">
            <h3 className="text-sm font-semibold text-ink-soft flex items-center gap-2">
              <CreditCard className="w-4 h-4" /> Subscription Details
            </h3>
            <div className="grid grid-cols-2 gap-y-3 text-sm">
              <div>
                <p className="text-ink-faint">Start Date</p>
                <p className="font-medium text-ink">{new Date(institution.subscriptionStart).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</p>
              </div>
              <div>
                <p className="text-ink-faint">End Date</p>
                <p className="font-medium text-ink">{new Date(institution.subscriptionEnd).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</p>
              </div>
              <div>
                <p className="text-ink-faint">Total Revenue</p>
                <p className="font-medium text-ink">{institution.revenue}</p>
              </div>
              <div>
                <p className="text-ink-faint">Days Remaining</p>
                <p className={`font-medium ${days < 0 ? "text-red-600" : days < 30 ? "text-amber-600" : "text-emerald-600"}`}>
                  {days < 0 ? `Expired ${Math.abs(days)}d ago` : `${days} days`}
                </p>
              </div>
            </div>
            {/* Subscription progress bar */}
            {days >= 0 && (
              <div>
                <div className="flex justify-between text-xs text-ink-faint mb-1">
                  <span>Subscription period</span>
                  <span>{Math.max(0, Math.min(100, Math.round((1 - days / 365) * 100)))}% used</span>
                </div>
                <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-brand-600 rounded-full transition-all"
                    style={{ width: `${Math.max(0, Math.min(100, Math.round((1 - days / 365) * 100)))}%` }}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Contact info */}
          <div className="border border-ink/[0.06] rounded-xl p-4 space-y-3">
            <h3 className="text-sm font-semibold text-ink-soft">Contact Information</h3>
            <div className="grid grid-cols-1 gap-2 text-sm">
              {[
                { label: "Contact Person", value: institution.contactPerson },
                { label: "Phone", value: institution.phone },
                { label: "Address", value: institution.address },
                { label: "Last Active", value: institution.lastActive },
                { label: "Joined", value: new Date(institution.joinedDate).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" }) },
              ].map(({ label, value }) => (
                <div key={label} className="flex justify-between">
                  <span className="text-ink-faint">{label}</span>
                  <span className="font-medium text-ink text-right max-w-[60%]">{value}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex flex-wrap gap-3">
            <button
              onClick={() => onAction("email", institution)}
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-brand-700 border border-brand-200 hover:bg-brand-600/5 transition-colors"
            >
              <Mail className="w-4 h-4" /> Email Institution
            </button>
            <button
              onClick={() => onAction("renew", institution)}
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-emerald-700 border border-emerald-200 hover:bg-emerald-50 transition-colors"
            >
              <RefreshCw className="w-4 h-4" /> Renew Subscription
            </button>
            {institution.status === "active" ? (
              <button
                onClick={() => { onAction("suspend", institution); onClose(); }}
                className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-amber-700 border border-amber-200 hover:bg-amber-50 transition-colors"
              >
                <Ban className="w-4 h-4" /> Suspend
              </button>
            ) : institution.status === "suspended" ? (
              <button
                onClick={() => { onAction("activate", institution); onClose(); }}
                className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-emerald-700 border border-emerald-200 hover:bg-emerald-50 transition-colors"
              >
                <CheckCircle className="w-4 h-4" /> Activate
              </button>
            ) : null}
            <button
              onClick={() => { onAction("delete", institution); onClose(); }}
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-red-700 border border-red-200 hover:bg-red-50 transition-colors ml-auto"
            >
              <Trash2 className="w-4 h-4" /> Remove Institution
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Main Page ───────────────────────────────────────────────────
export default function Institutions() {
  const [institutions, setInstitutions] = useState(INSTITUTIONS);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [planFilter, setPlanFilter] = useState("all");
  const [selectedInstitution, setSelectedInstitution] = useState(null);
  const [confirm, setConfirm] = useState(null); // { type, institution }
  const [toast, setToast] = useState(null);

  const showToast = (message, type = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  const filtered = institutions.filter((i) => {
    const matchSearch =
      i.name.toLowerCase().includes(search.toLowerCase()) ||
      i.email.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === "all" || i.status === statusFilter;
    const matchPlan = planFilter === "all" || i.plan === planFilter;
    return matchSearch && matchStatus && matchPlan;
  });

  const handleAction = (type, institution) => {
    if (type === "delete") {
      setConfirm({ type: "delete", institution });
    } else if (type === "suspend") {
      setConfirm({ type: "suspend", institution });
    } else if (type === "activate") {
      setInstitutions((prev) =>
        prev.map((i) => i.id === institution.id ? { ...i, status: "active" } : i)
      );
      showToast(`${institution.name} has been activated.`);
    } else if (type === "renew") {
      showToast(`Renewal email sent to ${institution.email}.`);
    } else if (type === "email") {
      showToast(`Email drafted for ${institution.name}.`);
    }
  };

  const handleConfirm = () => {
    if (!confirm) return;
    if (confirm.type === "delete") {
      setInstitutions((prev) => prev.filter((i) => i.id !== confirm.institution.id));
      showToast(`${confirm.institution.name} has been removed.`, "error");
    } else if (confirm.type === "suspend") {
      setInstitutions((prev) =>
        prev.map((i) => i.id === confirm.institution.id ? { ...i, status: "suspended" } : i)
      );
      showToast(`${confirm.institution.name} has been suspended.`, "warning");
    }
    setConfirm(null);
  };

  const stats = {
    total: institutions.length,
    active: institutions.filter((i) => i.status === "active").length,
    suspended: institutions.filter((i) => i.status === "suspended").length,
    trial: institutions.filter((i) => i.status === "trial").length,
    expired: institutions.filter((i) => i.status === "expired").length,
  };

  return (
    <div className="min-h-screen bg-paper-soft p-4 md:p-8">
      {/* Toast */}
      {toast && (
        <div className={`fixed top-5 right-5 z-50 flex items-center gap-3 px-4 py-3 rounded-xl shadow-lg text-sm font-medium text-white animate-fade-in
          ${toast.type === "error" ? "bg-red-500" : toast.type === "warning" ? "bg-amber-500" : "bg-emerald-500"}`}>
          {toast.type === "error" ? <Trash2 className="w-4 h-4" /> : toast.type === "warning" ? <Ban className="w-4 h-4" /> : <CheckCircle className="w-4 h-4" />}
          {toast.message}
        </div>
      )}

      {/* Confirm Dialog */}
      <ConfirmDialog
        open={!!confirm}
        title={confirm?.type === "delete" ? "Remove Institution" : "Suspend Institution"}
        message={
          confirm?.type === "delete"
            ? `This will permanently delete "${confirm?.institution?.name}" and all associated data including ${confirm?.institution?.students} students and ${confirm?.institution?.courses} courses. This action cannot be undone.`
            : `Suspending "${confirm?.institution?.name}" will prevent all ${confirm?.institution?.students} students from accessing the platform. You can reactivate later.`
        }
        confirmLabel={confirm?.type === "delete" ? "Yes, Remove" : "Yes, Suspend"}
        confirmClass={confirm?.type === "delete" ? "bg-red-600 hover:bg-red-700" : "bg-amber-600 hover:bg-amber-700"}
        onConfirm={handleConfirm}
        onCancel={() => setConfirm(null)}
      />

      {/* Detail Modal */}
      <InstitutionModal
        institution={selectedInstitution}
        onClose={() => setSelectedInstitution(null)}
        onAction={handleAction}
      />

      {/* Page Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-2xl font-bold text-ink">Institutions</h1>
            <p className="text-sm text-ink-faint mt-1">Manage all registered institutions and their subscriptions</p>
          </div>
          <div className="flex gap-3">
            <button className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium text-ink-soft bg-white border border-ink/10 hover:bg-ink/[0.03] shadow-sm transition-colors">
              <Download className="w-4 h-4" /> Export
            </button>
            <button className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium text-white bg-brand-600 hover:bg-brand-700 shadow-sm transition-colors">
              <Plus className="w-4 h-4" /> Add Institution
            </button>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {[
          { label: "Total", value: stats.total, color: "text-ink", bg: "bg-white" },
          { label: "Active", value: stats.active, color: "text-emerald-600", bg: "bg-white" },
          { label: "Suspended", value: stats.suspended, color: "text-red-600", bg: "bg-white" },
          { label: "Trial / Expired", value: `${stats.trial} / ${stats.expired}`, color: "text-amber-600", bg: "bg-white" },
        ].map(({ label, value, color, bg }) => (
          <div key={label} className={`${bg} rounded-2xl p-5 shadow-sm border border-ink/[0.06]`}>
            <p className="text-sm text-ink-faint font-medium">{label}</p>
            <p className={`text-3xl font-bold mt-1 ${color}`}>{value}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl shadow-sm border border-ink/[0.06] p-4 mb-6">
        <div className="flex flex-wrap gap-3">
          <div className="relative flex-1 min-w-[220px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-faint" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search institutions…"
              className="w-full pl-9 pr-4 py-2.5 text-sm rounded-xl border border-ink/10 focus:outline-none focus:ring-2 focus:ring-[#395886]/30 bg-paper-soft"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2.5 text-sm rounded-xl border border-ink/10 bg-paper-soft focus:outline-none focus:ring-2 focus:ring-[#395886]/30 text-ink-soft"
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="suspended">Suspended</option>
            <option value="trial">Trial</option>
            <option value="expired">Expired</option>
          </select>
          <select
            value={planFilter}
            onChange={(e) => setPlanFilter(e.target.value)}
            className="px-3 py-2.5 text-sm rounded-xl border border-ink/10 bg-paper-soft focus:outline-none focus:ring-2 focus:ring-[#395886]/30 text-ink-soft"
          >
            <option value="all">All Plans</option>
            <option value="Enterprise">Enterprise</option>
            <option value="Professional">Professional</option>
            <option value="Starter">Starter</option>
          </select>
        </div>
      </div>

      {/* Institutions Table / Cards */}
      <div className="bg-white rounded-2xl shadow-sm border border-ink/[0.06] overflow-hidden">
        {/* Desktop Table */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-ink/[0.06] bg-paper-soft/60">
                <th className="text-left px-6 py-3.5 text-xs font-semibold text-ink-faint uppercase tracking-wider">Institution</th>
                <th className="text-left px-4 py-3.5 text-xs font-semibold text-ink-faint uppercase tracking-wider">Plan</th>
                <th className="text-left px-4 py-3.5 text-xs font-semibold text-ink-faint uppercase tracking-wider">Students</th>
                <th className="text-left px-4 py-3.5 text-xs font-semibold text-ink-faint uppercase tracking-wider">Courses</th>
                <th className="text-left px-4 py-3.5 text-xs font-semibold text-ink-faint uppercase tracking-wider">Subscription</th>
                <th className="text-left px-4 py-3.5 text-xs font-semibold text-ink-faint uppercase tracking-wider">Status</th>
                <th className="px-4 py-3.5" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-16 text-ink-faint">
                    <Building2 className="w-10 h-10 mx-auto mb-3 opacity-30" />
                    <p className="font-medium">No institutions found</p>
                  </td>
                </tr>
              ) : filtered.map((inst) => {
                const status = STATUS_CONFIG[inst.status];
                const plan = PLAN_CONFIG[inst.plan] || PLAN_CONFIG.Starter;
                return (
                  <tr key={inst.id} className="hover:bg-paper-soft/40 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div
                          className="w-9 h-9 rounded-xl flex items-center justify-center text-white font-bold text-xs shrink-0"
                          style={{ backgroundColor: inst.color }}
                        >
                          {inst.avatar}
                        </div>
                        <div>
                          <p className="font-semibold text-ink">{inst.name}</p>
                          <p className="text-xs text-ink-faint">{inst.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <span className={`px-2.5 py-1 rounded-lg text-xs font-semibold ${plan.bg} ${plan.text}`}>
                        {inst.plan}
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-1.5 text-ink-soft">
                        <Users className="w-3.5 h-3.5 text-ink-faint" />
                        {inst.students.toLocaleString()}
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-1.5 text-ink-soft">
                        <BookOpen className="w-3.5 h-3.5 text-ink-faint" />
                        {inst.courses}
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <p className="text-ink-soft font-medium">{inst.planPrice}</p>
                      <p className="text-xs text-ink-faint">Ends {new Date(inst.subscriptionEnd).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</p>
                    </td>
                    <td className="px-4 py-4">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${status.bg} ${status.text}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${status.dot}`} />
                        {status.label}
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => setSelectedInstitution(inst)}
                          className="p-1.5 rounded-lg hover:bg-brand-600/10 text-brand-700 transition-colors"
                          title="View details"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleAction("suspend", inst)}
                          className="p-1.5 rounded-lg hover:bg-amber-50 text-amber-600 transition-colors"
                          title="Suspend"
                        >
                          <Ban className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleAction("delete", inst)}
                          className="p-1.5 rounded-lg hover:bg-red-50 text-red-500 transition-colors"
                          title="Remove"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Mobile Cards */}
        <div className="md:hidden divide-y divide-gray-100">
          {filtered.length === 0 ? (
            <div className="text-center py-16 text-ink-faint">
              <Building2 className="w-10 h-10 mx-auto mb-3 opacity-30" />
              <p className="font-medium">No institutions found</p>
            </div>
          ) : filtered.map((inst) => {
            const status = STATUS_CONFIG[inst.status];
            const plan = PLAN_CONFIG[inst.plan] || PLAN_CONFIG.Starter;
            return (
              <div key={inst.id} className="p-4 hover:bg-paper-soft/40 transition-colors">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold text-sm shrink-0"
                      style={{ backgroundColor: inst.color }}
                    >
                      {inst.avatar}
                    </div>
                    <div>
                      <p className="font-semibold text-ink">{inst.name}</p>
                      <p className="text-xs text-ink-faint">{inst.email}</p>
                    </div>
                  </div>
                  <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${status.bg} ${status.text} shrink-0`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${status.dot}`} />
                    {status.label}
                  </span>
                </div>
                <div className="flex items-center gap-4 mt-3 text-xs text-ink-faint">
                  <span className="flex items-center gap-1"><Users className="w-3 h-3" />{inst.students.toLocaleString()}</span>
                  <span className="flex items-center gap-1"><BookOpen className="w-3 h-3" />{inst.courses} courses</span>
                  <span className={`px-2 py-0.5 rounded-md font-medium ${plan.bg} ${plan.text}`}>{inst.plan}</span>
                </div>
                <div className="flex gap-2 mt-3">
                  <button
                    onClick={() => setSelectedInstitution(inst)}
                    className="flex-1 py-2 rounded-lg text-xs font-medium text-brand-700 border border-brand-200 hover:bg-brand-600/5 transition-colors flex items-center justify-center gap-1"
                  >
                    <Eye className="w-3.5 h-3.5" /> View Details
                  </button>
                  <button
                    onClick={() => handleAction("delete", inst)}
                    className="px-3 py-2 rounded-lg text-xs font-medium text-red-600 border border-red-100 hover:bg-red-50 transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-ink/[0.06] bg-paper-soft/40 flex items-center justify-between text-xs text-ink-faint">
          <span>Showing {filtered.length} of {institutions.length} institutions</span>
          <span>{stats.active} active · {stats.suspended} suspended</span>
        </div>
      </div>
    </div>
  );
}