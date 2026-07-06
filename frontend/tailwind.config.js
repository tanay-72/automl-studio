/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        paper: "#FAF7F0",
        paper2: "#F2EDE0",
        ink: "#1F2430",
        ink2: "#4A4F5C",
        line: "#E3DCC8",
        indigo: {
          DEFAULT: "#4F46E5",
          50: "#EEECFD",
          100: "#DCD9FB",
          600: "#4F46E5",
          700: "#3F37C9",
        },
        teal: {
          DEFAULT: "#0F9B8E",
          50: "#E6F7F5",
        },
        amber: {
          DEFAULT: "#D97706",
          50: "#FDF3E3",
        },
        rose: {
          DEFAULT: "#DC2626",
          50: "#FCEAEA",
        },
      },
      fontFamily: {
        display: ["Space Grotesk", "sans-serif"],
        body: ["Inter", "sans-serif"],
        mono: ["JetBrains Mono", "monospace"],
      },
      boxShadow: {
        card: "0 1px 2px rgba(31,36,48,0.04), 0 1px 12px rgba(31,36,48,0.06)",
      },
    },
  },
  plugins: [],
};
