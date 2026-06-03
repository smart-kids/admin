const { override, addBabelPreset, addWebpackPlugin } = require('customize-cra');

module.exports = override(
  addBabelPreset([
    '@babel/preset-react',
    {
      runtime: 'automatic',
      throwIfNamespace: false
    }
  ]),
  (config) => {
    // Generate source maps for production builds
    if (process.env.NODE_ENV === 'production') {
      config.devtool = 'source-map';
    }
    return config;
  }
);
