import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        coral:    '#FF5A5F',
        'coral-d':'#E5444A',
        plum:     '#201747',
        'plum-d': '#150F30',
        cream:    '#FFF3E8',
        amber:    '#FFB84D',
        ink:      '#0F0A24',
        paper:    '#FFFBF6',
        line:     '#EAE4DA',
        mut:      '#6B6580',
      },
      fontFamily: {
        display: ['var(--font-fraunces)', 'Georgia', 'serif'],
        sans:    ['var(--font-manrope)', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        '2xl': '1.25rem',
        '3xl': '1.75rem',
      },
      boxShadow: {
        soft:   '0 20px 50px -20px rgba(32,23,71,.25)',
        pop:    '4px 4px 0 #201747',
        glow:   '0 0 0 1px rgba(255,90,95,.25), 0 20px 60px -20px rgba(255,90,95,.5)',
      },
      maxWidth: {
        '8xl': '88rem',
      },
    },
  },
  plugins: [],
  corePlugins: { preflight: true },
};

export default config;