#!/bin/bash

PKG_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )/.."
PKG_README="$PKG_DIR/README.md"
REPO_ROOT="$PKG_DIR/../.."

cat > "$PKG_README" <<EOF
[comment]: # (This file is copied from the repo root.)
[comment]: # (Changes to this file will not be persisted.)
[comment]: # (Update the README.md in the repo root, rather than in this package.)
EOF

cat "$REPO_ROOT/README.md" >> "$PKG_README"
