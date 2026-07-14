// src/pages/UserProfile.jsx
import { useState, useEffect, useRef } from "react";
import {
  User, Mail, Shield, Save, Lock,
  Eye, EyeOff, CheckCircle, AlertCircle,
  Pencil, X, Camera
} from "lucide-react";
import api from "../services/api";

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
          className="w-full pl-10 pr-4 py-2.5 text-sm rounded-xl border border-gray-200 bg-white
                     focus:outline-none focus:ring-2 focus:ring-[#395886]/30
                     disabled:bg-[#F0F3FA] disabled:text-gray-500 transition-all"
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
          className="w-full pl-10 pr-10 py-2.5 text-sm rounded-xl border border-gray-200 bg-white
                     focus:outline-none focus:ring-2 focus:ring-[#395886]/30"
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

export default function UserProfile() {
  const [activeTab, setActiveTab] = useState("profile");
  const [editMode, setEditMode]   = useState(false);
  const [toast, setToast]         = useState(null);
  const [loading, setLoading]     = useState(true);
  const [saving, setSaving]       = useState(false);
  const fileRef                   = useRef();

  // profile = saved data shown in header (only updates after Save)
  const [profile, setProfile] = useState({
    username: "", email: "", role: "", profile_picture: null,
  });

  // form = editable fields (updates as user types)
  const [form, setForm] = useState({ username: "", email: "" });

  const [previewUrl, setPreviewUrl]       = useState(null);
  const [selectedFile, setSelectedFile]   = useState(null);

  const [passwords, setPasswords] = useState({
    current: "", new: "", confirm: "",
  });

  const showToast = (message, type = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  // Fetch profile on mount
  useEffect(() => {
    api.get("/user/profile/")
      .then(res => {
        setProfile({
          username:        res.data.username,
          email:           res.data.email,
          role:            res.data.role,
          profile_picture: res.data.profile_picture,
        });
        setForm({ username: res.data.username, email: res.data.email });
        if (res.data.profile_picture) setPreviewUrl(res.data.profile_picture);
      })
      .catch(() => showToast("Failed to load profile.", "error"))
      .finally(() => setLoading(false));
  }, []);

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setSelectedFile(file);
    setPreviewUrl(URL.createObjectURL(file));
  };

  const handleCancelEdit = () => {
    setForm({ username: profile.username, email: profile.email });
    setPreviewUrl(profile.profile_picture || null);
    setSelectedFile(null);
    setEditMode(false);
  };

  const handleSaveProfile = async () => {
    setSaving(true);
    try {
      // Step 1: Update username/email via JSON PATCH
      const res = await api.patch("/user/profile/", {
        username: form.username,
        email:    form.email,
      });

      const updated = res.data.user;

      // Step 2: Upload profile picture separately via POST (multipart)
      if (selectedFile) {
        const formData = new FormData();
        formData.append('profile_picture', selectedFile);
        const picRes = await api.post("/user/profile/picture/", formData);
        if (picRes.data.profile_picture) {
          setPreviewUrl(picRes.data.profile_picture);
          setProfile(p => ({ ...p, profile_picture: picRes.data.profile_picture }));
        }
      }

      // Update header card with saved values
      setProfile(p => ({
        ...p,
        username: updated.username,
        email:    updated.email,
      }));
      setForm({ username: updated.username, email: updated.email });
      setSelectedFile(null);
      setEditMode(false);
      showToast("Profile updated successfully.");
    } catch (err) {
      showToast(err?.response?.data?.error || "Failed to update profile.", "error");
    } finally {
      setSaving(false);
    }
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    if (passwords.new !== passwords.confirm) {
      showToast("New passwords do not match.", "error"); return;
    }
    if (passwords.new.length < 8) {
      showToast("Password must be at least 8 characters.", "error"); return;
    }
    setSaving(true);
    try {
      await api.post("/user/profile/change-password/", {
        current_password: passwords.current,
        new_password:     passwords.new,
        confirm_password: passwords.confirm,
      });
      setPasswords({ current: "", new: "", confirm: "" });
      showToast("Password changed successfully.");
    } catch (err) {
      showToast(err?.response?.data?.error || "Failed to change password.", "error");
    } finally {
      setSaving(false);
    }
  };

  const passwordStrength = (pw) => {
    if (!pw) return 0;
    let s = 0;
    if (pw.length >= 8)           s++;
    if (/[A-Z]/.test(pw))        s++;
    if (/[0-9]/.test(pw))        s++;
    if (/[^A-Za-z0-9]/.test(pw)) s++;
    return s;
  };
  const strength      = passwordStrength(passwords.new);
  const strengthLabel = ["", "Weak", "Fair", "Good", "Strong"];
  const strengthColor = ["", "bg-red-400", "bg-amber-400", "bg-sky-400", "bg-emerald-500"];

  const tabs = [
    { id: "profile",  label: "Profile",  icon: User },
    { id: "security", label: "Security", icon: Lock  },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-400 text-sm">
        Loading profile...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F0F3FA] p-4 md:p-8">

      {/* Toast */}
      {toast && (
        <div className={`fixed top-5 right-5 z-50 flex items-center gap-3 px-4 py-3 rounded-xl
          shadow-lg text-sm font-medium text-white
          ${toast.type === "error" ? "bg-red-500" : "bg-emerald-500"}`}>
          {toast.type === "error"
            ? <AlertCircle className="w-4 h-4" />
            : <CheckCircle className="w-4 h-4" />}
          {toast.message}
        </div>
      )}

      <div className="max-w-3xl mx-auto">

        {/* Page header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">My Profile</h1>
          <p className="text-sm text-gray-500 mt-1">View and manage your account information</p>
        </div>

        {/* Profile card — shows SAVED data only */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-6">
          <div className="flex items-center gap-5 flex-wrap">

            {/* Avatar */}
            <div className="relative">
              <div className="w-16 h-16 rounded-2xl bg-[#395886] flex items-center justify-center
                              text-white text-xl font-bold overflow-hidden">
                {editMode && previewUrl
                  ? <img src={previewUrl} alt="Preview" className="w-full h-full object-cover" />
                  : profile.profile_picture
                    ? <img src={profile.profile_picture} alt="Profile" className="w-full h-full object-cover" />
                    : profile.username?.slice(0, 2).toUpperCase()
                }
              </div>
              {editMode && (
                <>
                  <button
                    onClick={() => fileRef.current?.click()}
                    className="absolute -bottom-1.5 -right-1.5 w-7 h-7 bg-[#395886] text-white
                               rounded-lg flex items-center justify-center shadow-md
                               hover:bg-[#2f4a73] transition-colors"
                  >
                    <Camera className="w-3.5 h-3.5" />
                  </button>
                  <input
                    ref={fileRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleFileChange}
                  />
                </>
              )}
            </div>

            {/* Shows saved profile values — not form values */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-lg font-bold text-gray-900">{profile.username}</h2>
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full
                                 text-xs font-medium bg-[#395886]/10 text-[#395886]">
                  <Shield className="w-3 h-3" /> {profile.role}
                </span>
              </div>
              <p className="text-sm text-gray-500 mt-0.5">{profile.email}</p>
            </div>

            <button
              onClick={() => editMode ? handleCancelEdit() : setEditMode(true)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-colors
                ${editMode
                  ? "text-gray-700 border border-gray-200 hover:bg-gray-50"
                  : "text-white bg-[#395886] hover:bg-[#2f4a73]"}`}
            >
              {editMode
                ? <><X className="w-4 h-4" /> Cancel</>
                : <><Pencil className="w-4 h-4" /> Edit Profile</>}
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="flex border-b border-gray-100">
            {tabs.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setActiveTab(id)}
                className={`flex items-center gap-2 px-5 py-3.5 text-sm font-medium transition-colors border-b-2 -mb-px
                  ${activeTab === id
                    ? "border-[#395886] text-[#395886] bg-[#395886]/5"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50"}`}
              >
                <Icon className="w-4 h-4" /> {label}
              </button>
            ))}
          </div>

          <div className="p-6">

            {/* Profile Tab — uses form state */}
            {activeTab === "profile" && (
              <div className="space-y-5 max-w-md">
                <InputField
                  label="Username"
                  icon={User}
                  value={form.username}
                  onChange={e => setForm(p => ({ ...p, username: e.target.value }))}
                  disabled={!editMode}
                />
                <InputField
                  label="Email Address"
                  icon={Mail}
                  type="email"
                  value={form.email}
                  onChange={e => setForm(p => ({ ...p, email: e.target.value }))}
                  disabled={!editMode}
                />
                <InputField
                  label="Role"
                  icon={Shield}
                  value={profile.role}
                  disabled
                />
                {editMode && (
                  <button
                    onClick={handleSaveProfile}
                    disabled={saving}
                    className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium
                               text-white bg-[#395886] hover:bg-[#2f4a73] transition-colors shadow-sm
                               disabled:opacity-60"
                  >
                    <Save className="w-4 h-4" />
                    {saving ? "Saving..." : "Save Changes"}
                  </button>
                )}
              </div>
            )}

            {/* Security Tab */}
            {activeTab === "security" && (
              <div className="max-w-md">
                <form onSubmit={handlePasswordChange} className="space-y-4">
                  <h3 className="text-sm font-semibold text-gray-700 mb-4">Change Password</h3>
                  <PasswordField
                    label="Current Password"
                    value={passwords.current}
                    onChange={e => setPasswords(p => ({ ...p, current: e.target.value }))}
                    placeholder="Enter current password"
                  />
                  <PasswordField
                    label="New Password"
                    value={passwords.new}
                    onChange={e => setPasswords(p => ({ ...p, new: e.target.value }))}
                    placeholder="Min. 8 characters"
                  />
                  {passwords.new && (
                    <div>
                      <div className="flex gap-1 mb-1">
                        {[1,2,3,4].map(i => (
                          <div key={i}
                            className={`h-1.5 flex-1 rounded-full transition-all
                              ${i <= strength ? strengthColor[strength] : "bg-gray-200"}`}
                          />
                        ))}
                      </div>
                      <p className="text-xs text-gray-500">{strengthLabel[strength]}</p>
                    </div>
                  )}
                  <PasswordField
                    label="Confirm New Password"
                    value={passwords.confirm}
                    onChange={e => setPasswords(p => ({ ...p, confirm: e.target.value }))}
                    placeholder="Repeat new password"
                  />
                  <button
                    type="submit"
                    disabled={saving}
                    className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium
                               text-white bg-[#395886] hover:bg-[#2f4a73] transition-colors shadow-sm
                               disabled:opacity-60"
                  >
                    <Lock className="w-4 h-4" />
                    {saving ? "Updating..." : "Update Password"}
                  </button>
                </form>
              </div>
            )}

          </div>
        </div>
      </div>
    </div>
  );
}
