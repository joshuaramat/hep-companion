#!/bin/sh

# Run performance profiling with Clinic.js
clinic doctor -- \
    node --require ts-node/register \
         --require tsconfig-paths/register \
         "$@" 