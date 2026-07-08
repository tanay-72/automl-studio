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
          400: "#8B84EF",
          500: "#635BEA",
          600: "#4F46E5",
          700: "#3F37C9",
        },
        violet: {
          DEFAULT: "#7C3AED",
          50: "#F3EEFE",
          500: "#8B5CF6",
          600: "#7C3AED",
        },
        teal: {
          DEFAULT: "#0F9B8E",
          50: "#E6F7F5",
          600: "#0F9B8E",
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
        soft: "0 2px 6px rgba(31,36,48,0.05), 0 12px 28px -8px rgba(31,36,48,0.10)",
        lift: "0 8px 20px -6px rgba(31,36,48,0.14), 0 2px 8px rgba(31,36,48,0.06)",
        glow: "0 10px 30px -8px rgba(79,70,229,0.5), 0 2px 8px rgba(79,70,229,0.25)",
        "glow-teal": "0 10px 30px -8px rgba(15,155,142,0.45), 0 2px 8px rgba(15,155,142,0.2)",
        "inner-line": "inset 0 0 0 1px rgba(227,220,200,0.8)",
      },
      backgroundImage: {
        "brand-gradient": "linear-gradient(135deg, #4F46E5 0%, #7C3AED 100%)",
        "brand-gradient-hover": "linear-gradient(135deg, #4338CA 0%, #6D28D9 100%)",
        "brand-gradient-soft": "linear-gradient(135deg, #EEECFD 0%, #F3EEFE 100%)",
        "teal-gradient": "linear-gradient(135deg, #0F9B8E 0%, #14B8A6 100%)",
        "mesh-glow":
          "radial-gradient(60% 50% at 15% 0%, rgba(124,58,237,0.10) 0%, rgba(124,58,237,0) 60%), radial-gradient(50% 40% at 100% 10%, rgba(79,70,229,0.10) 0%, rgba(79,70,229,0) 60%), radial-gradient(40% 40% at 85% 90%, rgba(15,155,142,0.07) 0%, rgba(15,155,142,0) 60%)",
      },
      borderRadius: {
        xl: "0.875rem",
        "2xl": "1.25rem",
      },
      keyframes: {
        fadeInUp: {
          "0%": { opacity: 0, transform: "translateY(10px)" },
          "100%": { opacity: 1, transform: "translateY(0)" },
        },
        fadeIn: {
          "0%": { opacity: 0 },
          "100%": { opacity: 1 },
        },
        shimmer: {
          "0%": { backgroundPosition: "-400px 0" },
          "100%": { backgroundPosition: "400px 0" },
        },
        floatSlow: {
          "0%, 100%": { transform: "translateY(0) translateX(0)" },
          "50%": { transform: "translateY(-14px) translateX(8px)" },
        },
      },
      animation: {
        "fade-in-up": "fadeInUp 0.5s cubic-bezier(0.16, 1, 0.3, 1) both",
        "fade-in": "fadeIn 0.4s ease-out both",
        shimmer: "shimmer 1.6s infinite linear",
        "float-slow": "floatSlow 9s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};
