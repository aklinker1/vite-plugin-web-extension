#!/bin/bash
set -e

CURRENT_BRANCH=$(git rev-parse --abbrev-ref HEAD)
TEMPLATES=(
  vanilla-js
  vanilla-ts
  vue-js
  vue-ts
  react-js
  react-ts
)

for TEMPLATE in "${TEMPLATES[@]}"; do
  rm -rf "test"
  echo "Setting up $TEMPLATE..."
  pnpm start -t "$TEMPLATE" -p npm --branch "$CURRENT_BRANCH" "test"
  pushd test &> /dev/null
    pnpm build
    pnpm dev ; echo "Done"
  popd &> /dev/null
done
