#!/bin/bash

# Compile the background script

{
  echo "// The background script (a service worker)"
  echo "// The extension is open source at https://github.com/SheepTester/two-crying-green-v-forms"
  echo "(async () => {"
  deno bundle ./src/background/index.ts
  echo "})()"
} > ./dist/background.js
