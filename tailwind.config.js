/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./site/**/*.{html,js}",
    "./applications/**/*.{html,js}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#4ca5b2',
          dark: '#083e51',
          light: '#6bc4d1',
        },
        secondary: {
          DEFAULT: '#10b981',
          dark: '#059669',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [
    require('@tailwindcss/forms'),
  ],
}

