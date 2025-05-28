/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        'professional-blue': '#004E98', // A professional blue
        'vibrant-accent': '#FF6700',   // A vibrant orange accent
        'light-bg': '#F0F4F8',        // Light and airy background
        'dark-text': '#333333',       // For readability
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
