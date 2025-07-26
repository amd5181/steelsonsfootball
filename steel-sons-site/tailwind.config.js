module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx,ts,tsx}"
  ],
  theme: {
    extend: {
      colors: {
        steel: {
          900: '#1a1a1a',
          800: '#2c2c2c',
          700: '#3e3e3e',
          600: '#505050',
          500: '#6b6b6b',
        },
        pgh: {
          yellow: '#fcd116', // Bold yellow like the Steelers’ trim
          gray: '#202020',    // Near-black dark gray
        },
      },
      fontFamily: {
        sans: ['"Segoe UI"', 'system-ui', 'sans-serif']
      },
    },
  },
  plugins: [],
};
