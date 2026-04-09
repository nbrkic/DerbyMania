
export default {content: [
  './index.html',
  './src/**/*.{js,ts,jsx,tsx}'
],
  theme: {
    extend: {
      colors: {
        gs: {
          primary: '#0A1628',
          secondary: '#102444',
          accent: '#1E5FA8',
          highlight: '#2E9BF5',
          gold: '#F5A623',
          border: '#1A3A5C',
          success: '#27AE60',
          error: '#E74C3C',
          draw: '#F5A623',
          'text-primary': '#FFFFFF',
          'text-secondary': '#A0B4CC',
        },
      },
      fontFamily: {
        heading: ['Oswald', 'Bebas Neue', 'sans-serif'],
        body: ['Inter', 'Roboto', 'sans-serif'],
      },
    },
  },
}
