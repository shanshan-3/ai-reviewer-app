// https://docs.expo.dev/guides/using-eslint/
const { defineConfig } = require('eslint/config');
const expoConfig = require("eslint-config-expo/flat");

module.exports = defineConfig([
  expoConfig,
  {
    ignores: ["dist/*"],
    settings: {
      'import/resolver': {
        typescript: {
          project: './jsconfig.json',
          // Resolve JavaScript exports; Tabler's per-icon type paths are missing.
          conditionNames: ['react-native', 'import', 'default'],
        },
      },
    },
  }
]);
