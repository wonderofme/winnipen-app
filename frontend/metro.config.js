const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Add support for .cjs files (needed for Firebase)
config.resolver.sourceExts.push('cjs');

// CRITICAL: Disable package exports to fix Firebase Auth registration
config.resolver.unstable_enablePackageExports = false;

// Add Firebase-specific resolver configuration
config.resolver.platforms = ['ios', 'android', 'native', 'web'];

module.exports = config;
