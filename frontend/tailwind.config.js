/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        tercelet: {
          bg: "#f5f3ee",
          surface: "#ffffff",
          subtle: "#fcfbf8",
          fg: "#111318",
          muted: "#62666f",
          faint: "#8f94a0",
          border: "rgba(17, 19, 24, 0.08)",
          borderHover: "rgba(17, 19, 24, 0.16)",
          brand: "#3157f6",
          brandHover: "#2446d8",
          brandSoft: "#e8edff",
          proof: "#c9f45b",
          proofInk: "#31430a",
          coral: "#ff6b55",
          coralSoft: "#ffe8e3",
          amber: "#f59e0b",
          amberSoft: "#fdfaf2",
          mintSoft: "#f5fbf8",
          blueSoft: "#f6f9fe",
          peachSoft: "#fef8f4",
        }
      },
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'system-ui', '-apple-system', 'sans-serif'],
        editorial: ['"Newsreader"', 'ui-serif', 'Georgia', 'serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'monospace'],
      },
      boxShadow: {
        'card': '0 1px 3px rgba(17, 19, 24, 0.04), 0 12px 36px -8px rgba(17, 19, 24, 0.08)',
        'card-hover': '0 4px 6px rgba(17, 19, 24, 0.04), 0 20px 48px -12px rgba(17, 19, 24, 0.12)',
        'brand-btn': '0 1px 2px rgba(17, 19, 24, 0.08), 0 4px 14px rgba(49, 87, 246, 0.28)',
      },
    },
  },
  plugins: [],
}
