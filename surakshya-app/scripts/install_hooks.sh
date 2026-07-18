#!/usr/bin/env bash
# Install git hooks that prevent cursoragent from appearing as a co-author.
set -euo pipefail
cd "$(dirname "$0")/.."

HOOKS_DIR=".git/hooks"
SRC="scripts/hooks/prepare-commit-msg"

mkdir -p "${HOOKS_DIR}"
cp "${SRC}" "${HOOKS_DIR}/prepare-commit-msg"
chmod +x "${HOOKS_DIR}/prepare-commit-msg"
echo "Installed ${HOOKS_DIR}/prepare-commit-msg"
