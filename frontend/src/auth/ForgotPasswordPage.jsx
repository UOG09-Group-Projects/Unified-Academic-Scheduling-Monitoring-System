import { useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import axios from "axios";
import AuthShell from "./AuthShell";
import { Input } from "../components/ui/Field";
import Button from "../components/ui/Button";
import { CheckCircle2 } from "lucide-react";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      await axios.post("http://localhost:8000/api/auth/forgot-password/", { email });
      setSent(true);
    } catch (err) {
      setError(err.response?.data?.error || "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell title="Forgot password" subtitle="Enter your email to receive a reset link">
      {sent ? (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center flex flex-col items-center gap-3"
        >
          <div className="w-12 h-12 rounded-full bg-emerald-50 flex items-center justify-center text-success">
            <CheckCircle2 size={22} />
          </div>
          <p className="text-ink-soft text-sm">If this email exists, a reset link has been sent.</p>
          <Link to="/login" className="text-sm text-ocean-700 hover:underline mt-2">
            Back to login
          </Link>
        </motion.div>
      ) : (
        <>
          {error && (
            <div className="mb-5 px-4 py-3 bg-red-50 border border-red-200 text-danger rounded-lg text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <Input
              label="Email address"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
            />

            <Button type="submit" variant="ocean" size="md" disabled={loading} className="w-full">
              {loading ? "Sending…" : "Send reset link"}
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
