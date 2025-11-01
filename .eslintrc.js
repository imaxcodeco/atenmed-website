module.exports = {
  env: {
    node: true,
    es2021: true,
    browser: true,
    jest: true
  },
  extends: [
    'eslint:recommended',
    'plugin:prettier/recommended' // Integra Prettier com ESLint
  ],
  plugins: ['prettier'],
  parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module'
  },
  rules: {
    'prettier/prettier': 'error',
    'no-console': 'warn',
    'no-unused-vars': ['warn', { 
      argsIgnorePattern: '^_',
      varsIgnorePattern: '^_'
    }],
    'no-undef': 'error'
  },
  ignorePatterns: [
    'node_modules/',
    'dist/',
    'coverage/',
    '*.min.js',
    'tailwind.css',
    'logs/',
    'backups/'
  ]
};

