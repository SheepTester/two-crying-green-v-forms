#!/bin/bash

# Watches for changes in files and rebuilds

nodemon --watch ./src/ --exec ./scripts/build.sh --ext ts
