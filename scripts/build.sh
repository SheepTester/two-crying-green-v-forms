#!/bin/bash

# Build JS and CSS

# https://unix.stackexchange.com/a/251166
{
  echo "// The extension is open source at https://github.com/SheepTester/two-crying-green-v-forms"
  echo "(async () => {"
  deno bundle ./src/index.ts
  echo "})()"
} > ./dist/content-script.js
