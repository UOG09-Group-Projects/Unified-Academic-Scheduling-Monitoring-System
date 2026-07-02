// src/pages/BatchManagement.jsx

import { useState, useEffect, useCallback } from "react";
import { batchService } from "../services/batchService";
import { getAllInstitutions } from "../services/institutionService";
import BatchTable from "../components/BatchTable";

const initialForm = { name: "", institution: "" };

export default function BatchManagement() {
  const [batches, setBatches] = useState([]);
  const [institutions, setInstitutions] = useState([]);
  const [form, setForm] = useState(initialForm);
  const [selectedId, setSelectedId] = useState(null);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const triggerRefresh = useCallback(() => {
    setRefreshKey((prev) => prev + 1);
  }, []);

  // Load institutions
  useEffect(() => {
    getAllInstitutions()
      .then(setInstitutions)
      .catch((err) => console.error("Failed to load institutions:", err));
  }, []);

  // Load batches
  useEffect(() => {
    let cancelled = false;

    const loadBatches = async () => {
      setLoading(true);
      try {
        const data = await batchService.getAll(search);
        if (!cancelled) setBatches(data);
      } catch (err) {
        if (!cancelled) setError(err.message || "Failed to load batches.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    loadBatches();
    return () => { cancelled = true; };
  }, [search, refreshKey]);

  const handleRowClick = (batch) => {
    setSelectedId(batch.id);
    setForm({ name: batch.name, institution: batch.institution });
    setError("");
    setConfirmDelete(false);
  };

  const handleInsert = async () => {
    if (!form.name.trim() || !form.institution) {
      setError("Batch name and institution are required.");
      return;
    }
    try {
      await batchService.create(form);
      resetForm();
      triggerRefresh();
    } catch {
      setError("Failed to insert batch.");
    }
  };

  const handleUpdate = async () => {
    if (!selectedId) { setError("Select a row to update."); return; }
    if (!form.name.trim() || !form.institution) {
      setError("Batch name and institution are required.");
      return;
    }
    try {
      await batchService.update(selectedId, form);
      resetForm();
      triggerRefresh();
    } catch {
      setError("Failed to update batch.");
    }
  };

  const handleDelete = async () => {
    if (!selectedId) { setError("Select a row to delete."); return; }
    if (!confirmDelete) { setConfirmDelete(true); return; }
    try {
      await batchService.delete(selectedId);
      resetForm();
      triggerRefresh();
    } catch {
      setError("Failed to delete batch.");
    }
  };

  const resetForm = () => {
    setForm(initialForm);
    setSelectedId(null);
    setError("");
    setConfirmDelete(false);
  };

  return (
    <div className="min-h-screen bg-white p-8">
      <div className="max-w-4xl mx-auto space-y-6">

        {/* Page Title */}
        <div className="border-b pb-3">
          <h1 className="text-2xl font-bold text-gray-800">Batch Management</h1>
        </div>

        {/* Main Form Card */}
        <div className="border border-gray-200 rounded-lg p-6 space-y-6">

          {/* Section: Batch Management */}
          <div>
            <p className="text-xs font-semibold tracking-widest text-gray-400 uppercase mb-4">
              Batch Management
            </p>

            {/* Batch Name */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Batch Name
              </label>
              <input
                type="text"
                placeholder="Batch Name"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-blue-400"
              />
            </div>

            {/* Search */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Search Batch
              </label>
              <input
                type="text"
                placeholder="Search by name..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-blue-400"
              />
            </div>
          </div>

          {/* Divider */}
          <hr className="border-gray-200" />

          {/* Section: Institution Details */}
          <div>
            <p className="text-xs font-semibold tracking-widest text-gray-400 uppercase mb-4">
              Institution Details
            </p>

            {/* Institution Dropdown */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Institution
              </label>
              <select
                value={form.institution}
                onChange={(e) => setForm({ ...form, institution: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm text-gray-700 focus:outline-none focus:ring-1 focus:ring-blue-400"
              >
                <option value="">Select institution...</option>
                {institutions.map((inst) => (
                  <option key={inst.id} value={inst.id}>
                    {inst.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <p className="text-sm text-red-500">{error}</p>
          )}

          {/* Confirm Delete Banner */}
          {confirmDelete && (
            <div className="text-sm px-4 py-2 rounded-md bg-yellow-50 text-yellow-700 border border-yellow-300">
              Are you sure? Click <strong>Delete</strong> again to confirm.
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3 pt-2">
            <button
              onClick={handleInsert}
              className="px-6 py-2 rounded-md text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 transition-colors"
            >
              Insert
            </button>
            <button
              onClick={handleUpdate}
              className="px-6 py-2 rounded-md text-sm font-semibold text-yellow-700 bg-yellow-100 hover:bg-yellow-200 border border-yellow-300 transition-colors"
            >
              Update
            </button>
            <button
              onClick={handleDelete}
              className={`px-6 py-2 rounded-md text-sm font-semibold transition-colors ${
                confirmDelete
                  ? "text-white bg-red-600 hover:bg-red-700"
                  : "text-red-600 bg-red-50 hover:bg-red-100 border border-red-300"
              }`}
            >
              Delete
            </button>
            {selectedId && (
              <button
                onClick={resetForm}
                className="px-6 py-2 rounded-md text-sm font-semibold text-gray-600 bg-gray-100 hover:bg-gray-200 border border-gray-300 transition-colors"
              >
                Clear
              </button>
            )}
          </div>
        </div>

        {/* Batch List Section */}
        <div className="border border-gray-200 rounded-lg overflow-hidden">
          {/* Section Label */}
          <div className="px-6 py-4 border-b border-gray-200">
            <p className="text-xs font-semibold tracking-widest text-gray-400 uppercase">
              Batch List
            </p>
          </div>

          {loading ? (
            <div className="px-6 py-10 text-center text-sm text-gray-400">
              Loading...
            </div>
          ) : (
            <BatchTable
              batches={batches}
              selectedId={selectedId}
              onRowClick={handleRowClick}
            />
          )}
        </div>

      </div>
    </div>
  );
}