#!/usr/bin/env bash
# AIFitnessPro — One-command validation
# Usage: bash .codebuddy/skills/aifitnesspro/scripts/validate.sh [--core]

set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../../../.." && pwd)"

cd "$PROJECT_ROOT"

if [ "$1" = "--core" ]; then
  echo "🧪 Running core module validation..."
  node validate_core.js
else
  echo "🧪 Running full validation..."
  node validate.js
fi

echo ""
echo "🧪 Running Jest tests..."
npx jest --runInBand --forceExit

echo ""
echo "✅ All validations passed!"
