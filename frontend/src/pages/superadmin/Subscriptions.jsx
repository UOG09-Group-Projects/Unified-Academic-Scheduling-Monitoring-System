// src/pages/superadmin/Subscriptions.jsx
import { useState } from "react";
import { motion } from "framer-motion";
import {
  CreditCard, DollarSign, TrendingUp, Users, RefreshCw, Ban, CheckCircle2,
} from "lucide-react";
import PageHeader from "../../components/ui/PageHeader";
import StatCard from "../../components/StatCard";
import Card from "../../components/ui/Card";
import Badge from "../../components/ui/Badge";
import ConfirmDialog from "../../components/ui/ConfirmDialog";
import DonutChartCard from "../../components/charts/DonutChartCard";
import LineChartCard from "../../components/charts/LineChartCard";
import { useToast } from "../../components/ui/Toast";

const INITIAL_SUBSCRIPTIONS = [
  { id: 1, institution: "Riverside Academy", plan: "Enterprise", price: 499, status: "active", renewalDate: "2026-08-15", students: 1240 },
  { id: 2, institution: "Northview University", plan: "Enterprise", price: 499, status: "active", renewalDate: "2026-09-01", students: 3820 },
  { id: 3, institution: "Lakeside College", plan: "Professional", price: 199, status: "past_due", renewalDate: "2026-07-20", students: 890 },
  { id: 4, institution: "Summit Tech Institute", plan: "Starter", price: 49, status: "trial", renewalDate: "2026-07-30", students: 560 },
  { id: 5, institution: "Crestwood School", plan: "Professional", price: 199, status: "canceled", renewalDate: "2026-06-01", students: 320 },
  { id: 6, institution: "Brightpath Institute", plan: "Starter", price: 49, status: "active", renewalDate: "2026-08-05", students: 210 },
];

const MRR_TREND = [
  { name: "Feb", value: 3120 },
  { name: "Mar", value: 3340 },
  { name: "Apr", value: 3510 },
  { name: "May", value: 3680 },
  { name: "Jun", value: 3990 },
  { name: "Jul", value: 4210 },
];

const STATUS_CONFIG = {
  active:    { label: "Active",    tone: "success" },
  trial:     { label: "Trial",     tone: "warning" },
  past_due:  { label: "Past due",  tone: "danger"  },
  canceled:  { label: "Canceled",  tone: "neutral" },
};

const PLAN_TONE = { Enterprise: "ocean", Professional: "violet", Starter: "brand" };
const PLAN_DONUT_COLOR = { Enterprise: "#1A47E0", Professional: "#7C3AED", Starter: "#00A0F5" };

export default function Subscriptions() {
  const [subs, setSubs] = useState(INITIAL_SUBSCRIPTIONS);
  const [confirm, setConfirm] = useState(null); // { type: 'cancel'|'renew', sub }
  const toast = useToast();

  const active = subs.filter((s) => s.status === "active");
  const trial = subs.filter((s) => s.status === "trial");
  const pastDue = subs.filter((s) => s.status === "past_due");
  const mrr = active.reduce((sum, s) => sum + s.price, 0);

  const planDonut = ["Enterprise", "Professional", "Starter"].map((plan) => ({
    name: plan,
    value: subs.filter((s) => s.plan === plan && s.status !== "canceled").length,
    color: PLAN_DONUT_COLOR[plan],
  })).filter((d) => d.value > 0);

  const handleConfirm = () => {
    if (!confirm) return;
    const { type, sub } = confirm;

    setSubs((prev) => prev.map((s) => {
      if (s.id !== sub.id) return s;
      if (type === "cancel") return { ...s, status: "canceled" };
      if (type === "renew") return { ...s, status: "active" };
      return s;
    }));

    toast.success(
      type === "cancel"
        ? `${sub.institution}'s subscription was canceled.`
        : `${sub.institution}'s subscription was renewed.`
    );
    setConfirm(null);
  };

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <PageHeader title="Subscriptions" subtitle="Manage institution billing plans and revenue" />

      <motion.div
        initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}
        className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8"
      >
        <StatCard label="MRR" value={`$${mrr.toLocaleString()}`} tone="ocean" icon={DollarSign} />
        <StatCard label="Active" value={active.length} tone="success" icon={CheckCircle2} />
        <StatCard label="Trialing" value={trial.length} tone="warning" icon={Users} />
        <StatCard label="Past due" value={pastDue.length} tone="danger" icon={Ban} />
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.06 }}
        className="grid grid-cols-1 lg:grid-cols-[1.3fr_1fr] gap-4 mb-8"
      >
        <LineChartCard title="MRR trend (last 6 months)" icon={TrendingUp} data={MRR_TREND} color="#00A0F5" />
        <DonutChartCard title="Plan distribution" icon={CreditCard} data={planDonut} />
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.12 }}>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold text-ink">All subscriptions</h2>
          <span className="text-xs text-ink-faint">{subs.length} total</span>
        </div>

        <Card padding="p-0" className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-ink/[0.02] border-b border-ink/[0.06]">
                  {["Institution", "Plan", "Price", "Students", "Renews", "Status", ""].map((h) => (
                    <th key={h} className="px-5 py-3 text-left text-[11px] font-semibold text-ink-faint uppercase tracking-wider whitespace-nowrap">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-ink/[0.05]">
                {subs.map((s) => {
                  const status = STATUS_CONFIG[s.status];
                  return (
                    <tr key={s.id} className="hover:bg-ocean-50/40 transition-colors">
                      <td className="px-5 py-3.5 font-medium text-ink whitespace-nowrap">{s.institution}</td>
                      <td className="px-5 py-3.5"><Badge tone={PLAN_TONE[s.plan]}>{s.plan}</Badge></td>
                      <td className="px-5 py-3.5 text-ink-soft whitespace-nowrap">${s.price}/mo</td>
                      <td className="px-5 py-3.5 text-ink-faint">{s.students.toLocaleString()}</td>
                      <td className="px-5 py-3.5 text-ink-faint whitespace-nowrap">
                        {new Date(s.renewalDate).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                      </td>
                      <td className="px-5 py-3.5"><Badge tone={status.tone} dot>{status.label}</Badge></td>
                      <td className="px-5 py-3.5 text-right whitespace-nowrap">
                        {s.status === "canceled" || s.status === "past_due" ? (
                          <button
                            onClick={() => setConfirm({ type: "renew", sub: s })}
                            className="inline-flex items-center gap-1 text-xs font-medium text-success hover:text-emerald-700 transition-colors"
                          >
                            <RefreshCw size={12} /> Renew
                          </button>
                        ) : (
                          <button
                            onClick={() => setConfirm({ type: "cancel", sub: s })}
                            className="inline-flex items-center gap-1 text-xs font-medium text-danger/80 hover:text-danger transition-colors"
                          >
                            <Ban size={12} /> Cancel
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      </motion.div>

      <ConfirmDialog
        open={Boolean(confirm)}
        onClose={() => setConfirm(null)}
        onConfirm={handleConfirm}
        danger={confirm?.type === 'cancel'}
        title={confirm?.type === 'cancel' ? 'Cancel subscription?' : 'Renew subscription?'}
        message={
          confirm
            ? confirm.type === 'cancel'
              ? `${confirm.sub.institution} will lose access at the end of the current billing period.`
              : `${confirm.sub.institution}'s subscription will be reactivated immediately.`
            : ''
        }
        confirmLabel={confirm?.type === 'cancel' ? 'Cancel subscription' : 'Renew'}
      />
    </div>
  );
}
