module.exports = {
  mode: 'jit',
  content: ['./index.html', './src/**/*.{js,jsx}'],
  darkMode: 'media',
  theme: {
    fontFamily: {
      sans: 'Arima Madurai, cursive',
      serif: 'ui-serif, Georgia, Cambria, "Times New Roman", Times, serif',
      mono: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
    },
    extend: {},
  },
  variants: {
    extend: {},
  },
  plugins: [],
}
