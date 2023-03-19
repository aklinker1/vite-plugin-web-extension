#!/bin/bash
set -m
stty -echoctl

CURRENT_BRANCH=$(git rev-parse --abbrev-ref HEAD)
TEMPLATES=(
  vanilla-js
  vanilla-ts
  vue-js
  vue-ts
  react-js
  react-ts
  svelte-js
  svelte-ts
)

for TEMPLATE in "${TEMPLATES[@]}"; do
  rm -rf "test"
  echo "Setting up $TEMPLATE..."
  pnpm start -t "$TEMPLATE" -p npm --branch "$CURRENT_BRANCH" "test"
  pushd test &> /dev/null
    npm run build
    trap - SIGINT
    npm run dev &
    trap "" SIGINT
    fg %-
  popd &> /dev/null
done
