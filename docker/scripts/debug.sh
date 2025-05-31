#!/bin/sh

# Start Node.js application with debugging enabled
node --inspect=0.0.0.0:9229 \
     --require ts-node/register \
     --require tsconfig-paths/register \
     "$@" 