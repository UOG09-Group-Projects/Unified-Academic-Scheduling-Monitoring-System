// src/pages/superadmin/Settings.jsx
import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Globe, Shield, Server, Save, RefreshCw, ArrowRight, Eye,
} from "lucide-react";
import platformSettingsService from "../../services/platformSettingsService";
import { useToast } from "../../components/ui/Toast";
import { usePermissions } from "../../auth/PermissionsContext";
import ConfirmDialog from "../../components/ui/ConfirmDialog";
import Button from "../../components/ui/Button";
import { SkeletonRows } from "../../components/ui/Skeleton";

const TABS = [
  { id: "general", label: "General", icon: Globe },
  { id: "security", label: "Security", icon: Shield },
  { id: "system", label: "System", icon: Server },
  { id: "impersonate", label: "Impersonate", icon: Eye },
];

const ROLE_DASHBOARD_PATH = {
  OWNER: '/dashboard/owner',
  MANAGER: '/dashboard/manager',
  EDUCATOR: '/dashboard/educator',
  STUDENT: '/dashboard/student',
  PARENT: '/dashboard/parent',
};

function SectionCard({ title, description, children }) {
  return (
    <div className="bg-surface rounded-2xl shadow-sm border border-ink/[0.06] overflow-hidden">
      {(title || description) && (
        <div className="px-6 py-4 border-b border-ink/[0.06]">
          {title && <h3 className="text-base font-semibold text-ink">{title}</h3>}
          {description && <p className="text-sm text-ink-faint mt-0.5">{description}</p>}
        </div>
      )}
      <div className="p-6">{children}</div>
    </div>
  );
}

function ToggleRow({ label, description, checked, onChange }) {
  return (
    <div className="flex items-center justify-between py-3 border-b border-ink/[0.04] last:border-0">
      <div>
        <p className="text-sm font-medium text-ink">{label}</p>
        {description && <p className="text-xs text-ink-faint mt-0.5">{description}</p>}
      </div>
      <button
        onClick={() => onChange(!checked)}
        className={`relative w-11 h-6 rounded-full transition-colors shrink-0 ml-4 ${checked ? "bg-brand-600" : "bg-ink/10"}`}
      >
        <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-surface rounded-full shadow transition-transform ${checked ? "translate-x-5" : "translate-x-0"}`} />
      </button>
    </div>
  );
}

function InputRow({ label, description, value, onChange, type = "text", placeholder }) {
  return (
    <div className="py-3 border-b border-ink/[0.04] last:border-0">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div className="min-w-0">
          <p className="text-sm font-medium text-ink">{label}</p>
          {description && <p className="text-xs text-ink-faint mt-0.5">{description}</p>}
        </div>
        <input
          type={type}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          className="w-full sm:w-64 px-3 py-2 text-sm rounded-xl border border-ink/10 bg-paper-soft focus:outline-none focus:ring-2 focus:ring-[#395886]/30"
        />
      </div>
    </div>
  );
}

function InfoRow({ label, value }) {
  return (
    <div className="flex items-center justify-between py-2 border-b border-ink/[0.04] last:border-0">
      <span className="text-sm text-ink-faint">{label}</span>
      <span className="text-sm font-medium text-ink font-mono">{value}</span>
    </div>
  );
}

export default function Settings() {
  const toast = useToast();
  const navigate = useNavigate();
  const { startImpersonation } = usePermissions();
  const [activeTab, setActiveTab] = useState("general");
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [resetOpen, setResetOpen] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [impersonateEmail, setImpersonateEmail] = useState('');
  const [impersonating, setImpersonating] = useState(false);

  const fetchSettings = async () => {
    setLoading(true);
    try {
      setSettings(await platformSettingsService.get());
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchSettings(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const setField = (key, value) => setSettings((prev) => ({ ...prev, [key]: value }));

  const save = async (payload, successMessage) => {
    setSaving(true);
    try {
      const data = await platformSettingsService.update(payload);
      setSettings((prev) => ({ ...prev, ...data }));
      toast.success(successMessage);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleReset = async () => {
    setResetting(true);
    try {
      const data = await platformSettingsService.reset();
      setSettings((prev) => ({ ...prev, ...data }));
      toast.success('Settings reset to defaults.');
      setResetOpen(false);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setResetting(false);
    }
  };

  const handleImpersonate = async (e) => {
    e.preventDefault();
    setImpersonating(true);
    try {
      const target = await startImpersonation(impersonateEmail.trim());
      toast.success(`Now viewing as ${target.username}.`);
      navigate(ROLE_DASHBOARD_PATH[target.role?.toUpperCase()] || '/');
    } catch (err) {
      toast.error(err.message);
    } finally {
      setImpersonating(false);
    }
  };

  if (loading || !settings) {
    return (
      <div className="min-h-screen bg-paper-soft p-4 md:p-8">
        <div className="max-w-5xl mx-auto"><SkeletonRows rows={6} /></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-paper-soft p-4 md:p-8">
      <div className="max-w-5xl mx-auto">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-ink">Platform Settings</h1>
          <p className="text-sm text-ink-faint mt-1">
            Configure platform-wide settings.
            {settings.updated_by && (
              <> Last changed by <span className="font-medium">{settings.updated_by}</span> on{' '}
              {new Date(settings.updated_at).toLocaleString()}.</>
            )}
          </p>
        </div>

        <div className="flex gap-6 flex-col md:flex-row">
          <div className="md:w-52 shrink-0">
            <div className="bg-surface rounded-2xl shadow-sm border border-ink/[0.06] p-2 md:sticky md:top-6">
              {TABS.map(({ id, label, icon: Icon }) => (
                <button
                  key={id}
                  onClick={() => setActiveTab(id)}
                  className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors text-left ${
                    activeTab === id
                      ? "bg-brand-600 text-white"
                      : "text-ink-soft hover:bg-paper-soft hover:text-ink"
                  }`}
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  {label}
                </button>
              ))}
            </div>
          </div>

          <div className="flex-1 space-y-5">

            {/* ── General ── */}
            {activeTab === "general" && (
              <>
                <SectionCard title="Platform Identity" description="Shown on the settings page and used for the site's support contact">
                  <div className="space-y-0">
                    <InputRow
                      label="Platform Name"
                      value={settings.platform_name}
                      onChange={(e) => setField('platform_name', e.target.value)}
                      placeholder="LightLearn"
                    />
                    <InputRow
                      label="Support Email"
                      type="email"
                      value={settings.support_email}
                      onChange={(e) => setField('support_email', e.target.value)}
                      placeholder="support@example.com"
                    />
                  </div>
                </SectionCard>

                <SectionCard title="Registration & Access" description="Control who can reach the platform">
                  <ToggleRow
                    label="Open Registration"
                    description="Allow new institutions to register from the public landing page"
                    checked={settings.registration_open}
                    onChange={(v) => setField('registration_open', v)}
                  />
                  <ToggleRow
                    label="Maintenance Mode"
                    description="Blocks every request except yours (SUPER_ADMIN) with a 503 until turned off — use with care"
                    checked={settings.maintenance_mode}
                    onChange={(v) => setField('maintenance_mode', v)}
                  />
                </SectionCard>

                <div className="flex justify-end">
                  <button
                    onClick={() => save({
                      platform_name: settings.platform_name,
                      support_email: settings.support_email,
                      registration_open: settings.registration_open,
                      maintenance_mode: settings.maintenance_mode,
                    }, 'General settings saved.')}
                    disabled={saving}
                    className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium text-white bg-brand-600 hover:bg-brand-700 disabled:opacity-50 transition-colors shadow-sm"
                  >
                    <Save className="w-4 h-4" /> {saving ? 'Saving…' : 'Save Changes'}
                  </button>
                </div>
              </>
            )}

            {/* ── Security ── */}
            {activeTab === "security" && (
              <>
                <SectionCard title="Session & Verification" description="These directly control real login/signup behavior platform-wide">
                  <InputRow
                    label="Session Timeout (minutes)"
                    description="How long a login session lasts before a new one is required"
                    value={settings.session_timeout_minutes}
                    onChange={(e) => setField('session_timeout_minutes', e.target.value)}
                    type="number"
                  />
                  <InputRow
                    label="Max OTP Attempts"
                    description="How many wrong verification codes a student can enter before needing a new one"
                    value={settings.otp_max_attempts}
                    onChange={(e) => setField('otp_max_attempts', e.target.value)}
                    type="number"
                  />
                </SectionCard>

                <SectionCard title="Audit & Compliance" description="Admin action history">
                  <Link
                    to="/superadmin/maintenance"
                    className="flex items-center gap-2 text-sm font-medium text-brand-700 hover:text-brand-800"
                  >
                    View audit log <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </SectionCard>

                <div className="flex justify-end">
                  <button
                    onClick={() => save({
                      session_timeout_minutes: Number(settings.session_timeout_minutes),
                      otp_max_attempts: Number(settings.otp_max_attempts),
                    }, 'Security settings saved.')}
                    disabled={saving}
                    className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium text-white bg-brand-600 hover:bg-brand-700 disabled:opacity-50 transition-colors shadow-sm"
                  >
                    <Save className="w-4 h-4" /> {saving ? 'Saving…' : 'Save Changes'}
                  </button>
                </div>
              </>
            )}

            {/* ── System ── */}
            {activeTab === "system" && (
              <>
                <SectionCard title="System Information" description="Live platform health, not cached">
                  <div className="space-y-0">
                    <InfoRow label="Django Version" value={settings.system_info.django_version} />
                    <InfoRow label="Python Version" value={settings.system_info.python_version} />
                    <InfoRow label="Total Institutions" value={settings.system_info.total_institutions} />
                    <InfoRow label="Total Users" value={settings.system_info.total_users} />
                  </div>
                </SectionCard>

                <SectionCard title="Danger Zone" description="Irreversible platform actions">
                  <div className="flex items-center justify-between p-4 rounded-xl border border-red-100 dark:border-red-500/20 bg-red-50/40 dark:bg-red-500/10">
                    <div>
                      <p className="text-sm font-medium text-red-700 dark:text-red-400">Reset All Settings</p>
                      <p className="text-xs text-red-500 dark:text-red-400/80">Restore platform name, registration, maintenance mode, and security settings to their defaults</p>
                    </div>
                    <button
                      onClick={() => setResetOpen(true)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-red-600 dark:text-red-400 border border-red-200 dark:border-red-500/30 hover:bg-red-100 dark:hover:bg-red-500/15 transition-colors"
                    >
                      <RefreshCw className="w-3.5 h-3.5" /> Reset
                    </button>
                  </div>
                </SectionCard>
              </>
            )}

            {/* ── Impersonate ── */}
            {activeTab === "impersonate" && (
              <SectionCard
                title="View as a user"
                description="Read-only — writes are blocked while impersonating. Auto-exits after 30 minutes, or use the banner's Exit button any time."
              >
                <form onSubmit={handleImpersonate} className="flex items-end gap-3 flex-wrap">
                  <div className="flex-1 min-w-[220px]">
                    <label className="block text-sm font-medium text-ink mb-1.5">User's email</label>
                    <input
                      type="email"
                      required
                      value={impersonateEmail}
                      onChange={(e) => setImpersonateEmail(e.target.value)}
                      placeholder="someone@example.com"
                      className="w-full px-3 py-2 text-sm rounded-xl border border-ink/10 bg-paper-soft focus:outline-none focus:ring-2 focus:ring-[#395886]/30"
                    />
                  </div>
                  <Button type="submit" variant="brand" size="md" icon={Eye} disabled={impersonating}>
                    {impersonating ? 'Starting…' : 'Start impersonating'}
                  </Button>
                </form>
                <p className="text-xs text-ink-faint mt-3">
                  Can't impersonate another super admin or a deactivated account. Every start/stop is logged to the audit trail.
                </p>
              </SectionCard>
            )}
          </div>
        </div>
      </div>

      <ConfirmDialog
        open={resetOpen}
        onClose={() => setResetOpen(false)}
        onConfirm={handleReset}
        title="Reset all settings"
        message="This restores platform name, support email, registration, maintenance mode, session timeout, and OTP attempts to their defaults. This can't be undone."
        loading={resetting}
      />
    </div>
  );
}
