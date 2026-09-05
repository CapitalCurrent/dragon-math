#!/usr/bin/env bash
# Publish build/ to the gh-pages branch through a git WORKTREE.
#
# Why not `gh-pages`: it passes every filename to `git rm`/`git add` as arguments, and with the
# morph art sets (~500 files) that blows the Windows command-line limit (spawn ENAMETOOLONG, 9/5).
# A worktree lets `git add -A` do the same job with no file list at all.
set -euo pipefail

REPO="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
BUILD="$REPO/build"
WT="${TMPDIR:-/tmp}/ghp-$(basename "$REPO")"
BRANCH="gh-pages"
MSG="${1:-Deploy $(date '+%Y-%m-%d %H:%M')}"

export HOME="${HOME:-$USERPROFILE}"
[ -d "$BUILD" ] || { echo "no build/ - run npm run build first"; exit 1; }

cd "$REPO"
git worktree remove --force "$WT" 2>/dev/null || true
git fetch -q origin "$BRANCH"
git worktree add --force "$WT" "$BRANCH" >/dev/null
cd "$WT"
git reset -q --hard "origin/$BRANCH"

# replace the published tree with the fresh build (keep .git)
find . -maxdepth 1 ! -name . ! -name .git -exec rm -rf {} +
cp -r "$BUILD/." .
touch .nojekyll                     # CRA output must skip the Jekyll builder

git add -A
if git diff --cached --quiet; then
  echo "nothing to publish (build identical)"
else
  git commit -q -m "$MSG"
  git push -q origin "$BRANCH"
  echo "published $(git rev-parse --short HEAD) to $BRANCH"
fi
cd "$REPO"
git worktree remove --force "$WT"
