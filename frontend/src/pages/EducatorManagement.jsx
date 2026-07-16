import { useState, useRef, useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import { Camera, X, Search, GraduationCap, Plus, Pencil, Trash2, Building2 } from "lucide-react";
import api from "../services/api";
import PageHeader from "../components/ui/PageHeader";
import Card from "../components/ui/Card";
import Button from "../components/ui/Button";
import Modal from "../components/ui/Modal";
import ConfirmDialog from "../components/ui/ConfirmDialog";
import EmptyState from "../components/ui/EmptyState";
import StatCard from "../components/StatCard";
import { Input, Select } from "../components/ui/Field";
import { SkeletonRows } from "../components/ui/Skeleton";
import { useToast } from "../components/ui/Toast";
import { usePermissions } from "../auth/PermissionsContext";

const initialForm = { edu_id: "", name: "", institution: "", email: "", phone: "", password: "" };

function EducatorAvatar({ edu }) {
  const [broken, setBroken] = useState(false);

  if (edu.photo && !broken) {
    return (
      <img
        src={edu.photo}
        alt=""
        className="w-8 h-8 rounded-full object-cover"
        onError={() => setBroken(true)}
      />
    );
  }
  return (
    <div className="w-8 h-8 rounded-full bg-brand-100 flex items-center justify-center text-xs font-semibold text-brand-700">
      {edu.name.charAt(0)}
    </div>
  );
}

export default function EducatorManagement() {
  const { can } = usePermissions();
  const [educators, setEducators] = useState([]);
  const [institutions, setInstitutions] = useState([]);
  const [form, setForm] = useState(initialForm);
  const [photoFile, setPhotoFile] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const [formError, setFormError] = useState("");
  const fileRef = useRef();
  const toast = useToast();

  const fetchEducators = async () => {
    setLoading(true);
    try {
      const res = await api.get('/educators/');
      setEducators(Array.isArray(res.data) ? res.data : []);
    } catch {
      toast.error("Could not load educators. Is the backend running?");
    } finally {
      setLoading(false);
    }
  };

  const fetchInstitutions = async () => {
    try {
      const res = await api.get('/institutions/');
      setInstitutions(Array.isArray(res.data) ? res.data : []);
    } catch {
      // non-fatal
    }
  };

  useEffect(() => {
    fetchEducators();
    fetchInstitutions();
  }, []);

  const filtered = [...educators]
    .sort((a, b) => (a.edu_id > b.edu_id ? -1 : 1))
    .filter((e) =>
      e.name.toLowerCase().includes(search.toLowerCase()) ||
      e.edu_id.toLowerCase().includes(search.toLowerCase())
    );

  const stats = useMemo(() => {
    const institutionIds = new Set(educators.map((e) => e.institution));
    return { total: educators.length, institutions: institutionIds.size };
  }, [educators]);

  const set = (key) => (e) => setForm({ ...form, [key]: e.target.value });

  const handlePhotoChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setPhotoFile(file);
    setPhotoPreview(URL.createObjectURL(file));
  };

  const clearPhoto = () => {
    setPhotoFile(null);
    setPhotoPreview(null);
    if (fileRef.current) fileRef.current.value = "";
  };

  const openCreate = () => {
    setSelected(null);
    setForm(initialForm);
    setPhotoFile(null);
    setPhotoPreview(null);
    setFormError("");
    setFormOpen(true);
  };

  const openEdit = (edu) => {
    setSelected(edu);
    setPhotoFile(null);
    setPhotoPreview(edu.photo || null);
    setForm({
      edu_id: edu.edu_id,
      name: edu.name,
      institution: edu.institution || "",
      email: edu.email,
      phone: edu.phone,
      password: "",
    });
    setFormError("");
    setFormOpen(true);
  };

  const closeForm = () => {
    setFormOpen(false);
    setFormError("");
    if (fileRef.current) fileRef.current.value = "";
  };

  const buildFormData = () => {
    const fd = new FormData();
    fd.append("edu_id", form.edu_id);
    fd.append("name", form.name);
    if (form.institution) fd.append("institution", form.institution);
    fd.append("email", form.email);
    fd.append("phone", form.phone);
    if (form.password.trim()) fd.append("password", form.password);
    if (photoFile) fd.append("photo", photoFile);
    return fd;
  };

  const handleSubmit = async () => {
    if (!form.edu_id.trim()) return setFormError("Enter an Educator ID.");
    if (!form.name.trim()) return setFormError("Enter a name.");
    if (!selected && !form.password.trim()) return setFormError("Enter a password.");

    setSaving(true);
    setFormError("");
    try {
      if (selected) {
        await api.patch(`/educators/${selected.id}/`, buildFormData());
        toast.success('Educator updated.');
      } else {
        await api.post('/educators/', buildFormData());
        toast.success('Educator created.');
      }
      closeForm();
      await fetchEducators();
    } catch (e) {
      setFormError(e.response?.data ? JSON.stringify(e.response.data) : e.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!selected) return;
    setSaving(true);
    try {
      await api.delete(`/educators/${selected.id}/`);
      toast.success('Educator deleted.');
      setConfirmDelete(false);
      setFormOpen(false);
      await fetchEducators();
    } catch (e) {
      toast.error("Delete failed: " + e.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-paper-soft p-8">
      <div className="max-w-5xl mx-auto space-y-6">
        <PageHeader
          title="Educator management"
          subtitle="Teaching staff across your institutions"
          actions={can('create_educator') && (
            <Button variant="brand" size="md" icon={Plus} onClick={openCreate}>
              Add educator
            </Button>
          )}
        />

        <div className="grid sm:grid-cols-2 gap-4">
          <StatCard label="Total educators" value={stats.total} tone="brand" icon={GraduationCap} />
          <StatCard label="Institutions covered" value={stats.institutions} tone="ocean" icon={Building2} />
        </div>

        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }}>
          <Card padding="p-0" className="overflow-hidden">
            <div className="px-6 py-4 border-b border-ink/[0.06] flex items-center justify-between gap-4 flex-wrap">
              <p className="text-xs font-semibold tracking-widest text-ink-faint uppercase">Educator list</p>
              <div className="relative w-full sm:w-64">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-faint" />
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search by name or ID…"
                  className="w-full pl-8 pr-3.5 py-2 border border-ink/10 rounded-lg text-sm outline-none focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10"
                />
              </div>
            </div>

            {loading ? (
              <div className="p-6"><SkeletonRows rows={5} /></div>
            ) : filtered.length === 0 ? (
              <EmptyState icon={GraduationCap} title="No educators found" />
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-ink/[0.02]">
                    {["", "Edu ID", "Name", "Institution", "Email", "Phone"].map((h) => (
                      <th key={h} className="px-4 py-2.5 text-left text-[11px] font-semibold text-ink-faint uppercase tracking-wider border-b border-ink/[0.06]">{h}</th>
                    ))}
                    {(can('edit_educator') || can('delete_educator')) && <th className="px-4 py-2.5 w-20 border-b border-ink/[0.06]" />}
                  </tr>
                </thead>
                <tbody className="divide-y divide-ink/[0.05]">
                  {filtered.map((edu) => (
                    <tr key={edu.edu_id} className="group hover:bg-ink/[0.02] transition-colors">
                      <td className="px-4 py-2.5">
                        <EducatorAvatar edu={edu} />
                      </td>
                      <td className="px-4 py-2.5 text-ink-faint">{edu.edu_id}</td>
                      <td className="px-4 py-2.5 font-medium text-ink">{edu.name}</td>
                      <td className="px-4 py-2.5 text-ink-soft">{edu.institution_name || "-"}</td>
                      <td className="px-4 py-2.5 text-ink-soft">{edu.email}</td>
                      <td className="px-4 py-2.5 text-ink-soft">{edu.phone}</td>
                      {(can('edit_educator') || can('delete_educator')) && (
                        <td className="px-4 py-2.5">
                          <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            {can('edit_educator') && (
                              <button
                                onClick={() => openEdit(edu)}
                                className="w-8 h-8 rounded-lg flex items-center justify-center text-ink-faint hover:text-brand-700 hover:bg-brand-50 transition-colors"
                                aria-label="Edit educator"
                              >
                                <Pencil size={14} />
                              </button>
                            )}
                            {can('delete_educator') && (
                              <button
                                onClick={() => { setSelected(edu); setConfirmDelete(true); }}
                                className="w-8 h-8 rounded-lg flex items-center justify-center text-ink-faint hover:text-danger hover:bg-red-50 transition-colors"
                                aria-label="Delete educator"
                              >
                                <Trash2 size={14} />
                              </button>
                            )}
                          </div>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </Card>
        </motion.div>
      </div>

      <Modal
        open={formOpen}
        onClose={closeForm}
        title={selected ? "Edit educator" : "Add educator"}
        footer={(
          <>
            <Button variant="outline" size="md" onClick={closeForm}>Cancel</Button>
            <Button variant="brand" size="md" disabled={saving} onClick={handleSubmit}>
              {saving ? "Saving…" : selected ? "Save changes" : "Create educator"}
            </Button>
          </>
        )}
      >
        <div className="space-y-5">
          <div className="flex items-start gap-4">
            <div className="flex flex-col items-center gap-1.5">
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                className="w-16 h-16 rounded-full border-2 border-dashed border-ink/15 bg-ink/[0.02] flex items-center justify-center overflow-hidden text-ink-faint hover:border-brand-300 transition-colors"
              >
                {photoPreview ? <img src={photoPreview} alt="" className="w-full h-full object-cover" /> : <Camera size={20} />}
              </button>
              {photoPreview && (
                <button onClick={clearPhoto} className="text-[11px] text-danger hover:underline flex items-center gap-0.5">
                  <X size={10} /> Remove
                </button>
              )}
              <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handlePhotoChange} />
            </div>

            <div className="grid grid-cols-2 gap-4 flex-1">
              <Input
                label="Educator ID"
                required
                value={form.edu_id}
                onChange={set("edu_id")}
                placeholder="e.g. LNBTI239"
                disabled={!!selected}
              />
              <Input label="Name" required value={form.name} onChange={set("name")} placeholder="Educator full name" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Input label="Email" type="email" value={form.email} onChange={set("email")} placeholder="email@example.com" />
            <Input label="Phone" value={form.phone} onChange={set("phone")} placeholder="07X XXXXXXX" />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Input
              label={selected ? "Password (leave blank to keep current)" : "Password"}
              type="password"
              required={!selected}
              value={form.password}
              onChange={set("password")}
              placeholder={selected ? "Enter new password" : "Create a password"}
            />
            <Select label="Institution" value={form.institution} onChange={set("institution")}>
              <option value="">Select institution…</option>
              {institutions.map((i) => (
                <option key={i.id} value={i.id}>{i.name}</option>
              ))}
            </Select>
          </div>

          {formError && <p className="text-sm text-danger break-words">{formError}</p>}
        </div>
      </Modal>

      <ConfirmDialog
        open={confirmDelete}
        onClose={() => setConfirmDelete(false)}
        onConfirm={handleDelete}
        title="Delete educator"
        message={`Delete "${selected?.name}"?`}
        loading={saving}
      />
    </div>
  );
}
