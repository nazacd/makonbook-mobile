// https://docs.expo.dev/guides/using-eslint/
const { defineConfig } = require('eslint/config');
const expoConfig = require("eslint-config-expo/flat");

module.exports = defineConfig([
  expoConfig,
  {
    ignores: ["dist/*"],
  },
  {
    // React Native's <Text> clips bold text on Android after a theme change;
    // see src/components/Text.tsx.
    files: ["src/**/*.{ts,tsx}"],
    ignores: ["src/components/Text.tsx"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          paths: [
            {
              name: "react-native",
              importNames: ["Text"],
              message: "Import Text from '@/components/Text' instead.",
            },
          ],
        },
      ],
    },
  },
]);
