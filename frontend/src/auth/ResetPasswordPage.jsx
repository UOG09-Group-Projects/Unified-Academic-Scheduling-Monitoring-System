import { useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import axios from "axios";
import AuthShell from "./AuthShell";
import { Input } from "../components/ui/Field";
import Button from "../components/ui/Button";

export default function ResetPassword() {
  const { token } = useParams();
  const navigate = useNavigate();

  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      await axios.post("http://localhost:8000/api/auth/reset-password/", { token, password });
      setSuccess(true);
      setTimeout(() => navigate("/login"), 2000);
    } catch (err) {
      setError(err.response?.data?.error || "Reset failed. Link may be expired.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell title="Reset password" subtitle="Enter your new password">
      {success ? (
        <p className="text-success text-sm text-center">Password updated successfully. Redirecting…</p>
      ) : (
        <>
          {error && (
            <div className="mb-5 px-4 py-3 bg-red-50 border border-red-200 text-danger rounded-lg text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <Input
              label="New password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
            />

            <Button type="submit" variant="ocean" size="md" disabled={loading} className="w-full">
              {loading ? "Resetting…" : "Reset password"}
            </Button>

            <div className="text-right">
              <Link to="/login" className="text-sm text-ocean-700 hover:underline">
                Back to login
              </Link>
            </div>
          </form>
        </>
      )}
    </AuthShell>
  );
}
