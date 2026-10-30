import React from "react";
import ThemeToggle from "../constants/ThemeToggle";

const Login = () => {
  return (
    <main className="flex  min-h-screen w-full bg-[#F8FAFC] dark:bg-[#0B1117] dark:text-white transition-colors duration-300">
      {/* toggle */}
      <div className="absolute right-16 top-2">
        <ThemeToggle />
      </div>
      {/* left side */}
      <div className="relative flex  min-h-screen w-full flex-col bg-[#F6F9FC] px-8 py-6 sm:px-12 lg:px-18 dark:bg-[#0B1117]">
        {/* Logo section */}
        <div className="flex items-center gap-3">
          {/* Logo icon */}
          <div className="flex h-13 w-13 items-center justify-center rounded-xl border border-gray-200 bg-white">
            <img
              src="/Sentinel AI Hexagon Logo.png"
              alt="Sentinel AI Logo"
              className="h-12 w-12 object-contain"
            />
          </div>

          {/* Brand name */}
          <h1 className="text-3xl font-bold tracking-tight text-[#0F172A] dark:text-white">
            Sentinel <span className="text-[#2DD4BF]">AI</span>
          </h1>
        </div>

        {/* Main content */}

        <div className="my-auto mt-24   py-16">
          <h2 className="w-max max-w-none text-[40px] dark:text-white leading-[1.3] font-inter font-semibold tracking-tight text-[#0F172A]">
            <span className="block whitespace-nowrap">
              Real alerts. Real evidence.
            </span>
            <span className="block whitespace-nowrap">Nothing faked.</span>
          </h2>

          <ul className="mt-10 space-y-3 font-family-jetbrains text-lg dark:text-[#9AA9BA] font-semibold text-[#64748B] sm:text-xl">
            <li className="flex items-center gap-2 whitespace-nowrap">
              <span className="text-[#2DD4BF]">•</span>
              <span>Sensor → Collector → Detection → Alert</span>
            </li>

            <li className="flex items-center gap-2 whitespace-nowrap">
              <span className="text-[#2DD4BF]">•</span>
              <span>Rules first, machine learning second</span>
            </li>

            <li className="flex items-center gap-2 whitespace-nowrap">
              <span className="text-[#2DD4BF]">•</span>
              <span>Evidence attached to every alert</span>
            </li>
          </ul>
        </div>
      </div>
      {/* right side  */}
      <div className="flex  min-h-screen w-full items-center dark:bg-[#0B1117] dark:text-white justify-center bg-[#FFFFFF] px-6 py-12 border border-[#E2E8F0] dark:border-[#2B3A4B] sm:px-12 lg:px-[74px]">
        <div className="w-full mt-12 max-w-130">
          {/* Heading */}
          <div className="mb-7">
            <h1 className="text-4xl font-inter font-semibold tracking-tight dark:text-white text-[#0F172A]">
              Welcome Back
            </h1>

            <p className="mt-1 text-base font-inter font-medium text-[#64748B] dark:text-[#9AA9BA]">
              log in to view your alerts and investigations.
            </p>
          </div>

          {/* Login form */}
          <form className="space-y-6">
            {/* Email */}
            <div>
              <label
                htmlFor="email"
                className="mb-2 block text-base font-inter  font-semibold text-[#111827] dark:text-white"
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
                className="w-full rounded-lg border border-[#E2E8F0] dark:text-white dark:bg-[#2B3A4B] bg-[#F6F9FC] px-4 py-3 text-base text-[#111827] outline-none transition placeholder:text-[#64748B] focus:border-[#20CDB9] dark:border-[#2B3A4B] dark:placeholder:text-[#9AA9BA] focus:ring-2 focus:ring-[#20CDB9]/20"
              />
            </div>

            {/* Password */}
            <div>
              <label
                htmlFor="password"
                className="mb-2 block text-base font-inter font-semibold text-[#111827] dark:text-white"
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
                className="w-full rounded-lg border border-[#E2E8F0] dark:bg-[#2B3A4B] bg-[#F6F9FC] px-4 py-3 text-base text-[#111827] outline-none transition placeholder:text-[#64748B] focus:border-[#20CDB9] dark:border-[#2B3A4B] dark:placeholder:text-[#9AA9BA] dark:text-white focus:ring-2 focus:ring-[#20CDB9]/20"
              />

              {/* Forgot password */}
              <div className="mt-2 flex justify-end">
                <a
                  href="/forgot-password"
                  className="text-sm font-semibold text-[#2DD4BF] transition hover:text-[#0FAE9D]"
                >
                  Forgot Password?
                </a>
              </div>
            </div>

            {/* Remember me */}
            <div className="flex items-center gap-2">
              <input
                id="remember"
                name="remember"
                type="checkbox"
                className="h-5 w-5 cursor-pointer accent-[#2DD4BF] focus:outline-none focus:ring-2 focus:ring-[#20CDB9] focus:ring-offset-2"
              />

              <label
                htmlFor="remember"
                className="cursor-pointer text-sm text-[#111827] dark:text-white"
              >
                Keep me logged in on this device
              </label>
            </div>

            {/* Login button */}
            <button
              type="submit"
              className="mt-5 w-full rounded-lg bg-[#2DD4BF] px-4 py-3 text-lg font-semibold text-white transition hover:bg-[#19BDAA] focus:outline-none focus:ring-2 focus:ring-[#20CDB9] focus:ring-offset-2"
            >
              Login
            </button>
          </form>

          {/* Create account */}
          <p className="mt-7 text-center text-base font-medium text-[#64748B]">
            New here?{" "}
            <a
              href="/register"
              className="font-semibold text-[#2DD4BF] transition hover:text-[#0FAE9D]"
            >
              Create an account
            </a>
          </p>
        </div>
      </div>
    </main>
  );
};

export default Login;
