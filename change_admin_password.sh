#!/bin/bash
# DragonCoreSSH V40 admin password recovery tool.
# Usage:
#   sudo bash change_admin_password.sh
#   sudo bash change_admin_password.sh admin 'NewPasswordHere'
#   sudo bash change_admin_password.sh --user admin --generate
set -euo pipefail

RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'; NC='\033[0m'
info()  { echo -e "${GREEN}[+]${NC} $*"; }
warn()  { echo -e "${YELLOW}[!]${NC} $*"; }
error() { echo -e "${RED}[x]${NC} $*"; exit 1; }

INSTALL_DIR="${INSTALL_DIR:-/opt/sshpanel}"
SERVICE_NAME="${SERVICE_NAME:-sshpanel}"
ENV_FILE="${ENV_FILE:-${INSTALL_DIR}/.env}"
ADMIN_USER=""
NEW_PASSWORD=""
GENERATE_PASSWORD=false
NO_RESTART=false

usage() {
  cat <<USAGE
DragonCoreSSH V40 admin password recovery

Usage:
  sudo bash $0
  sudo bash $0 admin 'NewPasswordHere'
  sudo bash $0 --user admin --password 'NewPasswordHere'
  sudo bash $0 --user admin --generate

Options:
  -u, --user USERNAME       Admin username to reset. Default: admin
  -p, --password PASSWORD   New password. If omitted, you will be prompted.
  -g, --generate            Generate a strong random password.
      --no-restart          Do not restart the sshpanel service after changing DB.
  -h, --help                Show this help.

Environment overrides:
  INSTALL_DIR=/opt/sshpanel
  ENV_FILE=/opt/sshpanel/.env
  SERVICE_NAME=sshpanel
USAGE
}

while [[ $# -gt 0 ]]; do
  case "$1" in
    -u|--user)
      [[ $# -ge 2 ]] || error "Missing value for $1"
      ADMIN_USER="$2"
      shift 2
      ;;
    -p|--password)
      [[ $# -ge 2 ]] || error "Missing value for $1"
      NEW_PASSWORD="$2"
      shift 2
      ;;
    -g|--generate)
      GENERATE_PASSWORD=true
      shift
      ;;
    --no-restart)
      NO_RESTART=true
      shift
      ;;
    -h|--help)
      usage
      exit 0
      ;;
    --)
      shift
      break
      ;;
    -* )
      error "Unknown option: $1"
      ;;
    *)
      if [[ -z "$ADMIN_USER" ]]; then
        ADMIN_USER="$1"
      elif [[ -z "$NEW_PASSWORD" ]]; then
        NEW_PASSWORD="$1"
      else
        error "Too many positional arguments. Use --help for usage."
      fi
      shift
      ;;
  esac
done

[[ $EUID -ne 0 ]] && error "Run as root: sudo bash $0"
[[ -f "$ENV_FILE" ]] || error "Environment file not found: $ENV_FILE"
command -v psql >/dev/null 2>&1 || error "psql not found. Install PostgreSQL client first."

get_env_value() {
  local key="$1"
  awk -v key="$key" '
    $0 ~ "^" key "=" {
      sub("^[^=]*=", "")
      gsub(/^\"|\"$/, "")
      gsub(/^\047|\047$/, "")
      print
      exit
    }
  ' "$ENV_FILE"
}

update_env_password() {
  local new_password="$1"
  local tmp
  tmp="$(mktemp)"
  awk -v line="ADMIN_PASSWORD=${new_password}" '
    BEGIN { done = 0 }
    /^ADMIN_PASSWORD=/ { print line; done = 1; next }
    { print }
    END { if (!done) print line }
  ' "$ENV_FILE" > "$tmp"
  cat "$tmp" > "$ENV_FILE"
  rm -f "$tmp"
  chmod 600 "$ENV_FILE" 2>/dev/null || true
}

generate_password() {
  local pw=""
  if command -v openssl >/dev/null 2>&1; then
    pw="$(openssl rand -base64 24 | tr -d '\n' | tr -d '=/+' | head -c 24 || true)"
  fi
  if [[ ${#pw} -lt 20 ]]; then
    pw="$(tr -dc 'A-Za-z0-9' < /dev/urandom | head -c 24 || true)"
  fi
  if [[ ${#pw} -lt 20 ]]; then
    pw="DragonCore$(date +%s%N)"
  fi
  printf '%s' "$pw"
}

hash_password() {
  local pw="$1"
  if command -v sha256sum >/dev/null 2>&1; then
    printf '%s' "$pw" | sha256sum | awk '{print $1}'
  elif command -v shasum >/dev/null 2>&1; then
    printf '%s' "$pw" | shasum -a 256 | awk '{print $1}'
  elif command -v openssl >/dev/null 2>&1; then
    printf '%s' "$pw" | openssl dgst -sha256 -r | awk '{print $1}'
  else
    error "No SHA-256 tool found. Install coreutils or openssl."
  fi
}

PG_DSN="$(get_env_value PG_DSN)"
[[ -n "$PG_DSN" ]] || error "PG_DSN not found inside $ENV_FILE"

if [[ -z "$ADMIN_USER" ]]; then
  read -r -p "Admin username [admin]: " ADMIN_USER
  ADMIN_USER="${ADMIN_USER:-admin}"
fi

[[ -n "$ADMIN_USER" ]] || error "Admin username cannot be empty."

if $GENERATE_PASSWORD; then
  NEW_PASSWORD="$(generate_password)"
elif [[ -z "$NEW_PASSWORD" ]]; then
  read -r -s -p "New password: " PASS1
  echo
  read -r -s -p "Confirm password: " PASS2
  echo
  [[ "$PASS1" == "$PASS2" ]] || error "Passwords do not match."
  NEW_PASSWORD="$PASS1"
fi

[[ -n "$NEW_PASSWORD" ]] || error "Password cannot be empty."
if [[ ${#NEW_PASSWORD} -lt 8 ]]; then
  error "Password must have at least 8 characters."
fi

PASSWORD_HASH="$(hash_password "$NEW_PASSWORD")"
[[ ${#PASSWORD_HASH} -eq 64 ]] || error "Failed to generate valid SHA-256 password hash."

info "Updating admin user '${ADMIN_USER}' in PostgreSQL..."
psql "$PG_DSN" -v ON_ERROR_STOP=1 \
  -v admin_user="$ADMIN_USER" \
  -v password_hash="$PASSWORD_HASH" <<'SQL'
CREATE TABLE IF NOT EXISTS admin_users (
  id            SERIAL PRIMARY KEY,
  username      TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  role          TEXT NOT NULL DEFAULT 'reseller',
  max_users     INT  NOT NULL DEFAULT 30,
  expires_at    TIMESTAMPTZ,
  is_active     BOOLEAN NOT NULL DEFAULT TRUE,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

INSERT INTO admin_users (username, password_hash, role, max_users, expires_at, is_active)
VALUES (:'admin_user', :'password_hash', 'superadmin', 0, NULL, TRUE)
ON CONFLICT (username) DO UPDATE SET
  password_hash = EXCLUDED.password_hash,
  role          = 'superadmin',
  max_users     = 0,
  expires_at    = NULL,
  is_active     = TRUE;
SQL

if [[ "$ADMIN_USER" == "admin" ]]; then
  update_env_password "$NEW_PASSWORD"
  info "Updated ADMIN_PASSWORD inside $ENV_FILE"
else
  warn "ADMIN_PASSWORD in $ENV_FILE was not changed because username is not 'admin'."
fi

if ! $NO_RESTART; then
  info "Restarting ${SERVICE_NAME} so the in-memory admin cache reloads..."
  if command -v systemctl >/dev/null 2>&1 && systemctl list-unit-files "${SERVICE_NAME}.service" >/dev/null 2>&1; then
    systemctl restart "$SERVICE_NAME"
    sleep 1
    if systemctl is-active --quiet "$SERVICE_NAME"; then
      info "${SERVICE_NAME} restarted successfully."
    else
      warn "${SERVICE_NAME} is not active after restart. Last logs:"
      journalctl -u "$SERVICE_NAME" -n 30 --no-pager 2>/dev/null || true
      exit 1
    fi
  elif command -v service >/dev/null 2>&1; then
    service "$SERVICE_NAME" restart || warn "Could not restart ${SERVICE_NAME}. Restart it manually."
  else
    warn "Could not restart ${SERVICE_NAME}. Restart it manually before logging in."
  fi
else
  warn "Service restart skipped. Restart ${SERVICE_NAME} manually before logging in."
fi

echo
info "Admin password changed."
echo "  Username : ${ADMIN_USER}"
echo "  Password : ${NEW_PASSWORD}"
echo
warn "Save this password now. It is only shown here."
