#!/usr/bin/env bash
# Remove Cursor co-author trailers from all commits and purge filter-branch backups.
# Run once, then force-push main to refresh GitHub contributors.
#
# Usage:
#   ./scripts/strip_coauthors.sh
set -euo pipefail
cd "$(dirname "$0")/.."

echo "Stripping Co-authored-by: Cursor trailers from all commits on main..."
FILTER_BRANCH_SQUELCH_WARNING=1 git filter-branch -f --msg-filter \
  'grep -v "^Co-authored-by: Cursor <cursoragent@cursor.com>$"' -- main

echo "Removing filter-branch backup refs..."
git for-each-ref --format='%(refname)' refs/original/ | while read -r ref; do
  git update-ref -d "${ref}"
done

echo "Verifying main branch is clean..."
ALL_CURSOR=$(git log main --format='%B' | grep -c '^Co-authored-by: Cursor <cursoragent@cursor.com>$' || true)
if [[ "${ALL_CURSOR}" -gt 0 ]]; then
  echo "Error: ${ALL_CURSOR} commit(s) on main still have Cursor co-author trailers." >&2
  exit 1
fi

echo "Done. main has $(git rev-list --count main) commits with no cursoragent trailers."
