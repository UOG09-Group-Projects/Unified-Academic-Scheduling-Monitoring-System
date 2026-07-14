import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import authService from '../auth/services/authService';

//const TEMP_EMAIL = 'demo@lightlearn.com';
//const TEMP_PASSWORD = '123456';

export default function LoginPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    email: '',
    password: ''
  });

  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);


  const handleChange = (e) => {
    setForm(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };


  const handleSubmit = async (e) => {
  e.preventDefault();

  setError(null);
  setLoading(true);

  try {
    const user = await authService.login(form.email, form.password);

    // Save logged in user
    localStorage.setItem("user", JSON.stringify(user));

    const role = user.role.toLowerCase();

    switch (role) {
      case "owner":
        navigate("/dashboard/owner");
        break;

      case "admin":
        navigate("/dashboard/super-admin");
        break;

      case "manager":
        navigate("/dashboard/manager");
        break;

      case "educator":
        navigate("/dashboard/educator");
        break;

      case "student":
        navigate("/dashboard/student");
        break;

      case "parent":
        navigate("/dashboard/parent");
        break;

      default:
        navigate("/");
    }

  } catch (err) {
    setError(
      err.response?.data?.message ||
      err.response?.data?.error ||
      "Invalid email or password."
    );
  } finally {
    setLoading(false);
  }
};


  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100
                    flex items-center justify-center p-4">

      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-8">


        <div className="text-center mb-8">

          <div className="w-14 h-14 bg-blue-600 rounded-2xl 
                          flex items-center justify-center mx-auto mb-4">
            <span className="text-white text-2xl font-bold">
              L
            </span>
          </div>

          <h1 className="text-2xl font-bold text-gray-800">
            LightLearn
          </h1>

          <p className="text-sm text-gray-500 mt-1">
            Sign in to your account
          </p>

        </div>


        {error && (
          <div className="mb-5 px-4 py-3 bg-red-50 border border-red-200
                          text-red-700 rounded-lg text-sm">
            {error}
          </div>
        )}



        <form onSubmit={handleSubmit} className="space-y-4">


          <div>

            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email address
            </label>

            <input
              type="email"
              name="email"
              value={form.email}
              onChange={handleChange}
              placeholder="you@example.com"
              required
              className="w-full border border-gray-300 rounded-lg px-3 py-2.5
                         text-sm focus:outline-none focus:ring-2
                         focus:ring-blue-500 focus:border-transparent"
            />

          </div>



          <div>

            <label className="block text-sm font-medium text-gray-700 mb-1">
              Password
            </label>

            <input
              type="password"
              name="password"
              value={form.password}
              onChange={handleChange}
              placeholder="••••••••"
              required
              className="w-full border border-gray-300 rounded-lg px-3 py-2.5
                         text-sm focus:outline-none focus:ring-2
                         focus:ring-blue-500 focus:border-transparent"
            />

          </div>



          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 bg-blue-600 hover:bg-blue-700
                       text-white font-medium rounded-lg text-sm
                       disabled:opacity-50 transition-colors mt-2"
          >

            {loading ? 'Signing in...' : 'Sign In'}

          </button>



          <div className="text-right">

            <Link
              to="/forgot-password"
              className="text-sm text-blue-600 hover:underline"
            >
              Forgot password?
            </Link>

          </div>


        </form>



        <p className="text-center text-xs text-gray-400 mt-6">

          Contact your administrator if you don't have an account.

        </p>


      </div>

    </div>
  );
}