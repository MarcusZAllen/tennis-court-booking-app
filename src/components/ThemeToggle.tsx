
import * as React from "react";

const ThemeToggle = () => {
  const [theme, setTheme] = React.useState(() =>
    window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light"
  );

  React.useEffect(() => {
    document.documentElement.classList.toggle("dark", theme === "dark");
    localStorage.setItem("theme", theme);
  }, [theme]);

  React.useEffect(() => {
    // Rehydrate stored theme
    const stored = localStorage.getItem("theme");
    if (stored) setTheme(stored);
  }, []);

  return (
    <button
      onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
      className="ml-2 h-10 w-10 rounded-xl border-4 border-black flex items-center justify-center bg-tennis-green text-white hover:bg-warm-accent transition-colors dark:bg-background dark:text-tennis-green"
      aria-label="Toggle theme"
      title="Toggle dark/light mode"
      type="button"
    >
      <span className="text-lg" aria-hidden>
        {theme === "dark" ? "☀️" : "🌙"}
      </span>
    </button>
  );
};

export default ThemeToggle;
