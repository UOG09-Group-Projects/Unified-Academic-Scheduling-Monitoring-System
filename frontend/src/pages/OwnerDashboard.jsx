import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { Users, ShieldCheck, KeyRound, ArrowRight } from "lucide-react";
import api from "../services/api";
import { fetchRoles } from "../services/roleService";
import PageHeader from "../components/ui/PageHeader";
import StatCard from "../components/StatCard";
import Card from "../components/ui/Card";
import Badge from "../components/ui/Badge";
import EmptyState from "../components/ui/EmptyState";
import BarChartCard from "../components/charts/BarChartCard";
import { SkeletonRows } from "../components/ui/Skeleton";

const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  show: (i = 0) => ({
    opacity: 1, y: 0,
    transition: { duration: 0.4, delay: i * 0.06, ease: [0.22, 1, 0.36, 1] },
  }),
};

export default function OwnerDashboard() {
  const [roles, setRoles] = useState([]);
  const [managers, setManagers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let ignore = false;
    async function load() {
      try {
        const [r, m] = await Promise.all([fetchRoles(), api.get('/managers/')]);
        if (!ignore) {
          setRoles(r);
          setManagers(m.data);
        }
      } catch {
        if (!ignore) setError('Failed to load dashboard.');
      } finally {
        if (!ignore) setLoading(false);
      }
    }
    load();
    return () => { ignore = true; };
  }, []);

  if (loading) {
    return (
      <div className="p-6 max-w-5xl mx-auto">
        <SkeletonRows rows={5} />
      </div>
    );
  }
  if (error) return <div className="p-6 text-danger text-sm">{error}</div>;

  const totalPermissions = roles.reduce((sum, r) => sum + r.permissions.length, 0);
  const configuredRoles = roles.filter((r) => r.permissions.length > 0).length;
  const coverage = roles.length > 0 ? Math.round((configuredRoles / roles.length) * 100) : 0;

  const permissionsPerRole = roles.map((r) => ({
    name: r.name.charAt(0).toUpperCase() + r.name.slice(1),
    value: r.permissions.length,
  }));

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <PageHeader title="Owner dashboard" subtitle="Managers, roles and access across your institution" />

      <motion.div
        variants={fadeUp} initial="hidden" animate="show" custom={0}
        className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8"
      >
        <StatCard label="Managers" value={managers.length} tone="ocean" icon={Users} />
        <StatCard label="Roles defined" value={roles.length} tone="violet" icon={ShieldCheck} />
        <StatCard
          label="Roles with permissions set"
          value={`${coverage}%`}
          tone="accent"
          icon={KeyRound}
          progress={coverage}
          progressLabel={`${totalPermissions} permissions assigned across ${configuredRoles} of ${roles.length} roles`}
        />
      </motion.div>

      <motion.div
        variants={fadeUp} initial="hidden" animate="show" custom={1}
        className="grid grid-cols-1 lg:grid-cols-[1.2fr_1fr] gap-4"
      >
        <BarChartCard title="Permissions per role" icon={ShieldCheck} data={permissionsPerRole} color="#00A0F5" />

        <Card padding="p-0" className="overflow-hidden flex flex-col">
          <div className="flex items-center justify-between px-5 py-4 border-b border-ink/[0.06]">
            <h2 className="text-sm font-semibold text-ink">Managers</h2>
            <Link to="/managers" className="text-xs text-brand-600 hover:text-brand-700 flex items-center gap-1 font-medium">
              View all <ArrowRight size={12} />
            </Link>
          </div>
          {managers.length === 0 ? (
            <EmptyState icon={Users} title="No managers yet" />
          ) : (
            <div className="divide-y divide-ink/[0.05]">
              {managers.slice(0, 6).map((m) => (
                <div key={m.id} className="flex items-center justify-between px-5 py-3">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-ink truncate">{m.name}</p>
                    <p className="text-xs text-ink-faint truncate">{m.user?.email}</p>
                  </div>
                  <Badge tone="neutral">{m.institution?.name}</Badge>
                </div>
              ))}
            </div>
          )}
        </Card>
      </motion.div>
    </div>
  );
}
