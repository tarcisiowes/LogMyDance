const path = require('path');
const { getDefaultConfig } = require('expo/metro-config');
const { withNativeWind } = require('nativewind/metro');

/** @type {import('expo/metro-config').MetroConfig} */
let config = getDefaultConfig(__dirname);
config = withNativeWind(config, { input: './global.css' });

// Metro doesn't follow package.json `main` in subdirectories for subpath imports.
// react-native-css-interop/jsx-runtime has only a subdir package.json pointing to dist/runtime/jsx-runtime.
const nwResolver = config.resolver?.resolveRequest;
config.resolver = {
  ...config.resolver,
  resolveRequest: (context, moduleName, platform) => {
    if (moduleName === 'react-native-css-interop/jsx-runtime') {
      return {
        filePath: path.resolve(
          __dirname,
          'node_modules/react-native-css-interop/dist/runtime/jsx-runtime.js'
        ),
        type: 'sourceFile',
      };
    }
    if (moduleName === 'react-native-css-interop/jsx-dev-runtime') {
      return {
        filePath: path.resolve(
          __dirname,
          'node_modules/react-native-css-interop/dist/runtime/jsx-dev-runtime.js'
        ),
        type: 'sourceFile',
      };
    }
    if (nwResolver) return nwResolver(context, moduleName, platform);
    return context.resolveRequest(context, moduleName, platform);
  },
};

module.exports = config;
