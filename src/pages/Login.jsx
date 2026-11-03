import { useState } from "react";
import { useNavigate } from "react-router";
import ThemeToggle from "../constants/ThemeToggle";
import { api, saveSession } from "../lib/api";

const Brand = () => (
  <div className="flex items-center gap-3">
    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-gray-200 bg-white sm:h-13 sm:w-13 dark:border-[#2B3A4B]">
      <img
        src="/Sentinel AI Hexagon Logo.png"
        alt="Sentinel AI Logo"
        className="h-10 w-10 object-contain sm:h-12 sm:w-12"
      />
    </div>

    <h1 className="text-2xl font-bold tracking-tight text-[#0F172A] sm:text-3xl dark:text-white">
      Sentinel <span className="text-[#2DD4BF]">AI</span>
    </h1>
  </div>
);

const Login = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const data = await api.login(email, password);
      saveSession(data.access_token, data.user);
      navigate("/home");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="relative flex min-h-dvh w-full items-center justify-center bg-[#F8FAFC] px-4 py-12 transition-colors duration-300 dark:bg-[#0B1117] dark:text-white">
      {/* Theme Toggle */}
      <div className="absolute right-4 top-4 z-10">
        <ThemeToggle />
      </div>

      {/* Login Form */}
      <section className="w-full max-w-[420px]">
        {/* Brand Logo */}
        <div className="mb-10">
          <Brand />
        </div>

        <div className="mb-7">
          <h1 className="font-inter text-3xl font-semibold tracking-tight text-[#0F172A] sm:text-4xl dark:text-white">
            Welcome Back
          </h1>

          <p className="mt-1 font-inter text-sm font-medium text-[#64748B] sm:text-base dark:text-[#9AA9BA]">
            Log in to view your alerts and investigations.
          </p>
        </div>

        <form
          className="space-y-5 sm:space-y-6"
          onSubmit={handleSubmit}
          noValidate
        >
          <div>
            <label
              htmlFor="email"
              className="mb-2 block font-inter text-base font-semibold text-[#111827] dark:text-white"
            >
              Email
            </label>

            <input
              id="email"
              name="email"
              type="email"
              placeholder="you@example.com"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-lg border border-[#E2E8F0] bg-[#F6F9FC] px-4 py-3 text-base text-[#111827] outline-none transition placeholder:text-[#64748B] focus:border-[#20CDB9] focus:ring-2 focus:ring-[#20CDB9]/20 dark:border-[#2B3A4B] dark:bg-[#2B3A4B] dark:text-white dark:placeholder:text-[#9AA9BA]"
            />
          </div>

          <div>
            <label
              htmlFor="password"
              className="mb-2 block font-inter text-base font-semibold text-[#111827] dark:text-white"
            >
              Password
            </label>

            <input
              id="password"
              name="password"
              type="password"
              placeholder="Enter your password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-lg border border-[#E2E8F0] bg-[#F6F9FC] px-4 py-3 text-base text-[#111827] outline-none transition placeholder:text-[#64748B] focus:border-[#20CDB9] focus:ring-2 focus:ring-[#20CDB9]/20 dark:border-[#2B3A4B] dark:bg-[#2B3A4B] dark:text-white dark:placeholder:text-[#9AA9BA]"
            />

            <div className="mt-2 flex justify-end">
              <a
                href="/forgot-password"
                className="text-sm font-semibold text-[#2DD4BF] transition hover:text-[#0FAE9D]"
              >
                Forgot Password?
              </a>
            </div>
          </div>

          {error && (
            <p role="alert" className="text-sm font-medium text-red-500">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="mt-2 w-full rounded-lg bg-[#2DD4BF] px-4 py-3 text-base font-semibold text-white transition hover:bg-[#19BDAA] focus:outline-none focus:ring-2 focus:ring-[#20CDB9] focus:ring-offset-2 disabled:opacity-60 sm:mt-5 sm:text-lg"
          >
            {loading ? "Signing in..." : "Login"}
          </button>
        </form>

        <p className="mt-7 text-center text-sm font-medium text-[#64748B] sm:text-base dark:text-[#9AA9BA]">
          New here?{" "}
          <a
            href="/signup"
            className="font-semibold text-[#2DD4BF] transition hover:text-[#0FAE9D]"
          >
            Create an account
          </a>
        </p>
      </section>
    </main>
  );
};

export default Login;
