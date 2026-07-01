import { useState, useRef, useEffect } from "react";

const API = "http://127.0.0.1:8000/api";

const C = {
  bg: "#F0F3FA",
  white: "#FFFFFF",
  primary: "#395886",
  secondary: "#638ECB",
  accent: "#8AAEE0",
  border: "#D5DEEF",
  highlight: "#B1C9EF",
};

const inp = {
  width: "100%",
  padding: "8px 12px",
  border: `1px solid ${C.border}`,
  borderRadius: "6px",
  fontSize: "14px",
  outline: "none",
  background: C.bg,
  color: "#333",
  boxSizing: "border-box",
};

const lbl = {
  fontSize: "13px",
  color: C.primary,
  fontWeight: 500,
  display: "block",
  marginBottom: "4px",
};

export default function EducatorManagement() {
  const [educators, setEducators] = useState([]);
  const [institutions, setInstitutions] = useState([]);
  const [form, setForm] = useState({ edu_id: "", name: "", institution: "", email: "", phone: "" });
  const [photoFile, setPhotoFile] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);
  const [showUser, setShowUser] = useState(false);
  const [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const fileRef = useRef();

  // Load educators and institutions on mount
  useEffect(() => {
    fetchEducators();
    fetchInstitutions();
  }, []);

  const fetchEducators = async () => {
    try {
      const res = await fetch(`${API}/educators/`);
      const data = await res.json();
      setEducators(data);
    } catch {
      setError("Could not load educators. Is the backend running?");
    }
  };

  const fetchInstitutions = async () => {
    try {
      const res = await fetch(`${API}/institutions/`);
      const data = await res.json();
      setInstitutions(data);
    } catch {
      // institutions API may not be ready yet — silently ignore
    }
  };

  const sorted = [...educators].sort((a, b) => a.edu_id > b.edu_id ? -1 : 1);
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
    });
  };

  const buildFormData = () => {
    const fd = new FormData();
    fd.append("edu_id", form.edu_id);
    fd.append("name", form.name);
    if (form.institution) fd.append("institution", form.institution);
    fd.append("email", form.email);
    fd.append("phone", form.phone);
    if (photoFile) fd.append("photo", photoFile);
    return fd;
  };

  const handleInsert = async () => {
    if (!form.edu_id.trim()) return alert("Enter an Educator ID.");
    if (!form.name.trim()) return alert("Enter a name.");
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`${API}/educators/`, {
        method: "POST",
        body: buildFormData(),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(JSON.stringify(err));
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
        body: buildFormData(),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(JSON.stringify(err));
      }
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
      const res = await fetch(`${API}/educators/${selected.id}/`, { method: "DELETE" });
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
    setForm({ edu_id: "", name: "", institution: "", email: "", phone: "" });
    setPhotoFile(null);
    setPhotoPreview(null);
    setSelected(null);
    if (fileRef.current) fileRef.current.value = "";
  };

  return (
    <div style={{ background: C.bg, minHeight: "100vh", margin: 0, padding: 0, boxSizing: "border-box" }}>

      {/* Header */}
      <div style={{ padding: "1.5rem 2rem 1rem", borderBottom: `2px solid ${C.border}`, background: C.white }}>
        <h1 style={{ color: C.primary, fontSize: "20px", fontWeight: 600, margin: 0 }}>
          Educator Management
        </h1>
      </div>

      {/* Error banner */}
      {error && (
        <div style={{ margin: "1rem 2rem 0", padding: "10px 16px", background: "#fdecea", border: "1px solid #f5c6cb", borderRadius: "6px", color: "#c0392b", fontSize: "13px" }}>
          {error}
          <button onClick={() => setError("")} style={{ float: "right", background: "none", border: "none", cursor: "pointer", color: "#c0392b", fontWeight: 700 }}>✕</button>
        </div>
      )}

      {/* Form card */}
      <div style={{ margin: "1.5rem 2rem 1rem", background: C.white, border: `1px solid ${C.border}`, borderRadius: "10px", padding: "1.5rem" }}>

        {/* Edu ID + Name + Photo */}
        <div style={{ display: "grid", gridTemplateColumns: "200px 1fr auto", gap: "1rem", marginBottom: "1rem", alignItems: "end" }}>
          <div>
            <label style={lbl}>Educator ID</label>
            <input
              style={{ ...inp, background: selected ? "#eee" : C.bg, cursor: selected ? "not-allowed" : "text" }}
              type="text"
              value={form.edu_id}
              onChange={set("edu_id")}
              placeholder="e.g. LNBTI239"
              readOnly={!!selected}
            />
          </div>
          <div>
            <label style={lbl}>Name</label>
            <input style={inp} type="text" value={form.name} onChange={set("name")} placeholder="Educator full name" />
          </div>
          {/* Photo upload */}
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "6px" }}>
            <label style={{ ...lbl, textAlign: "center" }}>Photo</label>
            <div
              onClick={() => fileRef.current?.click()}
              style={{
                width: "64px", height: "64px", borderRadius: "50%",
                border: `2px dashed ${C.accent}`, background: C.bg,
                display: "flex", alignItems: "center", justifyContent: "center",
                cursor: "pointer", overflow: "hidden", flexShrink: 0,
              }}
            >
              {photoPreview
                ? <img src={photoPreview} alt="photo" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                : <span style={{ fontSize: "22px", color: C.accent }}>+</span>
              }
            </div>
            {photoPreview && (
              <button onClick={clearPhoto} style={{ fontSize: "11px", color: "#c0392b", background: "none", border: "none", cursor: "pointer", padding: 0 }}>
                Remove
              </button>
            )}
            <input ref={fileRef} type="file" accept="image/*" style={{ display: "none" }} onChange={handlePhotoChange} />
          </div>
        </div>

        {/* Institution + Email */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", marginBottom: "1rem" }}>
          <div>
            <label style={lbl}>Institution</label>
            <select style={inp} value={form.institution} onChange={set("institution")}>
              <option value="">Select institution</option>
              {institutions.map((i) => (
                <option key={i.id} value={i.id}>{i.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label style={lbl}>Email</label>
            <input style={inp} type="email" value={form.email} onChange={set("email")} placeholder="email@example.com" />
          </div>
        </div>

        {/* Phone */}
        <div style={{ marginBottom: "1rem" }}>
          <label style={lbl}>Phone</label>
          <input style={{ ...inp, width: "40%" }} type="text" value={form.phone} onChange={set("phone")} placeholder="07X XXXXXXX" />
        </div>

        {/* User details toggle */}
        <div style={{ borderTop: `1px solid ${C.border}`, paddingTop: "1rem" }}>
          <button onClick={() => setShowUser(!showUser)} style={{ fontSize: "13px", color: C.secondary, fontWeight: 500, background: "none", border: "none", cursor: "pointer", padding: 0 }}>
            {showUser ? "▾" : "▸"} User details
          </button>
          {showUser && (
            <div style={{ marginTop: "1rem", padding: "12px", background: C.bg, borderRadius: "6px", fontSize: "13px", color: "#888" }}>
              User login accounts are managed separately.
            </div>
          )}
        </div>
      </div>

      {/* Buttons */}
      <div style={{ display: "flex", justifyContent: "flex-end", gap: "8px", padding: "0 2rem", marginBottom: "1rem" }}>
        <button onClick={handleInsert} disabled={loading} style={{ padding: "8px 22px", fontSize: "13px", fontWeight: 500, background: C.primary, color: "#fff", border: "none", borderRadius: "6px", cursor: loading ? "not-allowed" : "pointer", opacity: loading ? 0.7 : 1 }}>
          {loading ? "..." : "Insert"}
        </button>
        <button onClick={handleUpdate} disabled={loading} style={{ padding: "8px 22px", fontSize: "13px", fontWeight: 500, background: C.secondary, color: "#fff", border: "none", borderRadius: "6px", cursor: loading ? "not-allowed" : "pointer", opacity: loading ? 0.7 : 1 }}>
          {loading ? "..." : "Update"}
        </button>
        <button onClick={handleDelete} disabled={loading} style={{ padding: "8px 22px", fontSize: "13px", fontWeight: 500, background: "#c0392b", color: "#fff", border: "none", borderRadius: "6px", cursor: loading ? "not-allowed" : "pointer", opacity: loading ? 0.7 : 1 }}>
          {loading ? "..." : "Delete"}
        </button>
      </div>

      {/* Table */}
      <div style={{ background: C.white, borderTop: `1px solid ${C.border}`, borderBottom: `1px solid ${C.border}` }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
          <thead>
            <tr style={{ background: C.primary }}>
              {["Photo", "Edu ID", "Name", "Institution", "Email", "Phone", "Action"].map((h) => (
                <th key={h} style={{ padding: "10px 16px", textAlign: h === "Action" ? "center" : "left", color: "#fff", fontWeight: 500, fontSize: "12px" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sorted.map((edu, idx) => (
              <tr key={edu.edu_id} style={{ borderBottom: `1px solid ${C.border}`, background: idx % 2 === 0 ? C.white : C.bg }}>
                <td style={{ padding: "8px 16px" }}>
                  {edu.photo
                    ? <img src={edu.photo} alt="" style={{ width: "36px", height: "36px", borderRadius: "50%", objectFit: "cover" }} />
                    : <div style={{ width: "36px", height: "36px", borderRadius: "50%", background: C.highlight, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "12px", color: C.primary, fontWeight: 600 }}>
                        {edu.name.charAt(edu.name.indexOf(" ") + 1) || edu.name.charAt(0)}
                      </div>
                  }
                </td>
                <td style={{ padding: "10px 16px", color: "#666", fontWeight: 500 }}>{edu.edu_id}</td>
                <td style={{ padding: "10px 16px", color: "#333", fontWeight: 500 }}>{edu.name}</td>
                <td style={{ padding: "10px 16px", color: "#555" }}>{edu.institution_name || "-"}</td>
                <td style={{ padding: "10px 16px", color: "#555" }}>{edu.email}</td>
                <td style={{ padding: "10px 16px", color: "#555" }}>{edu.phone}</td>
                <td style={{ padding: "10px 16px", textAlign: "center" }}>
                  <button onClick={() => handleView(edu)} style={{ padding: "4px 14px", fontSize: "12px", border: `1px solid ${C.accent}`, borderRadius: "4px", background: C.highlight, color: C.primary, cursor: "pointer", fontWeight: 500 }}>
                    View
                  </button>
                </td>
              </tr>
            ))}
            {sorted.length === 0 && (
              <tr><td colSpan={7} style={{ padding: "2rem", textAlign: "center", color: "#aaa" }}>No educators found</td></tr>
            )}
          </tbody>
        </table>
      </div>

    </div>
  );
}
