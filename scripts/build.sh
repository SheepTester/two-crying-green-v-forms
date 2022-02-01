#!/bin/bash

# Build JS and CSS

deno bundle ./src/index.ts > ./dist/content-script.js
