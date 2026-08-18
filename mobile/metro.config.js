const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// react-native-gesture-handler's "module" field points at lib/module/index.js,
// which exists on disk but Metro's web resolver fails to resolve it (tries
// appending extra platform/extension suffixes on top of the already-.js path).
// Preferring "react-native"/"main" over "module" sidesteps that broken path.
config.resolver.resolverMainFields = ['react-native', 'browser', 'main'];

module.exports = config;
