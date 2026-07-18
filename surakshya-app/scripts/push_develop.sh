#!/usr/bin/env bash
# Push local main (88 commits) to GitHub.
# Usage:
#   1. Create EMPTY repo on GitHub (no README): surakakshya-mobileApp
#   2. export GITHUB_TOKEN="your_pat_with_repo_scope"
#   3. ./scripts/push_develop.sh [github-username]
set -euo pipefail
cd "$(dirname "$0")/.."

OWNER="${1:-}"
REPO="surakshya-MobileApp"

if [[ -z "${OWNER}" ]]; then
  echo "Usage: GITHUB_TOKEN=ghp_xxx ./scripts/push_develop.sh <github-username>"
  echo "Example: GITHUB_TOKEN=ghp_xxx ./scripts/push_develop.sh ujwalbholan"
  exit 1
fi

if [[ -z "${GITHUB_TOKEN:-}" ]]; then
  echo "Set GITHUB_TOKEN to a classic PAT with 'repo' scope."
  exit 1
fi

git checkout main
git branch -M main
git remote set-url origin "https://github.com/${OWNER}/${REPO}.git"

echo "Pushing $(git rev-list --count HEAD) commits to origin/main..."
git push -u "https://${OWNER}:${GITHUB_TOKEN}@github.com/${OWNER}/${REPO}.git" main

git remote set-url origin "https://github.com/${OWNER}/${REPO}.git"
echo "Done. Remote: https://github.com/${OWNER}/${REPO} (branch: main)"
