const { override, addBabelPreset, addBabelPlugin, addWebpackPlugin } = require('customize-cra');
const webpack = require('webpack');

module.exports = override(
  addWebpackPlugin(new webpack.IgnorePlugin({
    resourceRegExp: /^\.\/locale$/,
    contextRegExp: /moment$/
  })),
  (config) => {
        
        // Find and completely replace the babel-loader rule
    config.module.rules = config.module.rules.map(rule => {
      if (rule.oneOf) {
        rule.oneOf = rule.oneOf.map(subRule => {
          if (subRule.use && subRule.use.some(use => use.loader && use.loader.includes('babel-loader'))) {
            // Replace the entire babel-loader configuration
            return {
              test: /\.(js|mjs|jsx|ts|tsx)$/,
              exclude: [/node_modules/, /scripts\.bundle\.js$/],
              use: {
                loader: require.resolve('babel-loader'),
                options: {
                  presets: [
                    ['@babel/preset-env', {
                      modules: false,
                      targets: {
                        browsers: ['> 1%', 'last 2 versions', 'not dead']
                      }
                    }],
                    '@babel/preset-react'
                  ],
                  plugins: [
                    ['@babel/plugin-proposal-class-properties', { loose: true }],
                    ['@babel/plugin-proposal-private-methods', { loose: true }],
                    ['@babel/plugin-proposal-private-property-in-object', { loose: true }],
                    '@babel/plugin-proposal-optional-chaining',
                    '@babel/plugin-proposal-async-generator-functions',
                    '@babel/plugin-syntax-dynamic-import'
                  ],
                  cacheDirectory: true,
                  sourceMaps: false
                }
              }
            };
          }
          return subRule;
        });
      }
      return rule;
    });
    return config;
  }
);