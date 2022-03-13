#!/bin/bash

# Watches for changes in files and rebuilds

# || exit 1 so Nodemon doesn't stop on exit code 2 https://git.io/fNOAG
nodemon --exec 'make || exit 1' --ext ts,tsx
