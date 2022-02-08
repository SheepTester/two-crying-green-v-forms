#!/bin/bash

# Watches for changes in files and rebuilds

nodemon --watch ./src/ --ignore ./src/background/ --exec ./scripts/build-cs.sh --ext ts &
nodemon --watch ./src/background/ --exec ./scripts/build-bg.sh --ext ts
