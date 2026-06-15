#!/bin/bash
# Auto-install script for SSH Panel + Xray-core (multi-distro Linux/systemd)
# Usage:  sudo bash install.sh
set -euo pipefail

RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'; NC='\033[0m'
info()  { echo -e "${GREEN}[+]${NC} $*"; }
warn()  { echo -e "${YELLOW}[!]${NC} $*"; }
error() { echo -e "${RED}[x]${NC} $*"; exit 1; }

# ── config ──────────────────────────────────────────────────────────────────
INSTALL_DIR="/opt/sshpanel"
SERVICE_NAME="sshpanel"
LOG_TMPFS_SIZE="${LOG_TMPFS_SIZE:-15m}"
PANEL_LOG_MAX_BYTES="${PANEL_LOG_MAX_BYTES:-1048576}"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
GO_VERSION="${GO_VERSION:-$(awk '$1 == "go" {print $2; exit}' "$SCRIPT_DIR/go.mod" 2>/dev/null || echo "1.22.5")}"
MKDIR_BIN="$(command -v mkdir 2>/dev/null || true)"
[[ -n "$MKDIR_BIN" ]] || MKDIR_BIN="/bin/mkdir"
# ────────────────────────────────────────────────────────────────────────────

[[ $EUID -ne 0 ]] && error "Run as root: sudo bash $0"

# Cross-distro helpers -------------------------------------------------------
PKG_MANAGER=""
PKG_DEPS=()
PKG_OPTIONAL_DEPS=()
SYSTEMCTL_BIN=""
SH_BIN="$(command -v sh 2>/dev/null || echo /bin/sh)"
MOUNT_BIN="$(command -v mount 2>/dev/null || echo /bin/mount)"
MOUNTPOINT_BIN="$(command -v mountpoint 2>/dev/null || echo /usr/bin/mountpoint)"
TOUCH_BIN="$(command -v touch 2>/dev/null || echo /usr/bin/touch)"
CHMOD_BIN="$(command -v chmod 2>/dev/null || echo /usr/bin/chmod)"

require_systemd() {
  SYSTEMCTL_BIN="$(command -v systemctl 2>/dev/null || true)"
  if [[ -z "$SYSTEMCTL_BIN" ]]; then
    error "systemd was not found. This installer supports Linux distributions that use systemd for services."
  fi
}

detect_pkg_manager() {
  if command -v apt-get >/dev/null 2>&1; then
    PKG_MANAGER="apt"
  elif command -v dnf >/dev/null 2>&1; then
    PKG_MANAGER="dnf"
  elif command -v yum >/dev/null 2>&1; then
    PKG_MANAGER="yum"
  elif command -v zypper >/dev/null 2>&1; then
    PKG_MANAGER="zypper"
  elif command -v pacman >/dev/null 2>&1; then
    PKG_MANAGER="pacman"
  elif command -v apk >/dev/null 2>&1; then
    PKG_MANAGER="apk"
  else
    error "No supported package manager found. Supported: apt, dnf, yum, zypper, pacman, apk."
  fi
}

set_package_deps() {
  case "$PKG_MANAGER" in
    apt)
      PKG_DEPS=(curl wget git rsync build-essential postgresql ca-certificates unzip openssh-client openssl python3 tar gzip)
      PKG_OPTIONAL_DEPS=(postgresql-contrib iptables nftables)
      ;;
    dnf|yum)
      PKG_DEPS=(curl wget git rsync gcc make postgresql-server ca-certificates unzip openssh-clients openssl python3 tar gzip)
      PKG_OPTIONAL_DEPS=(postgresql-contrib iptables nftables)
      ;;
    zypper)
      PKG_DEPS=(curl wget git rsync gcc make postgresql-server ca-certificates unzip openssh openssl python3 tar gzip)
      PKG_OPTIONAL_DEPS=(postgresql-contrib iptables nftables)
      ;;
    pacman)
      PKG_DEPS=(curl wget git rsync base-devel postgresql ca-certificates unzip openssh openssl python tar gzip)
      PKG_OPTIONAL_DEPS=(iptables-nft nftables)
      ;;
    apk)
      PKG_DEPS=(curl wget git rsync build-base postgresql ca-certificates unzip openssh-client openssl python3 tar gzip)
      PKG_OPTIONAL_DEPS=(postgresql-contrib iptables nftables)
      ;;
  esac
}

pkg_update() {
  case "$PKG_MANAGER" in
    apt) apt-get update -qq ;;
    dnf) dnf makecache -q ;;
    yum) yum makecache -q ;;
    zypper) zypper --non-interactive refresh ;;
    pacman) pacman -Sy --noconfirm ;;
    apk) apk update ;;
  esac
}

pkg_install() {
  case "$PKG_MANAGER" in
    apt) DEBIAN_FRONTEND=noninteractive apt-get install -y --no-install-recommends "$@" ;;
    dnf) dnf install -y "$@" ;;
    yum) yum install -y "$@" ;;
    zypper) zypper --non-interactive install -y "$@" ;;
    pacman) pacman -S --noconfirm --needed "$@" ;;
    apk) apk add --no-cache "$@" ;;
  esac
}

pkg_install_optional() {
  local pkg
  for pkg in "$@"; do
    pkg_install "$pkg" >/dev/null 2>&1 || warn "  Optional package '$pkg' could not be installed; continuing."
  done
}

postgres_data_dir() {
  for dir in /var/lib/postgresql/data /var/lib/pgsql/data /var/lib/postgres/data; do
    [[ -d "$dir" || -d "$(dirname "$dir")" ]] && { printf '%s\n' "$dir"; return 0; }
  done
  printf '%s\n' /var/lib/postgresql/data
}

init_postgresql_if_needed() {
  case "$PKG_MANAGER" in
    dnf|yum|zypper)
      postgresql-setup --initdb >/dev/null 2>&1 || true
      ;;
    pacman)
      local data_dir
      data_dir="$(postgres_data_dir)"
      if [[ ! -s "$data_dir/PG_VERSION" ]]; then
        mkdir -p "$data_dir"
        chown -R postgres:postgres "$(dirname "$data_dir")"
        if command -v runuser >/dev/null 2>&1; then
          runuser -u postgres -- initdb -D "$data_dir" >/dev/null 2>&1 || true
        else
          su - postgres -c "initdb -D '$data_dir'" >/dev/null 2>&1 || true
        fi
      fi
      ;;
    apk)
      if command -v rc-service >/dev/null 2>&1; then
        rc-service postgresql setup >/dev/null 2>&1 || true
      fi
      ;;
  esac
}

start_enable_postgresql() {
  local started=false svc
  for svc in postgresql postgresql.service; do
    if "$SYSTEMCTL_BIN" start "$svc" >/dev/null 2>&1; then
      "$SYSTEMCTL_BIN" enable "$svc" >/dev/null 2>&1 || true
      started=true
      break
    fi
  done
  if ! $started && command -v service >/dev/null 2>&1; then
    service postgresql start >/dev/null 2>&1 && started=true || true
  fi
  $started || warn "  Could not start PostgreSQL automatically; continuing in case it is already running."
}

ensure_log_tmpfs_mount() {
  local log_dir="${INSTALL_DIR}/logs"
  local opts="rw,nosuid,nodev,noexec,noatime,nofail,size=${LOG_TMPFS_SIZE},mode=0755"
  local tmp_fstab

  mkdir -p "$log_dir"

  if [[ -f /etc/fstab ]]; then
    cp /etc/fstab "/etc/fstab.sshpanel.bak.$(date +%s)" 2>/dev/null || true
    tmp_fstab="$(mktemp)"
    awk -v mp="$log_dir" '!(($1 == "tmpfs") && ($2 == mp) && ($3 == "tmpfs")) {print}' /etc/fstab > "$tmp_fstab"
    printf 'tmpfs %s tmpfs %s 0 0\n' "$log_dir" "$opts" >> "$tmp_fstab"
    cat "$tmp_fstab" > /etc/fstab
    rm -f "$tmp_fstab"
    info "  Log RAM disk automount saved in /etc/fstab: $log_dir (${LOG_TMPFS_SIZE})"
  else
    warn "  /etc/fstab not found; service startup fallback will mount $log_dir as tmpfs"
  fi

  "${SYSTEMCTL_BIN:-systemctl}" daemon-reload >/dev/null 2>&1 || true
  if command -v mountpoint >/dev/null 2>&1 && mountpoint -q "$log_dir"; then
    mount -o "remount,size=${LOG_TMPFS_SIZE},mode=0755" "$log_dir" >/dev/null 2>&1 || true
  else
    mount "$log_dir" >/dev/null 2>&1 || mount -t tmpfs -o "size=${LOG_TMPFS_SIZE},mode=0755" tmpfs "$log_dir" >/dev/null 2>&1 || \
      warn "  Could not mount $log_dir as tmpfs now; service startup fallback will try again"
  fi

  touch "$log_dir/panel.log" >/dev/null 2>&1 || true
  chmod 0644 "$log_dir/panel.log" >/dev/null 2>&1 || true
}

echo -e "\n${GREEN}══════════════════════════════════════════${NC}"
echo -e "${GREEN}   SSH Panel + Xray-core  ·  Installer     ${NC}"
echo -e "${GREEN}══════════════════════════════════════════${NC}\n"

# ── 1. OS / package-manager detection ────────────────────────────────────────
info "[1/10] Detecting Linux distribution and package manager…"
if [[ -f /etc/os-release ]]; then
  # shellcheck disable=SC1091
  . /etc/os-release
  OS_ID="${ID:-unknown}"
  OS_LIKE="${ID_LIKE:-}"
  OS_PRETTY="${PRETTY_NAME:-$OS_ID}"
else
  OS_ID="unknown"
  OS_LIKE=""
  OS_PRETTY="unknown Linux"
fi

require_systemd
detect_pkg_manager
set_package_deps
info "  OS             : $OS_PRETTY"
info "  ID / ID_LIKE   : $OS_ID / ${OS_LIKE:-none}"
info "  Package manager: $PKG_MANAGER"
info "  Service manager: systemd"

# ── 2. System dependencies ───────────────────────────────────────────────────
info "[2/10] Installing system packages…"
pkg_update
pkg_install "${PKG_DEPS[@]}"
pkg_install_optional "${PKG_OPTIONAL_DEPS[@]}"

# ── 3. Go ────────────────────────────────────────────────────────────────────
info "[3/10] Installing Go ${GO_VERSION}…"
NEED_GO=true
if command -v go &>/dev/null; then
  CURRENT_GO=$(go version 2>/dev/null | awk '{print $3}' | sed 's/go//')
  if [[ "$(printf '%s\n' "$GO_VERSION" "$CURRENT_GO" | sort -V | head -1)" == "$GO_VERSION" ]]; then
    info "  Go $CURRENT_GO already installed — skipping"
    NEED_GO=false
  fi
fi

if $NEED_GO; then
  MACHINE=$(uname -m)
  case "$MACHINE" in
    x86_64)  GOARCH="amd64" ;;
    aarch64) GOARCH="arm64" ;;
    armv7l)  GOARCH="armv6l" ;;
    *)       GOARCH="amd64" ;;
  esac
  GO_URL="https://go.dev/dl/go${GO_VERSION}.linux-${GOARCH}.tar.gz"
  info "  Downloading $GO_URL"
  wget -q --show-progress -O /tmp/go.tar.gz "$GO_URL"
  rm -rf /usr/local/go
  tar -C /usr/local -xzf /tmp/go.tar.gz
  rm -f /tmp/go.tar.gz
  echo 'export PATH=$PATH:/usr/local/go/bin' > /etc/profile.d/go.sh
  chmod +x /etc/profile.d/go.sh
fi

export PATH=$PATH:/usr/local/go/bin
go version

# ── 4. Directory layout ──────────────────────────────────────────────────────
info "[4/10] Setting up ${INSTALL_DIR}…"
mkdir -p "$INSTALL_DIR/admin" "$INSTALL_DIR/keys" "$INSTALL_DIR/logs"
ensure_log_tmpfs_mount

# ── 5. Build SSH panel binary ────────────────────────────────────────────────
info "[5/10] Building SSH Panel binary…"
cd "$SCRIPT_DIR"
export GOPATH=/tmp/gopath_sshpanel
export GOCACHE=/tmp/gocache_sshpanel
go mod download
go build -ldflags="-s -w" -o "$INSTALL_DIR/sshpanel" .
info "  Binary: $INSTALL_DIR/sshpanel"
cp -r "$SCRIPT_DIR/admin/"* "$INSTALL_DIR/admin/"
info "  Admin panel copied"
if [[ -f "$SCRIPT_DIR/update.sh" ]]; then
  cp "$SCRIPT_DIR/update.sh" "$INSTALL_DIR/update.sh"
  chmod 700 "$INSTALL_DIR/update.sh"
  info "  Git updater copied"
fi
if [[ -f "$SCRIPT_DIR/change_admin_password.sh" ]]; then
  cp "$SCRIPT_DIR/change_admin_password.sh" "$INSTALL_DIR/change_admin_password.sh"
  chmod 700 "$INSTALL_DIR/change_admin_password.sh"
  info "  Admin password recovery script copied"
fi

# ── 6. Xray binary ──────────────────────────────────────────────────────────
info "[6/10] Downloading Xray-core…"
XRAY_VER=$(curl -sf "https://api.github.com/repos/XTLS/Xray-core/releases/latest" \
  | grep '"tag_name"' | head -1 | cut -d'"' -f4 || echo "v24.11.30")
MACHINE=$(uname -m)
case "$MACHINE" in
  x86_64)  XRAY_ARCH="64" ;;
  aarch64) XRAY_ARCH="arm64-v8a" ;;
  armv7l)  XRAY_ARCH="arm32-v7a" ;;
  *)       XRAY_ARCH="64" ;;
esac
XRAY_URL="https://github.com/XTLS/Xray-core/releases/download/${XRAY_VER}/Xray-linux-${XRAY_ARCH}.zip"
info "  Xray ${XRAY_VER} (${XRAY_ARCH})"
wget -q --show-progress -O /tmp/xray.zip "$XRAY_URL"
unzip -o /tmp/xray.zip xray -d "$INSTALL_DIR" > /dev/null 2>&1 || {
  mkdir -p /tmp/xray_extract
  unzip -o /tmp/xray.zip -d /tmp/xray_extract > /dev/null 2>&1
  mv /tmp/xray_extract/xray "$INSTALL_DIR/xray"
}
chmod +x "$INSTALL_DIR/xray"
rm -f /tmp/xray.zip
"$INSTALL_DIR/xray" version

# ── 7. PostgreSQL ────────────────────────────────────────────────────────────
info "[7/10] Configuring PostgreSQL…"
init_postgresql_if_needed
start_enable_postgresql

DB_NAME="sshpanel"
DB_USER="sshpanel"
DB_PASS=$(tr -dc 'A-Za-z0-9' < /dev/urandom | head -c 32 || true)
if [[ ${#DB_PASS} -lt 32 ]]; then
  DB_PASS=$(openssl rand -hex 16 2>/dev/null || date +%s%N)
fi

su -c "psql -tc \"SELECT 1 FROM pg_roles WHERE rolname='${DB_USER}'\" | grep -q 1 || \
       psql -c \"CREATE USER ${DB_USER} WITH PASSWORD '${DB_PASS}';\"" postgres
# Reinstall-safe: if the role already existed, make the new .env password valid.
su -c "psql -c \"ALTER USER ${DB_USER} WITH PASSWORD '${DB_PASS}';\"" postgres

su -c "psql -tc \"SELECT 1 FROM pg_database WHERE datname='${DB_NAME}'\" | grep -q 1 || \
       psql -c \"CREATE DATABASE ${DB_NAME} OWNER ${DB_USER};\"" postgres
# Reinstall-safe: if the database already existed, make sshpanel its owner.
su -c "psql -c \"ALTER DATABASE ${DB_NAME} OWNER TO ${DB_USER};\"" postgres

su -c "psql -d ${DB_NAME} -c \"
CREATE TABLE IF NOT EXISTS ssh_users (
  username              TEXT PRIMARY KEY,
  password              TEXT NOT NULL DEFAULT '',
  max_connections       INT  NOT NULL DEFAULT 0,
  expires_at            TEXT,
  limit_mbps_up         INT  NOT NULL DEFAULT 0,
  limit_mbps_down       INT  NOT NULL DEFAULT 0,
  totp_secret           TEXT NOT NULL DEFAULT '',
  totp_period           INT  NOT NULL DEFAULT 60,
  totp_window           INT  NOT NULL DEFAULT 1,
  totp_digits           INT  NOT NULL DEFAULT 6,
  allow_static_password BOOLEAN NOT NULL DEFAULT FALSE,
  owner_username        TEXT NOT NULL DEFAULT ''
);
ALTER TABLE ssh_users ADD COLUMN IF NOT EXISTS totp_secret TEXT NOT NULL DEFAULT '';
ALTER TABLE ssh_users ADD COLUMN IF NOT EXISTS totp_period INT NOT NULL DEFAULT 60;
ALTER TABLE ssh_users ADD COLUMN IF NOT EXISTS totp_window INT NOT NULL DEFAULT 1;
ALTER TABLE ssh_users ADD COLUMN IF NOT EXISTS totp_digits INT NOT NULL DEFAULT 6;
ALTER TABLE ssh_users ADD COLUMN IF NOT EXISTS allow_static_password BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE ssh_users ADD COLUMN IF NOT EXISTS owner_username TEXT NOT NULL DEFAULT '';
ALTER TABLE ssh_users ALTER COLUMN password SET DEFAULT '';

CREATE TABLE IF NOT EXISTS ssh_iface_totals (
  iface                TEXT PRIMARY KEY,
  total_rx_bytes       BIGINT NOT NULL DEFAULT 0,
  total_tx_bytes       BIGINT NOT NULL DEFAULT 0,
  last_kernel_rx_bytes BIGINT NOT NULL DEFAULT 0,
  last_kernel_tx_bytes BIGINT NOT NULL DEFAULT 0,
  updated_at           TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
ALTER TABLE ssh_iface_totals ADD COLUMN IF NOT EXISTS total_rx_bytes BIGINT NOT NULL DEFAULT 0;
ALTER TABLE ssh_iface_totals ADD COLUMN IF NOT EXISTS total_tx_bytes BIGINT NOT NULL DEFAULT 0;
ALTER TABLE ssh_iface_totals ADD COLUMN IF NOT EXISTS last_kernel_rx_bytes BIGINT NOT NULL DEFAULT 0;
ALTER TABLE ssh_iface_totals ADD COLUMN IF NOT EXISTS last_kernel_tx_bytes BIGINT NOT NULL DEFAULT 0;
ALTER TABLE ssh_iface_totals ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();

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

CREATE TABLE IF NOT EXISTS xray_clients (
  uuid        TEXT PRIMARY KEY,
  name        TEXT NOT NULL DEFAULT '',
  email       TEXT NOT NULL DEFAULT '',
  inbound_tag TEXT NOT NULL DEFAULT '',
  expires_at  TIMESTAMPTZ,
  max_conns   INT NOT NULL DEFAULT 0,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER SCHEMA public OWNER TO ${DB_USER};
ALTER TABLE IF EXISTS ssh_users OWNER TO ${DB_USER};
ALTER TABLE IF EXISTS ssh_iface_totals OWNER TO ${DB_USER};
ALTER TABLE IF EXISTS admin_users OWNER TO ${DB_USER};
ALTER TABLE IF EXISTS xray_clients OWNER TO ${DB_USER};
ALTER SEQUENCE IF EXISTS admin_users_id_seq OWNER TO ${DB_USER};
GRANT ALL PRIVILEGES ON DATABASE ${DB_NAME} TO ${DB_USER};
GRANT ALL PRIVILEGES ON SCHEMA public TO ${DB_USER};
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO ${DB_USER};
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO ${DB_USER};
\"" postgres

info "  PostgreSQL database '${DB_NAME}' ready"

# ── 8. Config files ──────────────────────────────────────────────────────────
info "[8/10] Generating config files…"

# Admin token
ADMIN_TOKEN=$(tr -dc 'A-Za-z0-9' < /dev/urandom | head -c 48 || true)
if [[ ${#ADMIN_TOKEN} -lt 48 ]]; then
  ADMIN_TOKEN=$(openssl rand -hex 24 2>/dev/null || date +%s%N)
fi

# Admin panel login password. The web panel login is username/password;
# ADMIN_TOKEN is only for bearer-token API access and is not the login password.
ADMIN_PASSWORD=$(tr -dc 'A-Za-z0-9' < /dev/urandom | head -c 20 || true)
if [[ ${#ADMIN_PASSWORD} -lt 20 ]]; then
  ADMIN_PASSWORD=$(openssl rand -hex 10 2>/dev/null || date +%s%N)
fi
ADMIN_PASSWORD_HASH=$(printf '%s' "${ADMIN_PASSWORD}" | sha256sum | awk '{print $1}')
su -c "psql -d ${DB_NAME}" postgres <<SQL
INSERT INTO admin_users (username, password_hash, role, max_users, expires_at, is_active)
VALUES ('admin', '${ADMIN_PASSWORD_HASH}', 'superadmin', 0, NULL, TRUE)
ON CONFLICT (username) DO UPDATE SET
  password_hash = EXCLUDED.password_hash,
  role = 'superadmin',
  max_users = 0,
  expires_at = NULL,
  is_active = TRUE;
SQL

# .env
cat > "$INSTALL_DIR/.env" <<EOF
PG_DSN=postgres://${DB_USER}:${DB_PASS}@127.0.0.1:5432/${DB_NAME}?sslmode=disable
ADMIN_TOKEN=${ADMIN_TOKEN}
ADMIN_PASSWORD=${ADMIN_PASSWORD}
ADMIN_HTTP_ADDR=0.0.0.0:9090
EOF
chmod 600 "$INSTALL_DIR/.env"

# SSH host key (RSA, required by current build)
if [[ ! -f "$INSTALL_DIR/ssh_host_rsa_key" ]]; then
  ssh-keygen -t rsa -b 2048 -f "$INSTALL_DIR/ssh_host_rsa_key" -N "" -C "sshpanel-hostkey" -q
  info "  Generated RSA host key"
fi

# Server public IP (best-effort)
SERVER_IP=$(curl -sf --max-time 5 https://checkip.amazonaws.com 2>/dev/null \
         || curl -sf --max-time 5 https://api.ipify.org 2>/dev/null \
         || hostname -I | awk '{print $1}')

# config.json
cat > "$INSTALL_DIR/config.json" <<EOF
{
  "listen": "0.0.0.0:80",
  "extra_listen": ["0.0.0.0:8080"],
  "host_key_file": "${INSTALL_DIR}/ssh_host_rsa_key",
  "quiet": false,
  "admin_dir": "${INSTALL_DIR}/admin",
  "banner_file": "${INSTALL_DIR}/banner.txt",
  "xray": {
    "enabled": true,
    "bin_path": "${INSTALL_DIR}/xray",
    "config_file": "${INSTALL_DIR}/xray_config.json"
  }
}
EOF
touch "$INSTALL_DIR/banner.txt"

# UUID for default VLESS client
UUID=$(cat /proc/sys/kernel/random/uuid 2>/dev/null \
    || python3 -c "import uuid; print(uuid.uuid4())" 2>/dev/null \
    || echo "11111111-2222-3333-4444-555555555555")

# xray_config.json  (default VLESS + SOCKS inbounds — no geoip routing needed)
cat > "$INSTALL_DIR/xray_config.json" <<EOF
{
  "log": { "loglevel": "warning" },
  "inbounds": [
    {
      "tag": "vless-in",
      "port": 10086,
      "listen": "0.0.0.0",
      "protocol": "vless",
      "settings": {
        "clients": [{ "id": "${UUID}", "level": 0 }],
        "decryption": "none"
      },
      "streamSettings": { "network": "tcp" }
    },
    {
      "tag": "socks-local",
      "port": 10088,
      "listen": "127.0.0.1",
      "protocol": "socks",
      "settings": { "auth": "noauth", "udp": true }
    }
  ],
  "outbounds": [
    { "tag": "direct",  "protocol": "freedom",  "settings": {} },
    { "tag": "blocked", "protocol": "blackhole", "settings": {} }
  ]
}
EOF
chmod 600 "$INSTALL_DIR/xray_config.json"
info "  VLESS UUID: ${UUID}"

# ── 9. DNSTT DNS/53 redirect ─────────────────────────────────────────────────
info "[9/10] Configuring DNSTT DNS redirect (UDP 53 -> 5300)…"
cat > /usr/local/sbin/sshpanel-dnstt-redirect.sh <<'EOS'
#!/bin/bash
set -euo pipefail
DNS_UPSTREAM="${DNS_UPSTREAM:-1.1.1.1}"
DNSTT_PORT="${DNSTT_PORT:-5300}"

# Free port 53 on systemd-resolved based systems and keep outbound DNS working.
if command -v systemctl >/dev/null 2>&1; then
  systemctl disable --now systemd-resolved.service >/dev/null 2>&1 || true
fi
rm -f /etc/resolv.conf
printf 'nameserver %s\n' "$DNS_UPSTREAM" > /etc/resolv.conf

# Open DNS/UDP in common Linux firewalls when they are active.
if command -v ufw >/dev/null 2>&1; then
  ufw allow 53/udp >/dev/null 2>&1 || true
fi
if command -v firewall-cmd >/dev/null 2>&1 && firewall-cmd --state >/dev/null 2>&1; then
  firewall-cmd --permanent --add-port=53/udp >/dev/null 2>&1 || true
  firewall-cmd --reload >/dev/null 2>&1 || true
fi

add_iptables_rule() {
  local bin="$1" chain="$2"
  "$bin" -t nat -C "$chain" -p udp --dport 53 -j REDIRECT --to-ports "$DNSTT_PORT" 2>/dev/null \
    || "$bin" -t nat -A "$chain" -p udp --dport 53 -j REDIRECT --to-ports "$DNSTT_PORT"
}

if command -v iptables >/dev/null 2>&1; then
  add_iptables_rule iptables PREROUTING
fi

if command -v ip6tables >/dev/null 2>&1; then
  add_iptables_rule ip6tables PREROUTING || true
fi

# Fallback for minimal systems where only nft is present.
if ! command -v iptables >/dev/null 2>&1 && command -v nft >/dev/null 2>&1; then
  nft add table inet sshpanel_nat 2>/dev/null || true
  nft 'add chain inet sshpanel_nat prerouting { type nat hook prerouting priority dstnat; policy accept; }' 2>/dev/null || true
  nft list chain inet sshpanel_nat prerouting 2>/dev/null | grep -q "udp dport 53 redirect to :$DNSTT_PORT" \
    || nft add rule inet sshpanel_nat prerouting udp dport 53 redirect to :"$DNSTT_PORT"
fi
EOS
chmod +x /usr/local/sbin/sshpanel-dnstt-redirect.sh

cat > /etc/systemd/system/sshpanel-dnstt-redirect.service <<'EOF'
[Unit]
Description=SSH Panel DNSTT DNS redirect (UDP 53 to 5300)
After=network.target
Before=sshpanel.service

[Service]
Type=oneshot
ExecStart=/usr/local/sbin/sshpanel-dnstt-redirect.sh
RemainAfterExit=yes

[Install]
WantedBy=multi-user.target
EOF

"$SYSTEMCTL_BIN" daemon-reload
"$SYSTEMCTL_BIN" enable --now sshpanel-dnstt-redirect.service || warn "DNSTT DNS redirect service failed; check: journalctl -u sshpanel-dnstt-redirect -e"
info "  DNSTT DNS redirect installed: UDP 53 -> 5300"

# ── 10. Systemd service ──────────────────────────────────────────────────────
info "[10/10] Creating systemd service '${SERVICE_NAME}'…"
cat > "/etc/systemd/system/${SERVICE_NAME}.service" <<EOF
[Unit]
Description=SSH Panel + Xray-core Server
After=local-fs.target network.target postgresql.service sshpanel-dnstt-redirect.service
Wants=postgresql.service sshpanel-dnstt-redirect.service

[Service]
Type=simple
WorkingDirectory=${INSTALL_DIR}
EnvironmentFile=${INSTALL_DIR}/.env
Environment=PANEL_LOG_FILE=${INSTALL_DIR}/logs/panel.log
Environment=PANEL_LOG_MAX_BYTES=${PANEL_LOG_MAX_BYTES}
ExecStartPre=${MKDIR_BIN} -p ${INSTALL_DIR}/logs
ExecStartPre=${SH_BIN} -c '${MOUNTPOINT_BIN} -q ${INSTALL_DIR}/logs || ${MOUNT_BIN} -t tmpfs -o size=${LOG_TMPFS_SIZE},mode=0755 tmpfs ${INSTALL_DIR}/logs || true'
ExecStartPre=${SH_BIN} -c '${TOUCH_BIN} ${INSTALL_DIR}/logs/panel.log && ${CHMOD_BIN} 0644 ${INSTALL_DIR}/logs/panel.log || true'
ExecStart=${INSTALL_DIR}/sshpanel -config ${INSTALL_DIR}/config.json
Restart=always
RestartSec=5
User=root
LimitNOFILE=65536
StandardOutput=journal
StandardError=journal

[Install]
WantedBy=multi-user.target
EOF

"$SYSTEMCTL_BIN" daemon-reload
"$SYSTEMCTL_BIN" enable  "$SERVICE_NAME"
"$SYSTEMCTL_BIN" restart "$SERVICE_NAME"

sleep 2
echo ""
echo -e "${GREEN}══════════════════════════════════════════${NC}"
echo -e "${GREEN}   Installation complete!                  ${NC}"
echo -e "${GREEN}══════════════════════════════════════════${NC}"
echo ""
echo -e "  Server IP    : ${YELLOW}${SERVER_IP}${NC}"
echo -e "  SSH ports    : 80, 8080  (HTTP-injected SSH)"
echo -e "  VLESS port   : 10086"
echo -e "  VLESS UUID   : ${YELLOW}${UUID}${NC}"
echo -e "  DNSTT DNS    : UDP 53 redirects to local UDP 5300"
echo ""
echo -e "  Admin panel  : ${YELLOW}http://${SERVER_IP}:9090${NC}"
echo -e "  Admin login  : ${YELLOW}admin${NC}"
echo -e "  Admin password: ${YELLOW}${ADMIN_PASSWORD}${NC}"
echo -e "  Admin token  : ${YELLOW}${ADMIN_TOKEN}${NC}"
echo ""
echo -e "  Token + DB creds stored in: ${INSTALL_DIR}/.env"
echo -e "  Logs: journalctl -u ${SERVICE_NAME} -f"
echo -e "        tail -f ${INSTALL_DIR}/logs/panel.log"
echo ""
echo -e "${YELLOW}Save your admin login/password. The admin token is for API bearer-token access only.${NC}"
echo ""
"$SYSTEMCTL_BIN" status "$SERVICE_NAME" --no-pager -l || true
