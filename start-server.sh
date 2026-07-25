#!/usr/bin/env bash
# ============================================================================
# MVP Falcon Unit Enterprise Website - PHP Dev Server Launcher (Bash)
# macOS / Linux users on GitHub — double-click compatibility may vary.
# Run in terminal:  chmod +x ./start-server.sh  &&  ./start-server.sh
# ============================================================================

set -eu

HOST="${HOST:-localhost}"
PORT="${PORT:-8000}"

SCRIPT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" &> /dev/null && pwd)"
cd "$SCRIPT_DIR"

if ! command -v php > /dev/null 2>&1; then
  echo ""
  echo "[ERROR] PHP executable was not found on this system."
  echo ""
  echo "Please install PHP (version 7.4+) and ensure the 'php' command"
  echo "is available in your PATH."
  echo ""
  echo "macOS  :  brew install php"
  echo "Ubuntu :  sudo apt install php-cli"
  echo "Fedora :  sudo dnf install php-cli"
  echo ""
  exit 1
fi

PHP_BIN="$(command -v php)"
PHP_VER="$($PHP_BIN -v 2>&1 | head -n 1 || true)"

SERVER_URL="http://${HOST}:${PORT}"
ADMIN_URL="${SERVER_URL}/admin/leads_overview.html"

echo ""
printf '\033[1;36m============================================================\033[0m\n'
printf '\033[1;36m  MVP Falcon Unit Enterprise Website - PHP Dev Server\033[0m\n'
printf '\033[1;36m============================================================\033[0m\n'
echo ""
echo "  PHP   : $PHP_BIN"
echo "  Ver   : $PHP_VER"
echo "  Root  : $SCRIPT_DIR"
printf '  URL   : \033[1;33m%s\033[0m\n' "$SERVER_URL"
echo ""
printf '  Admin : \033[1;33m%s\033[0m\n' "$ADMIN_URL"
echo ""
echo "  Press Ctrl+C to stop the server."
printf '\033[1;36m============================================================\033[0m\n'
echo ""

if command -v open > /dev/null 2>&1; then
  (sleep 1 ; open "$SERVER_URL") &
elif command -v xdg-open > /dev/null 2>&1; then
  (sleep 1 ; xdg-open "$SERVER_URL") &
fi

exec "$PHP_BIN" -S "${HOST}:${PORT}" -t "$SCRIPT_DIR"
