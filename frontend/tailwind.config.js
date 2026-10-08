/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        display: ['Inter', 'sans-serif'],
      },
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "#0B65FE",
          hover: "#004BCC",
          foreground: "#FFFFFF",
        },
        secondary: {
          DEFAULT: "#7C3AED",
          hover: "#6D28D9",
          foreground: "#FFFFFF",
        },
        destructive: {
          DEFAULT: "#EF4444",
          foreground: "#FFFFFF",
        },
        muted: {
          DEFAULT: "#F3F4F6",
          foreground: "#667085",
        },
        card: {
          DEFAULT: "#FFFFFF",
          foreground: "#111827",
        },
        success: {
          DEFAULT: "#10B981",
          foreground: "#FFFFFF",
          subtle: "#D1FAE5",
          text: "#065F46"
        },
        warning: {
          DEFAULT: "#F59E0B",
          foreground: "#FFFFFF",
          subtle: "#FEF3C7",
          text: "#92400E"
        },
        danger: {
          subtle: "#FEE2E2",
          text: "#991B1B"
        }
      },
      borderRadius: {
        'sm': '8px',
        'md': '10px',
        'lg': '12px',
        'xl': '16px',
        '2xl': '20px',
      },
      boxShadow: {
        'subtle': '0 2px 8px rgba(15,23,42,0.04)',
      },
      spacing: {
        '1': '4px',
        '2': '8px',
        '3': '12px',
        '4': '16px',
        '5': '20px',
        '6': '24px',
        '8': '32px',
        '10': '40px',
        '12': '48px',
        '16': '64px',
        '20': '80px',
      }
    },
  },
  plugins: [],
}
