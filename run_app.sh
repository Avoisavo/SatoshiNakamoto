#!/bin/bash
# ensure absolute paths
ROOT_DIR="$(cd "$(dirname "$0")" && pwd)"

# open two Terminal tabs
osascript <<EOF
tell application "Terminal"
    activate
    do script "cd \"$ROOT_DIR/backend/api\" && node server.js"
    do script "cd \"$ROOT_DIR/frontend\" && npm run dev"
end tell
EOF
