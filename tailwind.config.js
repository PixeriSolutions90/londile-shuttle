/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          primary: '#3B82F6',
          secondary: '#8B5CF6',
          accent: '#EC4899',
          success: '#10B981',
          warning: '#F59E0B',
          error: '#EF4444',
        },
      },
    },
  },
  plugins: [],
}
