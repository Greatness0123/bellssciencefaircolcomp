import { useState } from "react";
import { Link } from "react-router";
import ThemeToggle from "../constants/ThemeToggle";

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

const ForgotPassword = () => {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess(false);

    if (!email.trim()) {
      setError("Please enter your email address.");
      return;
    }

    setLoading(true);

    try {
      // Connect your forgot password API here.
      console.log("Password reset requested for:", email);

      setSuccess(true);
    } catch (err) {
      setError(err.message || "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="relative flex min-h-dvh w-full items-center justify-center bg-white px-4 py-12 transition-colors duration-300 sm:px-8 dark:bg-[#0B1117] dark:text-white">
      {/* Theme Toggle */}
      <div className="absolute right-4 top-4 z-10 sm:right-8 sm:top-6">
        <ThemeToggle />
      </div>

      {/* Forgot Password Form */}
      <section className="flex w-full max-w-130 flex-col justify-center">
        {/* Logo */}
        <div className="mb-10 flex justify-center">
          <Brand />
        </div>

        {/* Heading */}
        <div className="mb-7">
          <h1 className="font-inter text-3xl font-semibold tracking-tight text-[#0F172A] sm:text-4xl dark:text-white">
            Forgot Password?
          </h1>

          <p className="mt-2 font-inter text-sm font-medium text-[#64748B] sm:text-base dark:text-[#9AA9BA]">
            No worries! Enter your email address and we'll send you a link to
            reset your password.
          </p>
        </div>

        <form className="space-y-6" onSubmit={handleSubmit} noValidate>
          {/* Email */}
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

          {/* Error */}
          {error && (
            <p role="alert" className="text-sm font-medium text-red-500">
              {error}
            </p>
          )}

          {/* Success */}
          {success && (
            <p className="text-sm font-medium text-[#0FAE9D]">
              If an account exists with this email, you'll receive password
              reset instructions.
            </p>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-[#2DD4BF] px-4 py-3 text-base font-semibold text-white transition hover:bg-[#19BDAA] focus:outline-none focus:ring-2 focus:ring-[#20CDB9] focus:ring-offset-2 disabled:opacity-60 sm:text-lg"
          >
            {loading ? "Sending..." : "Send Reset Link"}
          </button>
        </form>

        {/* Back to Login */}
        <p className="mt-7 text-center text-sm font-medium text-[#64748B] sm:text-base dark:text-[#9AA9BA]">
          Remember your password?{" "}
          <Link
            to="/login"
            className="font-semibold text-[#2DD4BF] transition hover:text-[#0FAE9D]"
          >
            Back to Login
          </Link>
        </p>
      </section>
    </main>
  );
};

export default ForgotPassword;
