/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
          // Keep legacy accents for compatibility
          blue: '#4f7cff',
          purple: '#7c3aed',
          cyan: '#06b6d4',
          gold: '#fbbf24',
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        // Keep legacy dark-bg for compatibility
        'dark-bg': {
          primary: '#0a0e27',
          secondary: '#0f1420',
          card: '#1a1f35',
          hover: '#232945',
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      backgroundImage: {
        'gradient-purple': 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        'gradient-blue': 'linear-gradient(135deg, #4f7cff 0%, #7c3aed 100%)',
        'gradient-dark': 'linear-gradient(180deg, #0a0e27 0%, #1a1f35 100%)',
        'gradient-radial': 'radial-gradient(circle at 50% 0%, rgba(79, 124, 255, 0.1) 0%, transparent 50%)',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0) translateX(0)' },
          '33%': { transform: 'translateY(-20px) translateX(10px)' },
          '66%': { transform: 'translateY(10px) translateX(-10px)' },
        },
      },
      animation: {
        float: 'float 10s ease-in-out infinite',
      },
    },
  },
  plugins: [],
}
