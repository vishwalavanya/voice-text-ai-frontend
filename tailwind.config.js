/** @type {import('tailwindcss').Config} */
export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: {
          950: "#03050B",
          900: "#070B17",
          800: "#0D1324"
        },
        pulse: {
          cyan: "#12D6DF",
          mint: "#50F5B3",
          blue: "#3E70FF",
          coral: "#FF6B6B"
        }
      },
      fontFamily: {
        display: ["Sora", "system-ui", "sans-serif"],
        body: ["IBM Plex Sans", "system-ui", "sans-serif"]
      },
      boxShadow: {
        glow: "0 0 0 1px rgba(18, 214, 223, 0.28), 0 0 35px rgba(18, 214, 223, 0.22)",
        card: "0 14px 50px rgba(3, 5, 11, 0.45)"
      },
      keyframes: {
        shimmer: {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" }
        },
        float: {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%": { transform: "translateY(-4px)" }
        }
      },
      animation: {
        shimmer: "shimmer 2.8s linear infinite",
        float: "float 3s ease-in-out infinite"
      },
      backgroundImage: {
        "dashboard-grid":
          "linear-gradient(rgba(62, 112, 255, 0.08) 1px, transparent 1px), linear-gradient(90deg, rgba(62, 112, 255, 0.08) 1px, transparent 1px)"
      }
    }
  },
  plugins: []
};
