export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        navy: {
          950: '#02060F',
          900: '#050D1C',
          800: '#0A1628',
          700: '#0F2040',
          600: '#152B55',
          500: '#1C3A6E',
        },
        blue: {
          400: '#60A5FA',
          500: '#3B82F6',
          600: '#1D4ED8',
          glow: '#2563EB',
        },
        ice: {
          100: '#F0F7FF',
          200: '#D6EAFF',
          300: '#A8CFFF',
          400: '#70AEFF',
        },
        silver: {
          300: '#CBD5E1',
          400: '#94A3B8',
          500: '#64748B',
          600: '#475569',
        },
      },
      fontFamily: {
        sans:    ['"Instrument Sans"', 'sans-serif'],
        display: ['"Syne"', 'sans-serif'],
        mono:    ['"JetBrains Mono"', 'monospace'],
      },
      backgroundImage: {
        'radial-navy': 'radial-gradient(ellipse 100% 80% at 50% 0%, #0F2040 0%, #02060F 60%)',
        'radial-blue': 'radial-gradient(ellipse 60% 40% at 50% 0%, rgba(37,99,235,0.35) 0%, transparent 70%)',
        'line-grid':   'linear-gradient(rgba(59,130,246,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(59,130,246,0.1) 1px, transparent 1px)',
        'blue-glow':   'radial-gradient(ellipse 50% 30% at 50% 100%, rgba(37,99,235,0.2) 0%, transparent 70%)',
        'card-shine':  'linear-gradient(135deg, rgba(255,255,255,0.05) 0%, transparent 50%)',
        'btn-primary': 'linear-gradient(135deg, #2563EB 0%, #1D4ED8 100%)',
        'hero-orb-1':  'radial-gradient(circle, rgba(37,99,235,0.5) 0%, transparent 70%)',
        'hero-orb-2':  'radial-gradient(circle, rgba(96,165,250,0.3) 0%, transparent 70%)',
      },
      backgroundSize: {
        'grid-sm': '40px 40px',
      },
      boxShadow: {
        'glow-sm':  '0 0 20px rgba(37,99,235,0.3)',
        'glow-md':  '0 0 40px rgba(37,99,235,0.4)',
        'glow-lg':  '0 0 80px rgba(37,99,235,0.3)',
        'card':     '0 1px 0 rgba(255,255,255,0.05) inset, 0 4px 32px rgba(0,0,0,0.4)',
        'card-hover': '0 1px 0 rgba(255,255,255,0.08) inset, 0 8px 48px rgba(0,0,0,0.5), 0 0 0 1px rgba(96,165,250,0.15)',
        'nav':      '0 1px 0 rgba(255,255,255,0.04) inset, 0 4px 24px rgba(0,0,0,0.6)',
        'btn':      '0 1px 0 rgba(255,255,255,0.15) inset, 0 4px 16px rgba(37,99,235,0.4)',
        'btn-hover':'0 1px 0 rgba(255,255,255,0.2) inset, 0 6px 24px rgba(37,99,235,0.6)',
      },
      keyframes: {
        'fade-up': {
          '0%':   { opacity: '0', transform: 'translateY(24px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'fade-in': {
          '0%':   { opacity: '0' },
          '100%': { opacity: '1' },
        },
        'shimmer': {
          '0%':   { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        'orb-float': {
          '0%, 100%': { transform: 'translateY(0px) scale(1)' },
          '50%':      { transform: 'translateY(-20px) scale(1.05)' },
        },
        'border-flow': {
          '0%, 100%': { backgroundPosition: '0% 50%' },
          '50%':      { backgroundPosition: '100% 50%' },
        },
        'scan': {
          '0%':   { transform: 'translateY(-100%)' },
          '100%': { transform: 'translateY(100vh)' },
        },
      },
      animation: {
        'fade-up':   'fade-up 0.6s cubic-bezier(0.16,1,0.3,1) forwards',
        'fade-up-1': 'fade-up 0.6s cubic-bezier(0.16,1,0.3,1) 0.1s forwards',
        'fade-up-2': 'fade-up 0.6s cubic-bezier(0.16,1,0.3,1) 0.2s forwards',
        'fade-up-3': 'fade-up 0.6s cubic-bezier(0.16,1,0.3,1) 0.3s forwards',
        'fade-up-4': 'fade-up 0.6s cubic-bezier(0.16,1,0.3,1) 0.4s forwards',
        'fade-in':   'fade-in 0.4s ease forwards',
        'orb-float': 'orb-float 8s ease-in-out infinite',
        'orb-float-slow': 'orb-float 12s ease-in-out infinite reverse',
        'scan':      'scan 8s linear infinite',
      },
    },
  },
};
