const path = require('path');
const { getDefaultConfig } = require('expo/metro-config');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

config.resolver.unstable_enablePackageExports = true;
config.resolver.sourceExts.push('cjs');

config.resolver.extraNodeModules = {
  '@': path.resolve(__dirname, 'src'),
};

config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (moduleName.startsWith('@/')) {
    const target = path.join(__dirname, 'src', moduleName.slice(2));
    return context.resolveRequest(context, target, platform);
  }
  return context.resolveRequest(context, moduleName, platform);
};

module.exports = config;
