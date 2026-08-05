import { useEffect, useState } from 'react';
import { Save, Bell, Mail } from 'lucide-react';
import dashboardService from '../../services/dashboardService';
import Card from '../../components/ui/Card';
import PageHeader from '../../components/ui/PageHeader';
import { SkeletonRows } from '../../components/ui/Skeleton';
import { useToast } from '../../components/ui/Toast';

const DAYS = Array.from({ length: 28 }, (_, i) => i + 1);

function ToggleRow({ label, description, checked, onChange }) {
  return (
    <div className="flex items-center justify-between py-3 border-b border-ink/[0.04] last:border-0">
      <div>
        <p className="text-sm font-medium text-ink">{label}</p>
        {description && <p className="text-xs text-ink-faint mt-0.5">{description}</p>}
      </div>
      <button
        onClick={() => onChange(!checked)}
        className={`relative w-11 h-6 rounded-full transition-colors shrink-0 ml-4 ${checked ? 'bg-brand-600' : 'bg-ink/10'}`}
      >
        <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-surface rounded-full shadow transition-transform ${checked ? 'translate-x-5' : 'translate-x-0'}`} />
      </button>
    </div>
  );
}

export default function ParentPreferences() {
  const toast = useToast();
  const [prefs, setPrefs] = useState(null);
  const [schedule, setSchedule] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let ignore = false;
    dashboardService.getParentPreferences()
      .then((data) => {
        if (ignore) return;
        setPrefs(data.notification_preferences);
        setSchedule(data.report_schedule);
      })
      .catch(() => { if (!ignore) toast.error('Failed to load preferences.'); })
      .finally(() => { if (!ignore) setLoading(false); });
    return () => { ignore = true; };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  async function handleSave() {
    setSaving(true);
    try {
      const data = await dashboardService.updateParentPreferences({
        notification_preferences: prefs,
        report_schedule: schedule,
      });
      setPrefs(data.notification_preferences);
      setSchedule(data.report_schedule);
      toast.success('Preferences saved.');
    } catch {
      toast.error('Failed to save preferences.');
    } finally {
      setSaving(false);
    }
  }

  if (loading || !prefs || !schedule) {
    return (
      <div className="p-6 max-w-2xl mx-auto">
        <SkeletonRows rows={5} />
      </div>
    );
  }

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <PageHeader title="Preferences" subtitle="Control what LightLearn notifies and emails you about" />

      <Card className="mb-5">
        <div className="flex items-center gap-2 mb-1">
          <Bell className="w-4 h-4 text-ink-faint" />
          <h3 className="text-sm font-semibold text-ink">Notifications</h3>
        </div>
        <div className="mt-2">
          <ToggleRow
            label="New activity assigned to my child"
            description="Notify me when an educator adds a new activity to one of my child's courses"
            checked={prefs.activity_updates}
            onChange={(v) => setPrefs((p) => ({ ...p, activity_updates: v }))}
          />
          <ToggleRow
            label="Replies to my messages"
            description="Notify me when a manager or admin replies to a help request or complaint I filed"
            checked={prefs.complaint_replies}
            onChange={(v) => setPrefs((p) => ({ ...p, complaint_replies: v }))}
          />
        </div>
      </Card>

      <Card className="mb-6">
        <div className="flex items-center gap-2 mb-1">
          <Mail className="w-4 h-4 text-ink-faint" />
          <h3 className="text-sm font-semibold text-ink">Monthly report emails</h3>
        </div>
        <div className="mt-2">
          <ToggleRow
            label="Email me monthly reports automatically"
            description="Sends a PDF report for each of your children on the day you choose, covering the month that just ended"
            checked={schedule.enabled}
            onChange={(v) => setSchedule((s) => ({ ...s, enabled: v }))}
          />
          {schedule.enabled && (
            <div className="flex items-center justify-between py-3">
              <div>
                <p className="text-sm font-medium text-ink">Delivery day</p>
                <p className="text-xs text-ink-faint mt-0.5">Day of the month reports are sent</p>
              </div>
              <select
                value={schedule.day_of_month}
                onChange={(e) => setSchedule((s) => ({ ...s, day_of_month: Number(e.target.value) }))}
                className="px-3 py-2 text-sm rounded-xl border border-ink/10 bg-paper-soft focus:outline-none focus:ring-2 focus:ring-brand-500/30"
              >
                {DAYS.map((d) => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
            </div>
          )}
        </div>
      </Card>

      <div className="flex justify-end">
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium text-white bg-brand-600 hover:bg-brand-700 transition-colors shadow-sm disabled:opacity-60"
        >
          <Save className="w-4 h-4" /> {saving ? 'Saving…' : 'Save preferences'}
        </button>
      </div>
    </div>
  );
}
