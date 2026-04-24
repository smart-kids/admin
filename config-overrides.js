const { override, addBabelPreset, addBabelPlugin } = require('customize-cra');

module.exports = override(
  (config) => {
    // Completely bypass CRA's Babel configuration
    config.module.rules = config.module.rules.map(rule => {
      if (rule.oneOf) {
        rule.oneOf = rule.oneOf.map(subRule => {
          if (subRule.use && subRule.use.some(use => use.loader && use.loader.includes('babel-loader'))) {
            subRule.use = subRule.use.map(use => {
              if (use.options) {
                // Use minimal Babel configuration
                use.options.presets = [
                  ['@babel/preset-env', {
                    modules: false,
                    targets: {
                      browsers: ['> 1%', 'last 2 versions', 'not dead']
                    }
                  }]
                ];
                use.options.plugins = [
                  ['@babel/plugin-transform-react-jsx', {
                    pragma: 'React.createElement',
                    pragmaFrag: 'React.Fragment',
                    throwIfNamespace: false
                  }],
                  ['@babel/plugin-proposal-class-properties', { loose: true }],
                  ['@babel/plugin-proposal-private-methods', { loose: true }],
                  ['@babel/plugin-proposal-private-property-in-object', { loose: true }],
                  '@babel/plugin-proposal-optional-chaining',
                  '@babel/plugin-proposal-async-generator-functions',
                  '@babel/plugin-syntax-dynamic-import'
                ];
              }
              return use;
            });
          }
          return subRule;
        });
      }
      return rule;
    });
    return config;
  }
);