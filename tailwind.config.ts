/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {      colors: {
        'professional-blue': '#0066CC', // Improved professional blue with better contrast
        'professional-blue-dark': '#004E98', // Darker blue for backgrounds
        'vibrant-accent': '#E55A00',   // Improved orange with better contrast
        'vibrant-accent-light': '#FF8533', // Lighter orange for hover states
        'light-bg': '#FAFBFC',        // Slightly lighter background for better contrast
        'neutral-50': '#F8FAFC',      // Very light neutral
        'neutral-100': '#F1F5F9',     // Light neutral background
        'neutral-200': '#E2E8F0',     // Light border/divider
        'neutral-600': '#475569',     // Medium contrast text
        'neutral-700': '#334155',     // High contrast text
        'neutral-800': '#1E293B',     // Very high contrast text
        'neutral-900': '#0F172A',     // Maximum contrast text
        'dark-text': '#1E293B',       // High contrast dark text
        'medium-text': '#475569',     // Medium contrast text for secondary content
      },
      fontFamily: {
        sans: ['var(--font-inter)', 'sans-serif'], // Using Inter from next/font/google
        heading: ['Georgia', 'serif'], // A slightly more stylized font for headings
      },
      backgroundImage: {
        "gradient-radial": "radial-gradient(var(--tw-gradient-stops))",
        "gradient-conic":
          "conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))",
      },
    },
  },
  plugins: [],
};
