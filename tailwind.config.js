module.exports = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './lib/**/*.{js,ts,jsx,tsx,mdx}'
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#eef6ff',
          100: '#d9ebff',
          500: '#1877f2',
          600: '#166fe5',
          700: '#1356b6'
        },
        accent: {
          500: '#42b883'
        }
      },
      boxShadow: {
        soft: '0 10px 30px rgba(0, 0, 0, 0.08)'
      }
    }
  },
  plugins: []
};
