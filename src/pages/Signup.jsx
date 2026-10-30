import { useMemo, useState } from "react";
import ThemeToggle from "../constants/ThemeToggle";

const STEPS = [
  {
    title: "Create your account",
    text: "Choose a role that fits how you will use the dashboard.",
  },
  {
    title: "Confirm the sensor can see traffic",
    text: "Visibility is verified before any detection is trusted.",
  },
  {
    title: "Review your first real alert",
    text: "Evidence, severity and method, all in one place.",
  },
];

const LEVELS = ["", "weak", "fair", "good", "strong"];

function getStrength(pw) {
  if (!pw) return 0;
  let score = 0;
  if (pw.length >= 12) score++;
  if (/[a-z]/.test(pw) && /[A-Z]/.test(pw)) score++;
  if (/\d/.test(pw)) score++;
  if (/[^A-Za-z0-9]/.test(pw)) score++;
  return Math.max(score, 1);
}

const inputClass =
  "w-full rounded-lg border border-[#475569] bg-[#F8FAFC] px-4 py-3 text-base text-[#0F172A] outline-none transition placeholder:text-[#64748B] focus:border-[#20CDB9] focus:ring-2 focus:ring-[#20CDB9]/20 dark:border-[#263241] dark:bg-[#111922] dark:text-white dark:placeholder:text-[#9AA9BA]";

const labelClass =
  "mb-2 block text-base font-inter font-semibold text-[#0F172A] dark:text-white";

const Signup = () => {
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [agreed, setAgreed] = useState(false);
  const [error, setError] = useState("");

  const strength = useMemo(() => getStrength(form.password), [form.password]);

  const handleChange = (e) =>
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const handleSubmit = (e) => {
    e.preventDefault();
    if (form.password.length < 12) {
      return setError("Password must be at least 12 characters.");
    }
    if (!agreed) {
      return setError("Please confirm the testing agreement to continue.");
    }
    setError("");
    // TODO: call your signup API here
    console.log("Signing up:", form);
  };

  return (
    <main className="flex min-h-screen w-full bg-[#F8FAFC] transition-colors duration-300 dark:bg-[#0A0E13] dark:text-white">
      {/* toggle */}
      <div className="absolute right-16 top-2 z-10">
        <ThemeToggle />
      </div>

      {/* left side */}
      <div className="relative hidden min-h-screen w-full flex-col border-r border-[#E2E8F0] bg-[#F8FAFC] px-8 py-6 sm:px-12 md:flex lg:px-18 dark:border-[#1F2A37] dark:bg-[#111922]">
        {/* Logo section */}
        <div className="flex items-center gap-3">
          <div className="flex h-13 w-13 items-center justify-center rounded-xl border border-gray-200 bg-white dark:border-[#1F2A37] dark:bg-[#0A0E13]">
            <img
              src="/Sentinel AI Hexagon Logo.png"
              alt="Sentinel AI Logo"
              className="h-12 w-12 object-contain"
            />
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-[#0F172A] dark:text-white">
            Sentinel <span className="text-[#2DD4BF]">AI</span>
          </h1>
        </div>

        {/* Main content */}
        <div className="my-auto py-16">
          <h2 className="font-inter text-[40px] font-semibold leading-[1.3] tracking-tight text-[#0F172A] dark:text-white">
            Set up your security
            <br />
            workspace in minutes.
          </h2>

          <ol className="mt-10 space-y-4">
            {STEPS.map((step, i) => (
              <li key={step.title} className="flex gap-3">
                <span className="pt-1 text-sm text-[#2DD4BF]">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <div className="flex flex-col gap-1 font-family-jetbrains">
                  <p className="text-lg font-medium text-[#0F172A] dark:text-white">
                    {step.title}
                  </p>
                  <p className="text-lg text-[#64748B] dark:text-[#9AA9BA]">
                    {step.text}
                  </p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </div>

      {/* right side */}
      <div className="flex min-h-screen w-full items-center justify-center bg-white px-6 py-12 sm:px-12 lg:px-[74px] dark:bg-[#0A0E13]">
        <div className="w-full max-w-130">
          {/* Heading */}
          <div className="mb-7">
            <h1 className="font-inter text-4xl font-semibold tracking-tight text-[#0F172A] dark:text-white">
              Create your account
            </h1>
            <p className="mt-1 text-base font-medium text-[#64748B] dark:text-[#9AA9BA]">
              Start monitoring your lab network.
            </p>
          </div>

          <form className="space-y-6" onSubmit={handleSubmit} noValidate>
            {/* Full name */}
            <div>
              <label htmlFor="name" className={labelClass}>
                Full name
              </label>
              <input
                id="name"
                name="name"
                type="text"
                placeholder="Your name"
                autoComplete="name"
                value={form.name}
                onChange={handleChange}
                required
                className={inputClass}
              />
            </div>

            {/* Email */}
            <div>
              <label htmlFor="email" className={labelClass}>
                Email
              </label>
              <input
                id="email"
                name="email"
                type="email"
                placeholder="you@example.com"
                autoComplete="email"
                value={form.email}
                onChange={handleChange}
                required
                className={inputClass}
              />
            </div>

            {/* Password + strength meter */}
            <div>
              <label htmlFor="password" className={labelClass}>
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                placeholder="At least 12 characters"
                autoComplete="new-password"
                value={form.password}
                onChange={handleChange}
                required
                className={inputClass}
              />

              <div className="mt-3 grid grid-cols-4 gap-3" aria-hidden="true">
                {[1, 2, 3, 4].map((n) => (
                  <span
                    key={n}
                    className={`h-1 rounded-full transition-colors ${
                      n <= strength
                        ? "bg-[#2DD4BF]"
                        : "bg-[#B7EFE7] dark:bg-[#14524C]"
                    }`}
                  />
                ))}
              </div>

              <p
                aria-live="polite"
                className="mt-2 min-h-5 text-sm text-[#64748B] dark:text-[#9AA9BA]"
              >
                {strength > 0 && strength < 4
                  ? `Strength: ${LEVELS[strength]}. Add a symbol or more length to strengthen it.`
                  : strength === 4
                    ? "Strength: strong."
                    : ""}
              </p>
            </div>

            {/* Agreement */}
            <div className="flex items-start gap-2">
              <input
                id="agree"
                name="agree"
                type="checkbox"
                checked={agreed}
                onChange={(e) => setAgreed(e.target.checked)}
                className="mt-0.5 h-5 w-5 shrink-0 cursor-pointer accent-[#2DD4BF] focus:outline-none focus:ring-2 focus:ring-[#20CDB9] focus:ring-offset-2"
              />
              <label
                htmlFor="agree"
                className="cursor-pointer text-sm leading-snug text-[#0F172A] dark:text-white"
              >
                I will only test on networks and devices I own or have
                permission to test, and I will use fictional data.
              </label>
            </div>

            {error && (
              <p role="alert" className="text-sm font-medium text-red-500">
                {error}
              </p>
            )}

            {/* Submit */}
            <button
              type="submit"
              className="w-full rounded-lg bg-[#2DD4BF] px-4 py-3 text-lg font-semibold text-white transition hover:bg-[#19BDAA] focus:outline-none focus:ring-2 focus:ring-[#20CDB9] focus:ring-offset-2 dark:text-[#0A0E13]"
            >
              Create account
            </button>
          </form>

          {/* Login link */}
          <p className="mt-7 text-center text-base font-medium text-[#64748B] dark:text-[#9AA9BA]">
            Already have an account?{" "}
            <a
              href="/login"
              className="font-semibold text-[#2DD4BF] transition hover:text-[#0FAE9D]"
            >
              Log in
            </a>
          </p>
        </div>
      </div>
    </main>
  );
};

export default Signup;