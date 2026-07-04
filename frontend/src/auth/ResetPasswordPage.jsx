import { useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import axios from "axios";

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
      await axios.post("http://localhost:8000/api/auth/reset-password/", {
        token,
        password,
      });

      setSuccess(true);

      setTimeout(() => {
        navigate("/login");
      }, 2000);

    } catch (err) {
      setError(
        err.response?.data?.error ||
        "Reset failed. Link may be expired."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100
                    flex items-center justify-center p-4">

      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-8">

        {/* HEADER (same as login) */}
        <div className="text-center mb-8">
          <div className="w-14 h-14 bg-blue-600 rounded-2xl flex items-center
                          justify-center mx-auto mb-4">
            <span className="text-white text-2xl font-bold">A</span>
          </div>

          <h1 className="text-2xl font-bold text-gray-800">Reset Password</h1>
          <p className="text-sm text-gray-500 mt-1">
            Enter your new password
          </p>
        </div>

        {success ? (
          <p className="text-green-600 text-sm text-center">
            Password updated successfully. Redirecting...
          </p>
        ) : (
          <>
            {error && (
              <div className="mb-5 px-4 py-3 bg-red-50 border border-red-200
                              text-red-700 rounded-lg text-sm">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  New Password
                </label>

                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="w-full border border-gray-300 rounded-lg px-3 py-2.5
                             text-sm focus:outline-none focus:ring-2 focus:ring-blue-500
                             focus:border-transparent"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white
                           font-medium rounded-lg text-sm disabled:opacity-50
                           transition-colors"
              >
                {loading ? "Resetting..." : "Reset Password"}
              </button>

              <div className="text-right">
                <Link
                  to="/login"
                  className="text-sm text-blue-600 hover:underline"
                >
                  Back to login
                </Link>
              </div>

            </form>
          </>
        )}

      </div>
    </div>
  );
}