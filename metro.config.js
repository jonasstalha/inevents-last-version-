const { getDefaultConfig } = require('expo/metro-config');

const defaultConfig = getDefaultConfig(__dirname);

defaultConfig.resolver.alias = {
  '@': require('path').resolve(__dirname, 'src'),
};

module.exports = defaultConfig;
