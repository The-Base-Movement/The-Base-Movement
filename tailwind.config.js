/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ["class"],
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        "primary": {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        "background": "hsl(var(--background))",
        "foreground": "hsl(var(--foreground))",
        "secondary": {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        "destructive": {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        "muted": {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        "accent": {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        "popover": {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        "card": {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        "brand-green": "hsl(var(--brand-green))",
        "brand-gold": "hsl(var(--brand-gold))",
        "brand-red": "hsl(var(--brand-red))",
        "warm-gold": "hsl(var(--brand-gold))",
        "charcoal-dark": "hsl(var(--charcoal-dark))",
        "surface": "hsl(var(--background))",
        "surface-bright": "hsl(var(--surface-bright))",
        "surface-dim": "hsl(var(--surface-dim))",
        "surface-variant": "hsl(var(--surface-variant))",
        "on-surface": "hsl(var(--on-surface))",
        "on-background": "hsl(var(--on-surface))",
        "on-surface-muted": "hsl(var(--on-surface-muted))",
        "on-surface-variant": "hsl(var(--on-surface-variant))",
        "outline-variant": "hsl(var(--outline-variant))",
        "divider-gold": "hsl(var(--divider-gold))",
        "off-white": "hsl(var(--background))",
        "surface-warm": "hsl(var(--surface-warm))",
        "muted-gray": "hsl(var(--on-surface-muted))",
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
      },
      borderRadius: {
        "DEFAULT": "var(--radius)",
        "lg": "var(--radius-lg)",
        "xl": "var(--radius-xl)",
        "full": "9999px",
        md: "calc(var(--radius-lg) - 2px)",
        sm: "calc(var(--radius-lg) - 4px)",
      },
      spacing: {
        "section-padding-desktop": "var(--stack-lg, 96px)",
        "stack-lg": "32px",
        "container-max": "1280px",
        "stack-md": "16px",
        "gutter": "24px",
        "section-padding-mobile": "40px",
        "stack-sm": "8px"
      },
      fontFamily: {
        "sans": ["Public Sans", "Work Sans", "ui-sans-serif", "system-ui", "sans-serif"],
        "body-md": ["Work Sans"],
        "meta": ["Public Sans"],
        "brand": ["Public Sans"],
      },
      fontSize: {
        "micro": ["var(--fs-micro)", {"lineHeight": "1.4", "fontWeight": "700"}],
        "tiny": ["var(--fs-tiny)", {"lineHeight": "1.4", "fontWeight": "700"}],
        "xs": ["var(--fs-xs)", {"lineHeight": "1.4"}],
        "sm": ["var(--fs-sm)", {"lineHeight": "1.4"}],
        "base": ["var(--fs-base)", {"lineHeight": "1.5"}],
        "lg": ["var(--fs-lg)", {"lineHeight": "1.5"}],
        "xl": ["var(--fs-xl)", {"lineHeight": "1.2"}],
        "2xl": ["var(--fs-2xl)", {"lineHeight": "1.1"}],
        "3xl": ["var(--fs-3xl)", {"lineHeight": "1.1"}],
        "4xl": ["var(--fs-4xl)", {"lineHeight": "1.0"}],
        "h1": ["var(--h1-size)", {"lineHeight": "1.1", "letterSpacing": "-0.02em", "fontWeight": "800"}],
        "h2": ["var(--h2-size)", {"lineHeight": "1.2", "letterSpacing": "-0.01em", "fontWeight": "700"}],
        "h3": ["var(--h3-size)", {"lineHeight": "1.3", "fontWeight": "600"}],
      },
      boxShadow: {
        xs: "0 1px 2px 0 rgb(0 0 0 / 0.05)",
        movement: "0 4px 20px -2px hsla(var(--on-surface), 0.05)",
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
        "caret-blink": {
          "0%,70%,100%": { opacity: "1" },
          "20%,50%": { opacity: "0" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "caret-blink": "caret-blink 1.25s ease-out infinite",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
}