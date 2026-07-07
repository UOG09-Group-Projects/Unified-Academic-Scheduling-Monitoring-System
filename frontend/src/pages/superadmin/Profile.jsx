// src/pages/superadmin/Profile.jsx
import { useState, useRef } from "react";
import {
  User, Mail, Phone, Shield, Camera, Save,
  Lock, Eye, EyeOff, CheckCircle, AlertCircle,
  Globe, Bell, Key, LogOut, Pencil, X
} from "lucide-react";

const ACTIVITY_LOG = [
  { id: 1, action: "Removed institution", detail: "Deleted Crestwood School", time: "2 hours ago", type: "danger" },
  { id: 2, action: "Suspended institution", detail: "Suspended Lakeside College", time: "5 hours ago", type: "warning" },
  { id: 3, action: "Added new institution", detail: "Onboarded Summit Tech Institute", time: "Yesterday, 2:30 PM", type: "success" },
  { id: 4, action: "Updated settings", detail: "Changed platform email settings", time: "Yesterday, 10:00 AM", type: "info" },
  { id: 5, action: "Login", detail: "Signed in from Portland, OR", time: "2 days ago", type: "info" },
];

function InputField({ label, icon: Icon, type = "text", value, onChange, disabled, placeholder }) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1.5">{label}</label>
      <div className="relative">
        <Icon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          type={type}
          value={value}
          onChange={onChange}
          disabled={disabled}
          placeholder={placeholder}
          className="w-full pl-10 pr-4 py-2.5 text-sm rounded-xl border border-gray-200 bg-white focus:outline-none focus:ring-2 focus:ring-[#395886]/30 disabled:bg-[#F0F3FA] disabled:text-gray-500 transition-all"
        />
      </div>
    </div>
  );
}

function PasswordField({ label, value, onChange, placeholder }) {
  const [show, setShow] = useState(false);
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1.5">{label}</label>
      <div className="relative">
        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          type={show ? "text" : "password"}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          className="w-full pl-10 pr-10 py-2.5 text-sm rounded-xl border border-gray-200 bg-white focus:outline-none focus:ring-2 focus:ring-[#395886]/30"
        />
        <button
          type="button"
          onClick={() => setShow(!show)}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
        >
          {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
        </button>
      </div>
    </div>
  );
}

export default function Profile() {
  const fileRef = useRef();
  const [editMode, setEditMode] = useState(false);
  const [toast, setToast] = useState(null);
  const [activeTab, setActiveTab] = useState("profile");

  const [profile, setProfile] = useState({
    name: "Alex Reynolds",
    email: "alex.reynolds@platform.io",
    phone: "+1 (555) 987-6543",
    role: "Super Administrator",
    timezone: "America/Los_Angeles",
    avatar: null,
  });

  const [passwords, setPasswords] = useState({ current: "", new: "", confirm: "" });
  const [notifications, setNotifications] = useState({
    newInstitution: true,
    subscriptionExpiry: true,
    paymentFailed: true,
    systemAlerts: true,
    weeklyReport: false,
    loginAlerts: true,
  });

  const showToast = (message, type = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const handleSaveProfile = () => {
    setEditMode(false);
    showToast("Profile updated successfully.");
  };

  const handlePasswordChange = (e) => {
    e.preventDefault();
    if (passwords.new !== passwords.confirm) {
      showToast("New passwords do not match.", "error");
      return;
    }
    if (passwords.new.length < 8) {
      showToast("Password must be at least 8 characters.", "error");
      return;
    }
    setPasswords({ current: "", new: "", confirm: "" });
    showToast("Password changed successfully.");
  };

  const passwordStrength = (pw) => {
    if (!pw) return null;
    let score = 0;
    if (pw.length >= 8) score++;
    if (/[A-Z]/.test(pw)) score++;
    if (/[0-9]/.test(pw)) score++;
    if (/[^A-Za-z0-9]/.test(pw)) score++;
    return score;
  };
  const strength = passwordStrength(passwords.new);
  const strengthLabel = ["Too short", "Weak", "Fair", "Good", "Strong"];
  const strengthColor = ["", "bg-red-400", "bg-amber-400", "bg-sky-400", "bg-emerald-500"];

  const tabs = [
    { id: "profile", label: "Profile", icon: User },
    { id: "security", label: "Security", icon: Lock },
    { id: "notifications", label: "Notifications", icon: Bell },
    { id: "activity", label: "Activity Log", icon: Key },
  ];

  return (
    <div className="min-h-screen bg-[#F0F3FA] p-4 md:p-8">
      {/* Toast */}
      {toast && (
        <div className={`fixed top-5 right-5 z-50 flex items-center gap-3 px-4 py-3 rounded-xl shadow-lg text-sm font-medium text-white animate-fade-in
          ${toast.type === "error" ? "bg-red-500" : "bg-emerald-500"}`}>
          {toast.type === "error" ? <AlertCircle className="w-4 h-4" /> : <CheckCircle className="w-4 h-4" />}
          {toast.message}
        </div>
      )}

      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">My Profile</h1>
          <p className="text-sm text-gray-500 mt-1">Manage your account information and preferences</p>
        </div>

        {/* Profile Card */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-6">
          <div className="flex items-center gap-5 flex-wrap">
            {/* Avatar */}
            <div className="relative">
              <div className="w-20 h-20 rounded-2xl bg-[#395886] flex items-center justify-center text-white text-2xl font-bold overflow-hidden">
                {profile.avatar ? (
                  <img src={profile.avatar} alt="Avatar" className="w-full h-full object-cover" />
                ) : (
                  profile.name.split(" ").map(n => n[0]).join("").slice(0, 2)
                )}
              </div>
              <button
                onClick={() => fileRef.current?.click()}
                className="absolute -bottom-1.5 -right-1.5 w-7 h-7 bg-[#395886] text-white rounded-lg flex items-center justify-center shadow-md hover:bg-[#2f4a73] transition-colors"
              >
                <Camera className="w-3.5 h-3.5" />
              </button>
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    const url = URL.createObjectURL(file);
                    setProfile(p => ({ ...p, avatar: url }));
                  }
                }}
              />
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-xl font-bold text-gray-900">{profile.name}</h2>
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-[#395886]/10 text-[#395886]">
                  <Shield className="w-3 h-3" /> Super Admin
                </span>
              </div>
              <p className="text-sm text-gray-500 mt-0.5">{profile.email}</p>
              <p className="text-xs text-gray-400 mt-0.5">Last login: Today at 9:41 AM · Portland, OR</p>
            </div>

            <button
              onClick={() => setEditMode(!editMode)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
                editMode ? "text-gray-700 border border-gray-200 hover:bg-gray-50" : "text-white bg-[#395886] hover:bg-[#2f4a73]"
              }`}
            >
              {editMode ? <><X className="w-4 h-4" /> Cancel</> : <><Pencil className="w-4 h-4" /> Edit Profile</>}
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="flex border-b border-gray-100 overflow-x-auto">
            {tabs.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setActiveTab(id)}
                className={`flex items-center gap-2 px-5 py-3.5 text-sm font-medium whitespace-nowrap transition-colors border-b-2 -mb-px ${
                  activeTab === id
                    ? "border-[#395886] text-[#395886] bg-[#395886]/5"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50"
                }`}
              >
                <Icon className="w-4 h-4" />
                {label}
              </button>
            ))}
          </div>

          <div className="p-6">
            {/* ── Profile Tab ── */}
            {activeTab === "profile" && (
              <div className="space-y-5 max-w-lg">
                <InputField
                  label="Full Name"
                  icon={User}
                  value={profile.name}
                  onChange={(e) => setProfile(p => ({ ...p, name: e.target.value }))}
                  disabled={!editMode}
                />
                <InputField
                  label="Email Address"
                  icon={Mail}
                  type="email"
                  value={profile.email}
                  onChange={(e) => setProfile(p => ({ ...p, email: e.target.value }))}
                  disabled={!editMode}
                />
                <InputField
                  label="Phone Number"
                  icon={Phone}
                  type="tel"
                  value={profile.phone}
                  onChange={(e) => setProfile(p => ({ ...p, phone: e.target.value }))}
                  disabled={!editMode}
                />
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Timezone</label>
                  <div className="relative">
                    <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <select
                      value={profile.timezone}
                      onChange={(e) => setProfile(p => ({ ...p, timezone: e.target.value }))}
                      disabled={!editMode}
                      className="w-full pl-10 pr-4 py-2.5 text-sm rounded-xl border border-gray-200 bg-white focus:outline-none focus:ring-2 focus:ring-[#395886]/30 disabled:bg-[#F0F3FA] disabled:text-gray-500 appearance-none"
                    >
                      <option value="America/Los_Angeles">Pacific Time (PT)</option>
                      <option value="America/Denver">Mountain Time (MT)</option>
                      <option value="America/Chicago">Central Time (CT)</option>
                      <option value="America/New_York">Eastern Time (ET)</option>
                      <option value="UTC">UTC</option>
                    </select>
                  </div>
                </div>
                {editMode && (
                  <button
                    onClick={handleSaveProfile}
                    className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium text-white bg-[#395886] hover:bg-[#2f4a73] transition-colors shadow-sm"
                  >
                    <Save className="w-4 h-4" /> Save Changes
                  </button>
                )}
              </div>
            )}

            {/* ── Security Tab ── */}
            {activeTab === "security" && (
              <div className="max-w-lg">
                <form onSubmit={handlePasswordChange} className="space-y-4">
                  <h3 className="text-sm font-semibold text-gray-700 mb-4">Change Password</h3>
                  <PasswordField
                    label="Current Password"
                    value={passwords.current}
                    onChange={(e) => setPasswords(p => ({ ...p, current: e.target.value }))}
                    placeholder="Enter current password"
                  />
                  <PasswordField
                    label="New Password"
                    value={passwords.new}
                    onChange={(e) => setPasswords(p => ({ ...p, new: e.target.value }))}
                    placeholder="Min. 8 characters"
                  />
                  {/* Strength bar */}
                  {passwords.new && (
                    <div>
                      <div className="flex gap-1 mb-1">
                        {[1, 2, 3, 4].map((i) => (
                          <div
                            key={i}
                            className={`h-1.5 flex-1 rounded-full transition-all ${i <= (strength || 0) ? strengthColor[strength] : "bg-gray-200"}`}
                          />
                        ))}
                      </div>
                      <p className="text-xs text-gray-500">{strengthLabel[strength || 0]}</p>
                    </div>
                  )}
                  <PasswordField
                    label="Confirm New Password"
                    value={passwords.confirm}
                    onChange={(e) => setPasswords(p => ({ ...p, confirm: e.target.value }))}
                    placeholder="Repeat new password"
                  />
                  <button
                    type="submit"
                    className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium text-white bg-[#395886] hover:bg-[#2f4a73] transition-colors shadow-sm"
                  >
                    <Lock className="w-4 h-4" /> Update Password
                  </button>
                </form>

                <div className="mt-8 pt-6 border-t border-gray-100">
                  <h3 className="text-sm font-semibold text-gray-700 mb-4">Two-Factor Authentication</h3>
                  <div className="flex items-center justify-between p-4 rounded-xl bg-[#F0F3FA] border border-gray-200">
                    <div>
                      <p className="text-sm font-medium text-gray-800">Authenticator App</p>
                      <p className="text-xs text-gray-500 mt-0.5">Add an extra layer of security to your account</p>
                    </div>
                    <button className="px-4 py-2 rounded-xl text-sm font-medium text-[#395886] border border-[#395886]/30 hover:bg-[#395886]/10 transition-colors">
                      Enable
                    </button>
                  </div>
                </div>

                <div className="mt-6 pt-6 border-t border-gray-100">
                  <h3 className="text-sm font-semibold text-red-600 mb-4">Danger Zone</h3>
                  <button className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium text-red-600 border border-red-200 hover:bg-red-50 transition-colors">
                    <LogOut className="w-4 h-4" /> Sign out all sessions
                  </button>
                </div>
              </div>
            )}

            {/* ── Notifications Tab ── */}
            {activeTab === "notifications" && (
              <div className="max-w-lg space-y-2">
                <h3 className="text-sm font-semibold text-gray-700 mb-4">Email Notifications</h3>
                {[
                  { key: "newInstitution", label: "New Institution Registered", desc: "When a new institution signs up" },
                  { key: "subscriptionExpiry", label: "Subscription Expiring", desc: "7 days before a subscription expires" },
                  { key: "paymentFailed", label: "Payment Failed", desc: "When an institution's payment fails" },
                  { key: "systemAlerts", label: "System Alerts", desc: "Critical platform alerts and outages" },
                  { key: "weeklyReport", label: "Weekly Summary Report", desc: "Every Monday morning digest" },
                  { key: "loginAlerts", label: "New Login Alerts", desc: "When a new device logs into your account" },
                ].map(({ key, label, desc }) => (
                  <div
                    key={key}
                    className="flex items-center justify-between p-4 rounded-xl hover:bg-[#F0F3FA]/60 transition-colors"
                  >
                    <div>
                      <p className="text-sm font-medium text-gray-800">{label}</p>
                      <p className="text-xs text-gray-500">{desc}</p>
                    </div>
                    <button
                      onClick={() => setNotifications(n => ({ ...n, [key]: !n[key] }))}
                      className={`relative w-11 h-6 rounded-full transition-colors ${notifications[key] ? "bg-[#395886]" : "bg-gray-200"}`}
                    >
                      <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${notifications[key] ? "translate-x-5" : "translate-x-0"}`} />
                    </button>
                  </div>
                ))}
                <div className="pt-4">
                  <button
                    onClick={() => showToast("Notification preferences saved.")}
                    className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium text-white bg-[#395886] hover:bg-[#2f4a73] transition-colors shadow-sm"
                  >
                    <Save className="w-4 h-4" /> Save Preferences
                  </button>
                </div>
              </div>
            )}

            {/* ── Activity Tab ── */}
            {activeTab === "activity" && (
              <div className="max-w-lg">
                <h3 className="text-sm font-semibold text-gray-700 mb-4">Recent Activity</h3>
                <div className="space-y-1">
                  {ACTIVITY_LOG.map((log, idx) => {
                    const colors = {
                      danger: "bg-red-50 text-red-600",
                      warning: "bg-amber-50 text-amber-600",
                      success: "bg-emerald-50 text-emerald-600",
                      info: "bg-[#395886]/10 text-[#395886]",
                    };
                    const dotColors = {
                      danger: "bg-red-400",
                      warning: "bg-amber-400",
                      success: "bg-emerald-400",
                      info: "bg-[#395886]",
                    };
                    return (
                      <div key={log.id} className="flex gap-4 p-3 rounded-xl hover:bg-[#F0F3FA]/60 transition-colors">
                        <div className="flex flex-col items-center">
                          <div className={`w-2 h-2 rounded-full mt-1.5 ${dotColors[log.type]}`} />
                          {idx < ACTIVITY_LOG.length - 1 && <div className="w-px flex-1 bg-gray-200 my-1" />}
                        </div>
                        <div className="flex-1 pb-2">
                          <p className="text-sm font-medium text-gray-800">{log.action}</p>
                          <p className="text-xs text-gray-500">{log.detail}</p>
                          <p className="text-xs text-gray-400 mt-1">{log.time}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}