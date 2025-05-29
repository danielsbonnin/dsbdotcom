/** \@type {import('tailwindcss').Config} */
module.exports = {
  content: [\"\./src/**/*.{js,ts,jsx,tsx}\",],\n  theme: {
    extend: {
      colors: {
        'primary': '#0066CC', //A more accessible blue
        'secondary': '#6699CC', //Light blue for contrast
        'accent': '#FFA500', //Orange with improved contrast
        'dark-text': '#333', //Dark gray for text
        'light-text': '#666'  //Light gray for text
      },
      fontFamily: {
        'sans': ['Inter', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
