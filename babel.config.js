module.exports = {
  presets: [
    [
      '@babel/preset-react',
      {
        runtime: 'automatic',
        throwIfNamespace: false
      }
    ]
  ],
  plugins: [
    '@babel/plugin-proposal-optional-chaining',
    '@babel/plugin-proposal-async-generator-functions',
    '@babel/plugin-proposal-dynamic-import',
    '@babel/plugin-syntax-dynamic-import'
  ]
};
