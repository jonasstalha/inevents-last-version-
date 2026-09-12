const { getDefaultConfig } = require('expo/metro-config');
const { resolve } = require('metro-resolver');
const path = require('path');

const defaultConfig = getDefaultConfig(__dirname);

defaultConfig.resolver.alias = {
  '@': path.resolve(__dirname, 'src'),
};

const defaultResolveRequest = defaultConfig.resolver.resolveRequest;
defaultConfig.resolver.resolveRequest = (context, moduleName, platform) => {
  if (moduleName === 'whatwg-fetch') {
    return {
      filePath: path.resolve(__dirname, 'node_modules/whatwg-fetch/fetch.js'),
      type: 'sourceFile',
    };
  }

  if (moduleName === 'memoize-one') {
    return {
      filePath: path.resolve(__dirname, 'node_modules/memoize-one/dist/memoize-one.js'),
      type: 'sourceFile',
    };
  }

  if (moduleName === 'lucide-react-native') {
    return {
      filePath: path.resolve(__dirname, 'node_modules/lucide-react-native/dist/cjs/lucide-react-native.js'),
      type: 'sourceFile',
    };
  }

  if (moduleName.startsWith('firebase/')) {
    const packageName = moduleName.slice('firebase/'.length);
    return {
      filePath: path.resolve(__dirname, `node_modules/firebase/${packageName}/dist/esm/index.esm.js`),
      type: 'sourceFile',
    };
  }

  return defaultResolveRequest
    ? defaultResolveRequest(context, moduleName, platform)
    : resolve(context, moduleName, platform);
};

defaultConfig.resolver.blockList = [
  /[/\\]functions[/\\]node_modules[/\\].*/,
  /[/\\]android[/\\](?:build|\.gradle)[/\\].*/,
];

module.exports = defaultConfig;
