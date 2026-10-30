import { useEffect, useState } from "react";
import { Sun, Moon, ToggleRight, ToggleLeft } from "lucide-react";

export function ThemeToggle() {
  const [darkMode, setDarkMode] = useState(() => {
    return localStorage.getItem("theme") === "dark";
  });

  useEffect(() => {
    document.documentElement.classList.toggle("dark", darkMode);

    localStorage.setItem("theme", darkMode ? "dark" : "light");
  }, [darkMode]);

  return (
    <button
      type="button"
      onClick={() => setDarkMode(!darkMode)}
      className="rounded-full border border-gray-300 p-2 transition hover:bg-gray-100 dark:border-gray-700 dark:hover:bg-gray-800"
      aria-label={darkMode ? "Switch to light mode" : "Switch to dark mode"}
    >
      {darkMode ? (
        <ToggleRight size={40} className="text-yellow-400 absolute" />
      ) : (
        <ToggleLeft size={40} className="text-gray-700 absolute" />
      )}
    </button>
  );
}

export default ThemeToggle;
