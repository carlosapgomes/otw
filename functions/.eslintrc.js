module.exports = {
  root: true,
  env: {
    es6: true,
    node: true,
  },
  parserOptions: {
    ecmaVersion: 12,
  },
  extends: [
    'eslint:recommended',
    //"google",
  ],
  rules: {
    quotes: ['error', 'double'],
  },
};
