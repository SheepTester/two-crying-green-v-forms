#!/bin/bash

# Compile the content script

# https://unix.stackexchange.com/a/251166
{
  echo "// The content script injected into the web page"
  echo "// The extension is open source at https://github.com/SheepTester/two-crying-green-v-forms"
  deno bundle ./src/index.ts
} > ./dist/content-script.js
