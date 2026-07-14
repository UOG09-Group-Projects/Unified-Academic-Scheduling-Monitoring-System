import { useState, useEffect } from "react";
import RoleForm from "../components/roles/RoleForm";
import { fetchRoles, fetchPermissions, deleteRole } from "../services/roleService";

export default function OwnerDashboard() {
  const [roles, setRoles] = useState([]);
  const [permissionGroups, setPermissionGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingRole, setEditingRole] = useState(null);
  const [activeTab, setActiveTab] = useState("roles");

  useEffect(() => {
    let ignore = false;
    async function load() {
      try {
        const [r, p] = await Promise.all([fetchRoles(), fetchPermissions()]);
        if (!ignore) {
          setRoles(r);
          setPermissionGroups(p);
        }
      } finally {
        if (!ignore) setLoading(false);
      }
    }
    load();
    return () => { ignore = true; };
  }, []);

  const handleFormSuccess = (saved) => {
    setRoles((prev) => {
      const exists = prev.find((r) => r.id === saved.id);
      return exists
        ? prev.map((r) => (r.id === saved.id ? saved : r))
        : [...prev, saved];
    });
    setShowForm(false);
    setEditingRole(null);
  };

  const handleEdit = (role) => {
    setEditingRole(role);
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (!confirm("Delete this role? This cannot be undone.")) return;
    await deleteRole(id);
    setRoles((prev) => prev.filter((r) => r.id !== id));
  };

  const formatName = (name) =>
    name.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

  const TABS = ["roles", "permissions"];

  return (
    <div className="min-h-screen bg-[#F7F9FC]">
      {/* Top bar */}
      <header className="bg-white border-b border-[#D5DEEF] px-8 py-4 flex items-center justify-between">
        <div>
          <p className="text-xs text-[#638ECB] font-medium uppercase tracking-wider">LightLearn</p>
          <h1 className="text-lg font-semibold text-[#395886]">Owner Dashboard</h1>
        </div>
        <div className="w-8 h-8 rounded-full bg-[#395886] flex items-center justify-center text-white text-sm font-semibold">
          O
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-8 py-8 space-y-6">
        {/* Tabs */}
        <div className="flex gap-1 border-b border-[#D5DEEF]">
          {TABS.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 text-sm font-medium capitalize transition-colors border-b-2 -mb-px ${
                activeTab === tab
                  ? "border-[#395886] text-[#395886]"
                  : "border-transparent text-gray-400 hover:text-gray-600"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {loading ? (
          <p className="text-sm text-gray-400">Loading…</p>
        ) : (
          <>
            {/* Roles tab */}
            {activeTab === "roles" && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-sm font-semibold text-gray-600">
                    {roles.length} role{roles.length !== 1 ? "s" : ""}
                  </h2>
                  {!showForm && (
                    <button
                      onClick={() => { setEditingRole(null); setShowForm(true); }}
                      className="px-4 py-1.5 bg-[#395886] text-white text-sm rounded-lg hover:bg-[#2d4570] transition-colors"
                    >
                      + New Role
                    </button>
                  )}
                </div>

                {/* Form */}
                {showForm && (
                  <RoleForm
                    key={editingRole?.id ?? "new"}
                    editingRole={editingRole}
                    permissionGroups={permissionGroups}
                    onSuccess={handleFormSuccess}
                    onCancel={() => { setShowForm(false); setEditingRole(null); }}
                  />
                )}

                {/* Roles table */}
                <div className="bg-white border border-[#D5DEEF] rounded-xl overflow-hidden">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-[#F0F3FA] border-b border-[#D5DEEF]">
                        <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                          Role
                        </th>
                        <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                          Permissions
                        </th>
                        <th className="px-5 py-3" />
                      </tr>
                    </thead>
                    <tbody>
                      {roles.map((role, i) => (
                        <tr
                          key={role.id}
                          className={`border-b border-[#F0F3FA] last:border-0 ${
                            i % 2 === 0 ? "bg-white" : "bg-[#FAFBFD]"
                          }`}
                        >
                          <td className="px-5 py-3 font-medium text-[#395886] capitalize">
                            {role.name}
                          </td>
                          <td className="px-5 py-3 text-gray-500 tabular-nums">
                            {role.permissions.length} permission{role.permissions.length !== 1 ? "s" : ""}
                          </td>
                          <td className="px-5 py-3 text-right">
                            <button
                              onClick={() => handleEdit(role)}
                              className="text-xs text-[#638ECB] hover:text-[#395886] mr-4 transition-colors"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => handleDelete(role.id)}
                              className="text-xs text-red-400 hover:text-red-600 transition-colors"
                            >
                              Delete
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Permissions tab — read-only browse */}
            {activeTab === "permissions" && (
              <div className="space-y-4">
                {permissionGroups.map((group) => (
                  <div
                    key={group.module}
                    className="bg-white border border-[#D5DEEF] rounded-xl overflow-hidden"
                  >
                    <div className="px-5 py-3 bg-[#F0F3FA] border-b border-[#D5DEEF]">
                      <span className="text-xs font-semibold text-[#395886] uppercase tracking-wider">
                        {group.module}
                      </span>
                    </div>
                    <div className="px-5 py-3 flex flex-wrap gap-2">
                      {group.permissions.map((p) => (
                        <span
                          key={p.id}
                          className="px-2.5 py-1 text-xs bg-[#F0F3FA] text-[#638ECB] rounded-full border border-[#D5DEEF]"
                        >
                          {formatName(p.name)}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}