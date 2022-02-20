#!/bin/bash

# Watches for changes in files and rebuilds

nodemon --exec make --ext ts,tsx
