/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
    './components/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      zIndex: {
        100: '100',
      },
    },
  },
  plugins: [],
};
