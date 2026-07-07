import { useState, useRef, useEffect } from "react";

const API = "http://localhost:8000/api";

export default function EducatorManagement() {
  const [educators, setEducators] = useState([]);
  const [institutions, setInstitutions] = useState([]);
  const [form, setForm] = useState({ edu_id: "", name: "", institution: "", email: "", phone: "",password: "" });
  const [photoFile, setPhotoFile] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const fileRef = useRef();

  useEffect(() => {
    fetchEducators();
    fetchInstitutions();
  }, []);

  const fetchEducators = async () => {
    try {
      const res = await fetch(`${API}/educators/`, {
        credentials: 'include',
      });
      const data = await res.json();
      setEducators(Array.isArray(data) ? data : []);
    } catch {
      setError("Could not load educators. Is the backend running?");
    }
  };

  const fetchInstitutions = async () => {
    try {
      const res = await fetch(`${API}/institutions/`, {
        credentials: 'include',
      });
      if (!res.ok) return;
      const data = await res.json();
      setInstitutions(Array.isArray(data) ? data : []);
    } catch {}
  };

  const filtered = [...educators]
    .sort((a, b) => (a.edu_id > b.edu_id ? -1 : 1))
    .filter(
      (e) =>
        e.name.toLowerCase().includes(search.toLowerCase()) ||
        e.edu_id.toLowerCase().includes(search.toLowerCase())
    );

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

  const handleView = (edu) => {
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
  };

  const buildFormData = () => {
    const fd = new FormData();
    fd.append("edu_id", form.edu_id);
    fd.append("name", form.name);
    if (form.institution) fd.append("institution", form.institution);
    fd.append("email", form.email);
    fd.append("phone", form.phone);
    if (form.password.trim()) {
    fd.append("password", form.password);
  }
    if (photoFile) fd.append("photo", photoFile);
    return fd;
  };

  const handleInsert = async () => {
  if (!form.edu_id.trim()) return alert("Enter an Educator ID.");
  if (!form.name.trim()) return alert("Enter a name.");
  if (!form.password.trim()) return alert("Enter a password.");

  setLoading(true);
  setError("");

  try {
    const res = await fetch(`${API}/educators/`, {
      method: "POST",
      credentials: "include",
      body: buildFormData(),
    });

    const data = await res.json();

    if (!res.ok) {
      console.log("Backend Error:", data);
      alert(JSON.stringify(data, null, 2));
      throw new Error(JSON.stringify(data));
    }

    await fetchEducators();
    reset();

  } catch (e) {
    setError("Insert failed: " + e.message);
  } finally {
    setLoading(false);
  }
};

  const handleUpdate = async () => {
    if (!selected) return alert("Select a row first.");
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`${API}/educators/${selected.id}/`, {
        method: "PATCH",
        credentials: 'include',
        body: buildFormData(),
      });
      if (!res.ok) throw new Error(JSON.stringify(await res.json()));
      await fetchEducators();
      reset();
    } catch (e) {
      setError("Update failed: " + e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!selected) return alert("Select a row first.");
    if (!window.confirm(`Delete "${selected.name}"?`)) return;
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`${API}/educators/${selected.id}/`, {
        method: "DELETE",
        credentials: 'include',
      });
      if (!res.ok) throw new Error("Delete failed");
      await fetchEducators();
      reset();
    } catch (e) {
      setError("Delete failed: " + e.message);
    } finally {
      setLoading(false);
    }
  };

  const reset = () => {
    setForm({ edu_id: "", name: "", institution: "", email: "", phone: "" ,password: "",});
    setPhotoFile(null);
    setPhotoPreview(null);
    setSelected(null);
    if (fileRef.current) fileRef.current.value = "";
  };

  const styles = {
    pageTitle: { fontSize: "22px", fontWeight: "700", marginBottom: "0.5rem", color: "#111" },
    divider: { border: "none", borderTop: "1px solid #ddd", marginBottom: "1.5rem" },
    card: { background: "#fff", border: "1px solid #e0e0e0", borderRadius: "10px", padding: "1.5rem 2rem", marginBottom: "1.5rem" },
    sectionLabel: { fontSize: "11px", fontWeight: "600", color: "#999", letterSpacing: "1px", textTransform: "uppercase", marginBottom: "1.2rem" },
    fieldLabel: { display: "block", fontSize: "14px", fontWeight: "600", color: "#222", marginBottom: "6px" },
    input: { width: "100%", padding: "10px 14px", border: "1px solid #ddd", borderRadius: "6px", fontSize: "14px", color: "#333", background: "#fff", boxSizing: "border-box", outline: "none" },
    inputReadonly: { width: "100%", padding: "10px 14px", border: "1px solid #ddd", borderRadius: "6px", fontSize: "14px", color: "#888", background: "#f5f5f5", boxSizing: "border-box", outline: "none", cursor: "not-allowed" },
    select: { width: "100%", padding: "10px 14px", border: "1px solid #ddd", borderRadius: "6px", fontSize: "14px", color: "#333", background: "#fff", boxSizing: "border-box", outline: "none", cursor: "pointer" },
    fieldGroup: { marginBottom: "1.2rem" },
    row2: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.2rem", marginBottom: "1.2rem" },
    hrSection: { border: "none", borderTop: "1px solid #eee", margin: "1.2rem 0" },
    btnInsert: { padding: "9px 28px", fontSize: "14px", fontWeight: "600", background: "#2563eb", color: "#fff", border: "none", borderRadius: "7px", cursor: "pointer" },
    btnUpdate: { padding: "9px 28px", fontSize: "14px", fontWeight: "600", background: "#fff", color: "#b45309", border: "1.5px solid #f0c040", borderRadius: "7px", cursor: "pointer" },
    btnDelete: { padding: "9px 28px", fontSize: "14px", fontWeight: "600", background: "#fff", color: "#dc2626", border: "1.5px solid #fca5a5", borderRadius: "7px", cursor: "pointer" },
    photoCircle: { width: "60px", height: "60px", borderRadius: "50%", border: "2px dashed #bbb", background: "#f5f5f5", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", overflow: "hidden", flexShrink: 0 },
    tableCard: { background: "#fff", border: "1px solid #e0e0e0", borderRadius: "10px", overflow: "hidden" },
    tableHeader: { padding: "1rem 1.5rem 0.5rem" },
    th: { padding: "10px 16px", textAlign: "left", fontSize: "11px", fontWeight: "600", color: "#999", letterSpacing: "1px", textTransform: "uppercase", background: "#fafafa", borderBottom: "1px solid #eee" },
    td: { padding: "12px 16px", fontSize: "14px", color: "#333", borderBottom: "1px solid #f0f0f0" },
    viewBtn: { padding: "4px 14px", fontSize: "12px", border: "1px solid #ddd", borderRadius: "5px", background: "#f5f5f5", color: "#444", cursor: "pointer", fontWeight: 500 },
    errorBanner: { margin: "0 0 1rem", padding: "10px 16px", background: "#fef2f2", border: "1px solid #fca5a5", borderRadius: "6px", color: "#dc2626", fontSize: "13px", display: "flex", justifyContent: "space-between", alignItems: "center" },
  };

  return (
    <div style={{ background: "#f9f9f9", minHeight: "100vh" }}>
      <div className="max-w-4xl mx-auto p-6">
        <div style={styles.pageTitle}>Educator Management</div>
        <hr style={styles.divider} />

        {error && (
          <div style={styles.errorBanner}>
            <span>{error}</span>
            <button onClick={() => setError("")} style={{ background: "none", border: "none", cursor: "pointer", color: "#dc2626", fontWeight: 700, fontSize: "16px" }}>✕</button>
          </div>
        )}

        <div style={styles.card}>
          <div style={styles.sectionLabel}>Educator Management</div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr auto", gap: "1.2rem", marginBottom: "1.2rem", alignItems: "end" }}>
            <div>
              <label style={styles.fieldLabel}>Educator ID</label>
              <input style={selected ? styles.inputReadonly : styles.input} type="text" value={form.edu_id} onChange={set("edu_id")} placeholder="e.g. LNBTI239" readOnly={!!selected} />
            </div>
            <div>
              <label style={styles.fieldLabel}>Name</label>
              <input style={styles.input} type="text" value={form.name} onChange={set("name")} placeholder="Educator full name" />
            </div>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "4px" }}>
              <label style={{ ...styles.fieldLabel, fontSize: "12px", color: "#999" }}>Photo</label>
              <div style={styles.photoCircle} onClick={() => fileRef.current?.click()}>
                {photoPreview
                  ? <img src={photoPreview} alt="photo" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  : <span style={{ fontSize: "24px", color: "#bbb" }}>+</span>
                }
              </div>
              {photoPreview && (
                <button onClick={clearPhoto} style={{ fontSize: "11px", color: "#dc2626", background: "none", border: "none", cursor: "pointer", padding: 0 }}>Remove</button>
              )}
              <input ref={fileRef} type="file" accept="image/*" style={{ display: "none" }} onChange={handlePhotoChange} />
            </div>
          </div>

          <div style={styles.fieldGroup}>
            <label style={styles.fieldLabel}>Search Educator</label>
            <input style={styles.input} type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by name or ID..." />
          </div>

          <hr style={styles.hrSection} />
          <div style={styles.sectionLabel}>Contact Details</div>

          <div style={styles.row2}>
            <div>
              <label style={styles.fieldLabel}>Email</label>
              <input style={styles.input} type="email" value={form.email} onChange={set("email")} placeholder="email@example.com" />
            </div>
            <div>
              <label style={styles.fieldLabel}>Phone</label>
              <input style={styles.input} type="text" value={form.phone} onChange={set("phone")} placeholder="07X XXXXXXX" />
            </div>
          </div>
          <div style={styles.fieldGroup}>
          <label style={styles.fieldLabel}>
            Password
            {selected && (
              <span style={{ color: "#888", fontWeight: "normal" }}>
                {" "} (Leave blank to keep current password)
              </span>
            )}
          </label>

          <input
            style={styles.input}
            type="password"
            value={form.password}
            onChange={set("password")}
            placeholder={
              selected
                ? "Enter new password"
                : "Create a password"
            }
          />
        </div>

          <hr style={styles.hrSection} />
          <div style={styles.sectionLabel}>Institution Details</div>

          <div style={styles.fieldGroup}>
            <label style={styles.fieldLabel}>Institution</label>
            <select style={styles.select} value={form.institution} onChange={set("institution")}>
              <option value="">Select institution...</option>
              {institutions.map((i) => (
                <option key={i.id} value={i.id}>{i.name}</option>
              ))}
            </select>
          </div>

          <div style={{ display: "flex", gap: "10px", marginTop: "0.5rem" }}>
            <button onClick={handleInsert} disabled={loading} style={{ ...styles.btnInsert, opacity: loading ? 0.7 : 1 }}>{loading ? "..." : "Insert"}</button>
            <button onClick={handleUpdate} disabled={loading} style={{ ...styles.btnUpdate, opacity: loading ? 0.7 : 1 }}>{loading ? "..." : "Update"}</button>
            <button onClick={handleDelete} disabled={loading} style={{ ...styles.btnDelete, opacity: loading ? 0.7 : 1 }}>{loading ? "..." : "Delete"}</button>
            {selected && (
              <button onClick={reset} style={{ padding: "9px 18px", fontSize: "14px", background: "none", border: "1px solid #ddd", borderRadius: "7px", cursor: "pointer", color: "#666" }}>Clear</button>
            )}
          </div>
        </div>

        <div style={styles.tableCard}>
          <div style={styles.tableHeader}>
            <div style={styles.sectionLabel}>Educator List</div>
          </div>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "14px" }}>
            <thead>
              <tr>
                {["Photo", "Edu ID", "Name", "Institution", "Email", "Phone", "Action"].map((h) => (
                  <th key={h} style={styles.th}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((edu) => (
                <tr key={edu.edu_id} style={{ background: selected?.edu_id === edu.edu_id ? "#eff6ff" : "#fff" }}>
                  <td style={styles.td}>
                    {edu.photo
                      ? <img src={edu.photo} alt="" style={{ width: "34px", height: "34px", borderRadius: "50%", objectFit: "cover" }} />
                      : <div style={{ width: "34px", height: "34px", borderRadius: "50%", background: "#dbeafe", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "13px", color: "#2563eb", fontWeight: 600 }}>{edu.name.charAt(0)}</div>
                    }
                  </td>
                  <td style={{ ...styles.td, color: "#666" }}>{edu.edu_id}</td>
                  <td style={{ ...styles.td, fontWeight: 500 }}>{edu.name}</td>
                  <td style={{ ...styles.td, color: "#555" }}>{edu.institution_name || "-"}</td>
                  <td style={{ ...styles.td, color: "#555" }}>{edu.email}</td>
                  <td style={{ ...styles.td, color: "#555" }}>{edu.phone}</td>
                  <td style={styles.td}>
                    <button onClick={() => handleView(edu)} style={styles.viewBtn}>View</button>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={7} style={{ padding: "2.5rem", textAlign: "center", color: "#bbb", fontSize: "14px" }}>No educators found</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}