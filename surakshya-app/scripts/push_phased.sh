#!/usr/bin/env bash
# Push local main to GitHub in 10 incremental phases (~8-9 commits each).
#
# Usage:
#   export GITHUB_TOKEN="your_pat_with_repo_scope"   # ajitbasnet account
#   ./scripts/push_phased.sh ujwalbholan 1           # Phase 1 (force-push)
#   ./scripts/push_phased.sh ujwalbholan 2           # Phase 2
#   ...
#   ./scripts/push_phased.sh ujwalbholan 10          # Phase 10 (full app)
#   ./scripts/push_phased.sh ujwalbholan all         # Push everything remaining
set -euo pipefail
cd "$(dirname "$0")/.."

OWNER="${1:-}"
PHASE_ARG="${2:-}"
REPO="surakshya-MobileApp"

# Cumulative commit counts per phase (oldest -> newest)
PHASE_COUNTS=(9 18 27 36 45 54 63 72 80 91)
PHASE_THEMES=(
  "Project bootstrap + theme foundation"
  "Theme completion + data models"
  "Services + auth screens"
  "App root + splash animation core"
  "Splash layers + painters"
  "Splash finish + onboarding + home start"
  "Home marketing sections + dashboard shell"
  "Tracking map + SOS widgets (part 1)"
  "SOS UI + shared animations/widgets"
  "Assets + platform runners + scripts"
)

usage() {
  echo "Usage: GITHUB_TOKEN=ghp_xxx ./scripts/push_phased.sh <github-username> <phase|all>"
  echo
  echo "Phases:"
  local i start end count
  for i in "${!PHASE_COUNTS[@]}"; do
    count="${PHASE_COUNTS[$i]}"
    if [[ "$i" -eq 0 ]]; then
      start=1
    else
      start=$((PHASE_COUNTS[i - 1] + 1))
    fi
    end="${count}"
    printf "  %2d  commits %2d-%2d (%2d total) — %s\n" \
      "$((i + 1))" "${start}" "${end}" "${count}" "${PHASE_THEMES[$i]}"
  done
  exit 1
}

if [[ -z "${OWNER}" || -z "${PHASE_ARG}" ]]; then
  usage
fi

if [[ -z "${GITHUB_TOKEN:-}" ]]; then
  echo "Set GITHUB_TOKEN to a PAT from the ajitbasnet GitHub account (repo scope)."
  exit 1
fi

TOTAL_COMMITS=$(git rev-list --count HEAD)
if [[ "${TOTAL_COMMITS}" -lt 91 ]]; then
  echo "Warning: expected at least 91 commits on main, found ${TOTAL_COMMITS}."
fi

git checkout main
git branch -M main
git remote set-url origin "https://github.com/${OWNER}/${REPO}.git"

PUSH_URL="https://${OWNER}:${GITHUB_TOKEN}@github.com/${OWNER}/${REPO}.git"

resolve_target_commit() {
  local cumulative="$1"
  local target
  target=$(git rev-list --reverse HEAD | sed -n "${cumulative}p")
  if [[ -z "${target}" ]]; then
    echo "Error: could not resolve commit at position ${cumulative}." >&2
    exit 1
  fi
  echo "${target}"
}

push_phase() {
  local phase="$1"
  local cumulative="${PHASE_COUNTS[$((phase - 1))]}"
  local target
  local push_ref
  local start end

  if [[ "${phase}" -eq 10 ]]; then
    target=$(git rev-parse HEAD)
    cumulative=$(git rev-list --count HEAD)
    start=$((PHASE_COUNTS[8] + 1))
    end="${cumulative}"
    push_ref="main"
  else
    target=$(resolve_target_commit "${cumulative}")
    push_ref="${target}:refs/heads/main"
    if [[ "${phase}" -eq 1 ]]; then
      start=1
    else
      start=$((PHASE_COUNTS[phase - 2] + 1))
    fi
    end="${cumulative}"
  fi

  echo "Phase ${phase}: pushing commits ${start}-${end} (${cumulative} cumulative)"
  echo "  Theme: ${PHASE_THEMES[$((phase - 1))]}"
  echo "  Target: ${target} — $(git log -1 --format='%s' "${target}")"
  echo

  if [[ "${phase}" -eq 1 ]]; then
    echo "Fetching remote before force-push (replaces existing mobile.dart history)..."
    git fetch origin main:refs/remotes/origin/main 2>/dev/null || true
    git push --force-with-lease=main:origin/main -u "${PUSH_URL}" "${push_ref}"
  else
    git push -u "${PUSH_URL}" "${push_ref}"
  fi

  echo
  echo "Phase ${phase} complete. Remote main now at ${cumulative} commits."
}

if [[ "${PHASE_ARG}" == "all" ]]; then
  echo "Pushing all ${TOTAL_COMMITS} commits to origin/main..."
  git fetch origin main 2>/dev/null || true
  if git rev-parse --verify origin/main >/dev/null 2>&1; then
    git push -u "${PUSH_URL}" main
  else
    git push --force-with-lease -u "${PUSH_URL}" main
  fi
else
  if ! [[ "${PHASE_ARG}" =~ ^[0-9]+$ ]] || [[ "${PHASE_ARG}" -lt 1 || "${PHASE_ARG}" -gt 10 ]]; then
    echo "Error: phase must be 1-10 or 'all'." >&2
    usage
  fi
  push_phase "${PHASE_ARG}"
fi

git remote set-url origin "https://github.com/${OWNER}/${REPO}.git"
echo "Done. Remote: https://github.com/${OWNER}/${REPO} (branch: main)"
