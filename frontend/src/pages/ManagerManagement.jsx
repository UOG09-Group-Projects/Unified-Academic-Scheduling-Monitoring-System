import { useState, useEffect } from "react";


const API = "http://localhost:8000/api";

function authFetch(url, options = {}) {
  return fetch(url, {
    ...options,
    credentials: 'include',
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
  });
}

export default function ManagerManagement() {
  const [managers, setManagers] = useState([]);
  const [institutions, setInstitutions] = useState([]);

  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    institution_id: "",
  });

  const [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchManagers();
    fetchInstitutions();
  }, []);

  const fetchManagers = async () => {
    try {
      const res = await authFetch(`${API}/managers/`);
      const data = await res.json();
      setManagers(data);
    } catch {
      setError("Could not load managers. Is the backend running?");
    }
  };

  // /institutions/ already filters by role on the backend
  const fetchInstitutions = async () => {
  try {
    const res = await authFetch(`${API}/institutions/`);
    if (!res.ok) {
      console.error('Institutions fetch failed:', res.status);
      return;
    }
    const data = await res.json();
    console.log('Institutions response:', data); // ← add this
    setInstitutions(Array.isArray(data) ? data : []);
  } catch (e) {
    console.error('Institutions error:', e);
  }
};

  const set = (key) => (e) =>
    setForm({ ...form, [key]: e.target.value });

  const handleView = (m) => {
    setSelected(m);
    setForm({
      name: m.name,
      email: m.user?.email || "",
      password: "",
      institution_id: m.institution?.id || "",
    });
  };

  const reset = () => {
    setForm({ name: "", email: "", password: "", institution_id: "" });
    setSelected(null);
  };

  const handleInsert = async () => {
  setLoading(true);
  setError("");
  try {
    const payload = {
      ...form,
      institution_id: parseInt(form.institution_id, 10), // ← parse to integer
    };
    const res = await authFetch(`${API}/managers/`, {
      method: "POST",
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(JSON.stringify(data));
    await fetchManagers();
    reset();
  } catch (e) {
    setError("Insert failed: " + e.message);
  } finally {
    setLoading(false);
  }
};

const handleUpdate = async () => {
  if (!selected) return alert("Select a manager first.");
  setLoading(true);
  setError("");
  try {
    const payload = {
      ...form,
      institution_id: parseInt(form.institution_id, 10), // ← parse to integer
    };
    const res = await authFetch(`${API}/managers/${selected.id}/`, {
      method: "PUT",
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(JSON.stringify(data));
    await fetchManagers();
    reset();
  } catch (e) {
    setError("Update failed: " + e.message);
  } finally {
    setLoading(false);
  }
};

  const handleDelete = async () => {
    if (!selected) return alert("Select a manager first.");
    if (!window.confirm("Delete this manager?")) return;
    setLoading(true);
    setError("");
    try {
      const res = await authFetch(`${API}/managers/${selected.id}/`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Delete failed");
      await fetchManagers();
      reset();
    } catch (e) {
      setError("Delete failed: " + e.message);
    } finally {
      setLoading(false);
    }
  };

  const styles = {
    pageTitle:    { fontSize: "22px", fontWeight: "700", marginBottom: "0.5rem", color: "#111" },
    divider:      { border: "none", borderTop: "1px solid #ddd", marginBottom: "1.5rem" },
    card:         { background: "#fff", border: "1px solid #e0e0e0", borderRadius: "10px", padding: "1.5rem 2rem", marginBottom: "1.5rem" },
    sectionLabel: { fontSize: "11px", fontWeight: "600", color: "#999", letterSpacing: "1px", textTransform: "uppercase", marginBottom: "1.2rem" },
    fieldLabel:   { display: "block", fontSize: "14px", fontWeight: "600", color: "#222", marginBottom: "6px" },
    input:        { width: "100%", padding: "10px 14px", border: "1px solid #ddd", borderRadius: "6px", fontSize: "14px", color: "#333", background: "#fff", boxSizing: "border-box", outline: "none" },
    select:       { width: "100%", padding: "10px 14px", border: "1px solid #ddd", borderRadius: "6px", fontSize: "14px", color: "#333", background: "#fff", boxSizing: "border-box", outline: "none" },
    row2:         { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.2rem", marginBottom: "1.2rem" },
    btnInsert:    { padding: "9px 28px", fontSize: "14px", fontWeight: "600", background: "#2563eb", color: "#fff", border: "none", borderRadius: "7px", cursor: "pointer" },
    btnUpdate:    { padding: "9px 28px", fontSize: "14px", fontWeight: "600", background: "#fff", color: "#b45309", border: "1.5px solid #f0c040", borderRadius: "7px", cursor: "pointer" },
    btnDelete:    { padding: "9px 28px", fontSize: "14px", fontWeight: "600", background: "#fff", color: "#dc2626", border: "1.5px solid #fca5a5", borderRadius: "7px", cursor: "pointer" },
    tableCard:    { background: "#fff", border: "1px solid #e0e0e0", borderRadius: "10px", overflow: "hidden" },
    th:           { padding: "10px 16px", textAlign: "left", fontSize: "11px", fontWeight: "600", color: "#999", textTransform: "uppercase", background: "#fafafa", borderBottom: "1px solid #eee" },
    td:           { padding: "12px 16px", fontSize: "14px", color: "#333", borderBottom: "1px solid #f0f0f0" },
    viewBtn:      { padding: "4px 14px", fontSize: "12px", border: "1px solid #ddd", borderRadius: "5px", background: "#f5f5f5", cursor: "pointer" },
    errorBanner:  { margin: "0 0 1rem", padding: "10px 16px", background: "#fef2f2", border: "1px solid #fca5a5", borderRadius: "6px", color: "#dc2626", fontSize: "13px", display: "flex", justifyContent: "space-between" },
  };

  return (
    <div style={{ background: "#f9f9f9", minHeight: "100vh" }}>
      <div className="max-w-4xl mx-auto p-6">
        <div style={styles.pageTitle}>Manager Management</div>
        <hr style={styles.divider} />

        {error && (
          <div style={styles.errorBanner}>
            <span>{error}</span>
            <button onClick={() => setError("")}>✕</button>
          </div>
        )}

        {/* FORM */}
        <div style={styles.card}>
          <div style={styles.sectionLabel}>Manager Details</div>

          <div style={styles.row2}>
            <div>
              <label style={styles.fieldLabel}>Name</label>
              <input style={styles.input} value={form.name} onChange={set("name")} />
            </div>
            <div>
              <label style={styles.fieldLabel}>Email</label>
              <input style={styles.input} value={form.email} onChange={set("email")} />
            </div>
          </div>

          <div style={styles.row2}>
            <div>
              <label style={styles.fieldLabel}>Password</label>
              <input style={styles.input} type="password" value={form.password} onChange={set("password")} />
            </div>
            <div>
              <label style={styles.fieldLabel}>Institution</label>
              <select style={styles.select} value={form.institution_id} onChange={set("institution_id")}>
                <option value="">Select</option>
                {institutions.map((i) => (
                  <option key={i.id} value={i.id}>{i.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div style={{ display: "flex", gap: "10px", marginTop: "10px" }}>
            <button onClick={handleInsert} disabled={loading} style={styles.btnInsert}>Insert</button>
            <button onClick={handleUpdate} disabled={loading} style={styles.btnUpdate}>Update</button>
            <button onClick={handleDelete} disabled={loading} style={styles.btnDelete}>Delete</button>
          </div>
        </div>

        {/* TABLE */}
        <div style={styles.tableCard}>
          <table width="100%">
            <thead>
              <tr>
                <th style={styles.th}>Name</th>
                <th style={styles.th}>Email</th>
                <th style={styles.th}>Institution</th>
                <th style={styles.th}>Action</th>
              </tr>
            </thead>
            <tbody>
              {managers.map((m) => (
                <tr key={m.id} style={{ background: selected?.id === m.id ? "#eff6ff" : "#fff" }}>
                  <td style={styles.td}>{m.name}</td>
                  <td style={styles.td}>{m.user?.email}</td>
                  <td style={styles.td}>{m.institution?.name}</td>
                  <td style={styles.td}>
                    <button onClick={() => handleView(m)} style={styles.viewBtn}>View</button>
                  </td>
                </tr>
              ))}
              {managers.length === 0 && (
                <tr>
                  <td colSpan="4" style={{ padding: 20, textAlign: "center" }}>No managers found</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}