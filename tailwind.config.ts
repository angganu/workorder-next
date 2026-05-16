import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./node_modules/react-tailwindcss-datepicker/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  darkMode: "class",
  theme: {
    extend: {},
  },
  safelist: [
    // Padding: all sides, vertical, horizontal, top, bottom, left, right — 0 to 6
    ...["p", "px", "py", "pt", "pb", "pl", "pr"].flatMap((prefix) =>
      [0, 1, 2, 3, 4, 5, 6].map((n) => `${prefix}-${n}`)
    ),
    // Margin: all sides, vertical, horizontal, top, bottom, left, right — 0 to 6
    ...["m", "mx", "my", "mt", "mb", "ml", "mr"].flatMap((prefix) =>
      [0, 1, 2, 3, 4, 5, 6].map((n) => `${prefix}-${n}`)
    ),
    
  ],
  plugins: [],
};

export default config;
