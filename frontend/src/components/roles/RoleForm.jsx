import { useState } from "react";
import PermissionTransfer from "./PermissionTransfer";
import { createRole, updateRole } from "../../services/roleService";

const DEFAULT_ROLES = ["owner", "admin", "manager", "educator", "student", "parent"];

// editingRole: null (create mode) or { id, name, permissions: [ids] }
// permissionGroups: [{ module, permissions: [{id, name}] }]
// onSuccess: (role) => void
// onCancel: () => void
export default function RoleForm({ editingRole, permissionGroups, onSuccess, onCancel }) {
  const isEditing = !!editingRole;

  // Derive initial values directly — no useEffect needed
  const initialRoleName = editingRole
    ? (DEFAULT_ROLES.includes(editingRole.name) ? editingRole.name : "custom")
    : "";
  const initialCustomName = editingRole
    ? (DEFAULT_ROLES.includes(editingRole.name) ? "" : editingRole.name)
    : "";
  const initialPerms = editingRole
    ? new Set(editingRole.permissions)
    : new Set();

  const [roleName, setRoleName] = useState(initialRoleName);
  const [customName, setCustomName] = useState(initialCustomName);
  const [selectedPerms, setSelectedPerms] = useState(initialPerms);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  const resolvedName =
    roleName === "custom" ? customName.trim() : roleName;

  const handleSubmit = async () => {
    setError(null);
    if (!resolvedName) {
      setError("Please select or enter a role name.");
      return;
    }
    setSaving(true);
    try {
      const payload = {
        name: resolvedName,
        permissions: [...selectedPerms],
      };
      const saved = isEditing
        ? await updateRole(editingRole.id, payload)
        : await createRole(payload);
      onSuccess(saved);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="bg-white border border-[#D5DEEF] rounded-xl p-6 space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-base font-semibold text-[#395886]">
          {isEditing ? "Edit Role" : "Create New Role"}
        </h2>
        <p className="text-xs text-gray-400 mt-0.5">
          {isEditing
            ? "Update the role name and its permission set."
            : "Choose a role and assign the permissions it should have."}
        </p>
      </div>

      {/* Role selector */}
      <div className="space-y-2">
        <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider">
          Role
        </label>
        <div className="flex flex-wrap gap-2">
          {DEFAULT_ROLES.map((r) => (
            <button
              key={r}
              onClick={() => { setRoleName(r); setCustomName(""); }}
              className={`px-4 py-1.5 rounded-full text-sm font-medium border transition-colors capitalize ${
                roleName === r
                  ? "bg-[#395886] text-white border-[#395886]"
                  : "bg-white text-[#395886] border-[#B1C9EF] hover:border-[#638ECB]"
              }`}
            >
              {r}
            </button>
          ))}
          <button
            onClick={() => setRoleName("custom")}
            className={`px-4 py-1.5 rounded-full text-sm font-medium border transition-colors ${
              roleName === "custom"
                ? "bg-[#395886] text-white border-[#395886]"
                : "bg-white text-[#395886] border-[#B1C9EF] hover:border-[#638ECB]"
            }`}
          >
            + Custom
          </button>
        </div>

        {roleName === "custom" && (
          <input
            type="text"
            placeholder="Enter custom role name"
            value={customName}
            onChange={(e) => setCustomName(e.target.value)}
            className="mt-2 w-full max-w-xs text-sm px-3 py-2 border border-[#D5DEEF] rounded-lg focus:outline-none focus:border-[#638ECB]"
          />
        )}
      </div>

      {/* Permission transfer */}
      <div className="space-y-2">
        <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider">
          Permissions
          <span className="ml-2 text-[#638ECB] normal-case font-normal">
            {selectedPerms.size} assigned
          </span>
        </label>
        <PermissionTransfer
          groups={permissionGroups}
          selected={selectedPerms}
          onChange={setSelectedPerms}
        />
      </div>

      {/* Error */}
      {error && (
        <p className="text-sm text-red-500 bg-red-50 border border-red-200 rounded-lg px-4 py-2">
          {error}
        </p>
      )}

      {/* Actions */}
      <div className="flex items-center gap-3 pt-1">
        <button
          onClick={handleSubmit}
          disabled={saving}
          className="px-5 py-2 bg-[#395886] text-white text-sm font-medium rounded-lg hover:bg-[#2d4570] transition-colors disabled:opacity-50"
        >
          {saving ? "Saving…" : isEditing ? "Save Changes" : "Create Role"}
        </button>
        <button
          onClick={onCancel}
          className="px-5 py-2 text-sm text-gray-500 hover:text-gray-700 transition-colors"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}