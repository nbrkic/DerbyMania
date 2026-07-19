export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        ink: {
          950: '#0B0706',
          900: '#150B0A',
          800: '#1D1211',
          700: '#2A1917',
        },
        maroon: {
          900: '#2A080C',
          700: '#3D0D12',
          500: '#5C1219',
        },
        red: {
          600: '#9E1B26',
          500: '#C21F2E',
          400: '#E8293A',
          300: '#F0596A',
        },
        paper: {
          100: '#F4EBE1',
          300: '#D9C9BC',
          500: '#A8938A',
          700: '#6B5B54',
        },
      },
      fontFamily: {
        sans: ['"Rubik"', 'sans-serif'],
        display: ['"Archivo Black"', 'sans-serif'],
      },
    },
  },
};
