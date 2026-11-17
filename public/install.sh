#!/usr/bin/env bash
# ──────────────────────────────────────────────────────────────────────
#  unser-geheimnis.de — Self-Hosted Installer
#
#  Installiert oder aktualisiert unser-geheimnis auf einem Debian-/Ubuntu-
#  Server: Node.js, App, SQLite-Datenbank, systemd-Dienst und optional
#  Caddy als Reverse-Proxy mit automatischem HTTPS (Let's Encrypt).
#
#  Installation:
#    curl -fsSL https://unser-geheimnis.de/install.sh -o install.sh
#    less install.sh            # bitte vorher lesen!
#    sudo bash install.sh --domain secrets.example.de
#
#  Update:
#    sudo bash install.sh update
#
#  Alle Optionen:  bash install.sh --help
#  Lizenz: MIT — https://github.com/LeonMTN05/unser-geheimnis
# ──────────────────────────────────────────────────────────────────────
set -Eeuo pipefail

# ── Standardwerte (per Option oder Umgebungsvariable überschreibbar) ──
REPO="${UG_REPO:-https://github.com/LeonMTN05/unser-geheimnis.git}"
BRANCH="${UG_BRANCH:-main}"
INSTALL_DIR="${UG_DIR:-/opt/unser-geheimnis}"
APP_USER="${UG_USER:-geheimnis}"
SERVICE="${UG_SERVICE:-unser-geheimnis}"
PORT="${UG_PORT:-3000}"
DOMAIN="${UG_DOMAIN:-}"
PROXY="${UG_PROXY:-}"            # caddy | none
SMTP_HOST="${UG_SMTP_HOST:-}"
SMTP_PORT="${UG_SMTP_PORT:-587}"
SMTP_USER="${UG_SMTP_USER:-}"
SMTP_PASS="${UG_SMTP_PASS:-}"
MAIL_FROM="${UG_MAIL_FROM:-}"
NODE_MAJOR=22
export PRISMA_HIDE_UPDATE_MESSAGE=1 NEXT_TELEMETRY_DISABLED=1
ASSUME_YES=0
MODE="install"

# ── Ausgabe ───────────────────────────────────────────────────────────
if [[ -t 1 ]]; then
  B=$'\e[1m'; G=$'\e[32m'; Y=$'\e[33m'; R=$'\e[31m'; C=$'\e[36m'; N=$'\e[0m'
else
  B=""; G=""; Y=""; R=""; C=""; N=""
fi
step() { echo; echo "${B}${C}==>${N}${B} $*${N}"; }
info() { echo "    $*"; }
ok()   { echo "    ${G}✓${N} $*"; }
warn() { echo "    ${Y}!${N} $*"; }
die()  { echo; echo "${R}${B}Fehler:${N} $*" >&2; exit 1; }
trap 'die "Abbruch in Zeile $LINENO (Befehl: $BASH_COMMAND)"' ERR

usage() {
  cat <<EOF
${B}unser-geheimnis — Self-Hosted Installer${N}

Verwendung:
  sudo bash install.sh [install] [Optionen]   Neu installieren
  sudo bash install.sh update                 Auf neueste Version aktualisieren

Optionen:
  --domain <name>       Öffentliche Domain, z. B. secrets.example.de (Pflicht)
  --proxy <caddy|none>  Caddy mit automatischem HTTPS einrichten (Standard: fragt nach)
  --dir <pfad>          Installationsverzeichnis (Standard: $INSTALL_DIR)
  --port <port>         Interner Port der App (Standard: $PORT)
  --branch <name>       Git-Branch (Standard: $BRANCH)
  --repo <url>          Git-Repository (Standard: $REPO)
  --smtp-host <host>    SMTP-Server für „Daten anfordern“ per E-Mail (optional)
  --smtp-port <port>    SMTP-Port (Standard: 587)
  --smtp-user <user>    SMTP-Benutzer
  --smtp-pass <pass>    SMTP-Passwort (besser interaktiv eingeben)
  --mail-from <from>    Absender, z. B. "Secrets <noreply@example.de>"
  -y, --yes             Keine Rückfragen (alle Pflichtwerte per Option)
  -h, --help            Diese Hilfe

Alle Optionen gibt es auch als Umgebungsvariable mit Präfix UG_,
z. B. UG_DOMAIN=secrets.example.de.
EOF
}

# ── Argumente ─────────────────────────────────────────────────────────
while [[ $# -gt 0 ]]; do
  case "$1" in
    install) MODE="install" ;;
    update)  MODE="update" ;;
    --domain)    DOMAIN="${2:?}"; shift ;;
    --proxy)     PROXY="${2:?}"; shift ;;
    --dir)       INSTALL_DIR="${2:?}"; shift ;;
    --port)      PORT="${2:?}"; shift ;;
    --branch)    BRANCH="${2:?}"; shift ;;
    --repo)      REPO="${2:?}"; shift ;;
    --smtp-host) SMTP_HOST="${2:?}"; shift ;;
    --smtp-port) SMTP_PORT="${2:?}"; shift ;;
    --smtp-user) SMTP_USER="${2:?}"; shift ;;
    --smtp-pass) SMTP_PASS="${2:?}"; shift ;;
    --mail-from) MAIL_FROM="${2:?}"; shift ;;
    -y|--yes)    ASSUME_YES=1 ;;
    -h|--help)   usage; exit 0 ;;
    *) die "Unbekannte Option: $1 (siehe --help)" ;;
  esac
  shift
done

# Rückfragen auch bei "curl … | bash" über das Terminal ermöglichen
TTY=""
if [[ $ASSUME_YES -eq 0 ]] && { : </dev/tty; } 2>/dev/null; then TTY=/dev/tty; fi

ask() { # ask <Variable> <Frage> [Standard] [secret]
  local __var="$1" __q="$2" __def="${3:-}" __secret="${4:-}" __ans=""
  [[ -z "$TTY" ]] && { printf -v "$__var" '%s' "$__def"; return; }
  if [[ -n "$__secret" ]]; then
    read -r -s -p "    $__q: " __ans <"$TTY"; echo
  else
    read -r -p "    $__q${__def:+ [$__def]}: " __ans <"$TTY"
  fi
  printf -v "$__var" '%s' "${__ans:-$__def}"
}

confirm() { # confirm <Frage> → 0 = ja
  [[ -z "$TTY" ]] && return 0
  local a; read -r -p "    $1 [J/n]: " a <"$TTY"
  [[ -z "$a" || "$a" =~ ^[JjYy] ]]
}

as_app() { sudo -u "$APP_USER" -H bash -c "cd '$INSTALL_DIR' && set -a && . ./.env && set +a && $*"; }

# ── Vorbedingungen ────────────────────────────────────────────────────
preflight() {
  step "Systemprüfung"
  [[ $EUID -eq 0 ]] || die "Bitte als root ausführen (sudo bash install.sh …)."
  command -v apt-get >/dev/null || die "Nur Debian/Ubuntu (apt) werden unterstützt."
  command -v systemctl >/dev/null || die "systemd wird benötigt."
  . /etc/os-release
  ok "System: ${PRETTY_NAME:-unbekannt} ($(uname -m))"

  local mem_mb; mem_mb=$(awk '/MemTotal/ {print int($2/1024)}' /proc/meminfo)
  local swap_mb; swap_mb=$(awk '/SwapTotal/ {print int($2/1024)}' /proc/meminfo)
  if (( mem_mb + swap_mb < 1800 )); then
    warn "Nur ${mem_mb} MB RAM + ${swap_mb} MB Swap. Der Build braucht ca. 2 GB."
    warn "Tipp: fallocate -l 2G /swapfile && chmod 600 /swapfile && mkswap /swapfile && swapon /swapfile"
    confirm "Trotzdem fortfahren?" || exit 1
  else
    ok "Arbeitsspeicher: ${mem_mb} MB RAM, ${swap_mb} MB Swap"
  fi
}

install_packages() {
  step "Pakete installieren"
  export DEBIAN_FRONTEND=noninteractive
  apt-get update -qq
  apt-get install -y -qq ca-certificates curl git openssl sudo gnupg >/dev/null
  ok "curl, git, openssl, sudo"

  local have=0
  if command -v node >/dev/null; then have=$(node -p 'process.versions.node.split(".")[0]'); fi
  if (( have >= 20 )); then
    ok "Node.js $(node -v) vorhanden"
  else
    info "Installiere Node.js ${NODE_MAJOR} (NodeSource) …"
    curl -fsSL "https://deb.nodesource.com/setup_${NODE_MAJOR}.x" | bash - >/dev/null
    apt-get install -y -qq nodejs >/dev/null
    ok "Node.js $(node -v) installiert"
  fi
}

collect_config() {
  step "Konfiguration"
  if [[ -z "$DOMAIN" ]]; then ask DOMAIN "Domain (z. B. secrets.example.de)"; fi
  DOMAIN="${DOMAIN#http://}"; DOMAIN="${DOMAIN#https://}"; DOMAIN="${DOMAIN%%/*}"
  [[ "$DOMAIN" =~ ^[A-Za-z0-9.-]+(:[0-9]+)?$ ]] || die "Ungültige Domain: '$DOMAIN' (Option --domain)."
  ok "Domain: $DOMAIN"

  if [[ -z "$PROXY" ]]; then
    if command -v apache2 >/dev/null || command -v nginx >/dev/null; then
      warn "Apache/nginx gefunden — Caddy würde mit Port 80/443 kollidieren."
      PROXY=none
    elif confirm "Caddy als Reverse-Proxy mit automatischem HTTPS einrichten?"; then
      PROXY=caddy
    else
      PROXY=none
    fi
  fi
  [[ "$PROXY" == caddy || "$PROXY" == none ]] || die "--proxy muss 'caddy' oder 'none' sein."
  ok "Reverse-Proxy: $PROXY"

  if [[ -z "$SMTP_HOST" && -n "$TTY" ]]; then
    info "E-Mail-Versand (optional) wird nur für „Daten anfordern per E-Mail“ gebraucht."
    if confirm "SMTP jetzt einrichten? (später in .env möglich)"; then
      ask SMTP_HOST "SMTP-Host"
      ask SMTP_PORT "SMTP-Port" "587"
      ask SMTP_USER "SMTP-Benutzer"
      ask SMTP_PASS "SMTP-Passwort (Eingabe unsichtbar)" "" secret
      ask MAIL_FROM "Absender" "${DOMAIN%%:*} <${SMTP_USER}>"
    fi
  fi
  if [[ -n "$SMTP_HOST" ]]; then ok "SMTP: $SMTP_HOST:$SMTP_PORT"; else info "SMTP: nicht konfiguriert (E-Mail-Versand deaktiviert)"; fi
}

create_user() {
  if id "$APP_USER" >/dev/null 2>&1; then
    ok "Benutzer '$APP_USER' vorhanden"
  else
    useradd --system --home-dir "$INSTALL_DIR" --shell /usr/sbin/nologin "$APP_USER"
    ok "Systembenutzer '$APP_USER' angelegt"
  fi
}

fetch_code() {
  step "Code laden ($REPO, Branch $BRANCH)"
  if [[ -d "$INSTALL_DIR/.git" ]]; then
    local g=(sudo -u "$APP_USER" git -C "$INSTALL_DIR" -c user.name=install.sh -c user.email=install@localhost)
    local stashed=0
    # Eigene Anpassungen (z. B. Impressum) sichern und nach dem Update wieder anwenden
    if [[ -n "$("${g[@]}" status --porcelain --untracked-files=no)" ]]; then
      local patch="$INSTALL_DIR/data/local-changes-$(date +%Y%m%d-%H%M%S).patch"
      "${g[@]}" diff >"$patch"
      "${g[@]}" stash push -q -m "install.sh update"
      stashed=1
      ok "Lokale Änderungen gesichert ($patch)"
    fi
    "${g[@]}" fetch --depth 1 origin "$BRANCH" -q
    "${g[@]}" reset --hard FETCH_HEAD -q
    ok "Aktualisiert auf $("${g[@]}" rev-parse --short HEAD)"
    if (( stashed )); then
      if "${g[@]}" stash pop -q; then
        ok "Lokale Änderungen wieder angewendet"
      else
        die "Lokale Änderungen kollidieren mit dem Update. Bitte manuell zusammenführen: cd $INSTALL_DIR && git status (Sicherung: $patch)"
      fi
    fi
  else
    [[ -e "$INSTALL_DIR" && -n "$(ls -A "$INSTALL_DIR" 2>/dev/null)" ]] && die "$INSTALL_DIR existiert und ist nicht leer."
    mkdir -p "$INSTALL_DIR"
    chown "$APP_USER:$APP_USER" "$INSTALL_DIR"
    sudo -u "$APP_USER" git clone --depth 1 --branch "$BRANCH" -q "$REPO" "$INSTALL_DIR"
    ok "Geklont: $(sudo -u "$APP_USER" git -C "$INSTALL_DIR" rev-parse --short HEAD)"
  fi
}

write_env() {
  step "Konfigurationsdatei (.env)"
  local env="$INSTALL_DIR/.env"
  mkdir -p "$INSTALL_DIR/data/secrets"
  if [[ -f "$env" ]]; then
    ok ".env existiert bereits — wird nicht überschrieben"
  else
    local scheme=https; [[ "$PROXY" == none && "$DOMAIN" == localhost* ]] && scheme=http
    umask 077
    {
      echo "# unser-geheimnis — erzeugt von install.sh am $(date -Iseconds)"
      echo "DATABASE_URL=\"file:$INSTALL_DIR/data/prod.db\""
      echo "NEXT_PUBLIC_SITE_URL=\"$scheme://$DOMAIN\""
      echo "UPLOAD_DIR=\"$INSTALL_DIR/data/secrets\""
      echo "MAX_FILE_SIZE_MB=16"
      echo "RATE_LIMIT_MAX=10"
      echo "# Schlüssel für HMACs (Codes, Proof-of-Work, E-Mail-Hashes). Geheim halten!"
      echo "APP_SECRET=$(openssl rand -hex 32)"
      echo
      echo "# E-Mail (optional, für „Daten anfordern“ per E-Mail)"
      if [[ -n "$SMTP_HOST" ]]; then
        echo "SMTP_HOST=\"$SMTP_HOST\""
        echo "SMTP_PORT=$SMTP_PORT"
        echo "SMTP_USER=\"$SMTP_USER\""
        echo "SMTP_PASS=\"${SMTP_PASS//\"/\\\"}\""
        echo "MAIL_FROM=\"${MAIL_FROM:-$DOMAIN <$SMTP_USER>}\""
      else
        echo "#SMTP_HOST=smtp.example.de"
        echo "#SMTP_PORT=587"
        echo "#SMTP_USER=noreply@example.de"
        echo "#SMTP_PASS=\"…\""
        echo "#MAIL_FROM=\"Secrets <noreply@example.de>\""
      fi
    } >"$env"
    umask 022
    ok ".env angelegt (APP_SECRET zufällig erzeugt)"
  fi
  chown -R "$APP_USER:$APP_USER" "$INSTALL_DIR/data" "$env"
  chmod 600 "$env"
  chmod 700 "$INSTALL_DIR/data"
}

backup_db() {
  local db="$INSTALL_DIR/data/prod.db"
  [[ -f "$db" ]] || return 0
  local dst="$INSTALL_DIR/data/backup-$(date +%Y%m%d-%H%M%S).db"
  cp -a "$db" "$dst"
  # nur die letzten 5 Sicherungen behalten
  ls -1t "$INSTALL_DIR"/data/backup-*.db 2>/dev/null | tail -n +6 | xargs -r rm -f
  ok "Datenbank gesichert: $dst"
}

build_app() {
  step "Abhängigkeiten installieren und bauen (dauert einige Minuten)"
  as_app "npm ci --no-audit --no-fund --loglevel=error" >/dev/null
  ok "npm-Pakete installiert"
  as_app "npx prisma generate" >/dev/null
  as_app "npx prisma db push --skip-generate" >/dev/null
  ok "Datenbank-Schema aktuell"
  as_app "NODE_ENV=production npx next build" >/tmp/ug-build.log 2>&1 || { tail -30 /tmp/ug-build.log; die "Build fehlgeschlagen (Log: /tmp/ug-build.log)"; }
  ok "Produktions-Build erstellt"
}

write_service() {
  step "systemd-Dienst"
  cat >"/etc/systemd/system/$SERVICE.service" <<EOF
[Unit]
Description=unser-geheimnis (Self-Hosted)
After=network.target

[Service]
Type=simple
User=$APP_USER
Group=$APP_USER
WorkingDirectory=$INSTALL_DIR
EnvironmentFile=$INSTALL_DIR/.env
Environment=NODE_ENV=production
Environment=PORT=$PORT
Environment=HOSTNAME=127.0.0.1
ExecStart=$(command -v node) node_modules/next/dist/bin/next start -H 127.0.0.1 -p $PORT
Restart=always
RestartSec=5

# Härtung
NoNewPrivileges=true
PrivateTmp=true
PrivateDevices=true
ProtectSystem=strict
ProtectHome=true
ProtectKernelTunables=true
ProtectKernelModules=true
ProtectControlGroups=true
RestrictSUIDSGID=true
LockPersonality=true
ReadWritePaths=$INSTALL_DIR/data $INSTALL_DIR/.next/cache

[Install]
WantedBy=multi-user.target
EOF
  mkdir -p "$INSTALL_DIR/.next/cache"; chown -R "$APP_USER:$APP_USER" "$INSTALL_DIR/.next"
  systemctl daemon-reload
  systemctl enable --now "$SERVICE" >/dev/null 2>&1
  systemctl restart "$SERVICE"
  ok "Dienst '$SERVICE' aktiv (Port $PORT, nur localhost)"
}

setup_caddy() {
  [[ "$PROXY" == caddy ]] || return 0
  step "Caddy (Reverse-Proxy + HTTPS)"
  if ! command -v caddy >/dev/null; then
    curl -fsSL 'https://dl.cloudsmith.io/public/caddy/stable/gpg.key' | gpg --dearmor --yes -o /usr/share/keyrings/caddy-stable-archive-keyring.gpg
    curl -fsSL 'https://dl.cloudsmith.io/public/caddy/stable/debian.deb.txt' >/etc/apt/sources.list.d/caddy-stable.list
    apt-get update -qq && apt-get install -y -qq caddy >/dev/null
    ok "Caddy installiert"
  fi
  local cf=/etc/caddy/Caddyfile
  if grep -qs "^$DOMAIN {" "$cf"; then
    ok "Caddyfile enthält $DOMAIN bereits"
  else
    [[ -f "$cf" ]] && cp -a "$cf" "$cf.bak-$(date +%Y%m%d-%H%M%S)"
    # Standard-Caddyfile (Platzhalterseite auf :80) ersetzen, sonst anhängen
    if grep -qs "^:80" "$cf"; then : >"$cf"; fi
    cat >>"$cf" <<EOF

$DOMAIN {
	encode zstd gzip
	# Caddy übernimmt kein X-Forwarded-For vom Client, sondern setzt die echte IP
	reverse_proxy 127.0.0.1:$PORT
	request_body {
		max_size 30MB
	}
	log {
		output discard
	}
}
EOF
    ok "Caddyfile ergänzt (Backup angelegt)"
  fi
  caddy validate --config "$cf" --adapter caddyfile >/dev/null 2>&1 || die "Caddyfile ungültig: caddy validate --config $cf"
  systemctl enable --now caddy >/dev/null 2>&1
  systemctl reload caddy
  ok "Caddy aktiv — HTTPS-Zertifikat wird automatisch geholt (DNS muss auf diesen Server zeigen)"
}

health_check() {
  step "Funktionsprüfung"
  for _ in $(seq 1 30); do
    if curl -fsS "http://127.0.0.1:$PORT/api/health" >/dev/null 2>&1; then
      ok "App antwortet auf http://127.0.0.1:$PORT"
      return 0
    fi
    sleep 1
  done
  die "App antwortet nicht. Log: journalctl -u $SERVICE -n 50"
}

summary() {
  local url; url=$(grep -E '^NEXT_PUBLIC_SITE_URL=' "$INSTALL_DIR/.env" | cut -d= -f2- | tr -d '"')
  echo
  echo "${G}${B}Fertig!${N} unser-geheimnis läuft."
  echo
  echo "  Adresse:       ${B}$url${N}"
  echo "  Verzeichnis:   $INSTALL_DIR  (Daten: $INSTALL_DIR/data)"
  echo "  Konfiguration: $INSTALL_DIR/.env"
  echo "  Logs:          journalctl -u $SERVICE -f"
  echo "  Update:        sudo bash install.sh update"
  echo
  echo "${Y}Wichtig:${N}"
  if [[ "$PROXY" == none ]]; then
    echo "  • Reverse-Proxy mit HTTPS einrichten (Ziel: 127.0.0.1:$PORT), siehe Anleitung."
    echo "    X-Forwarded-For muss der Proxy SETZEN, nicht anhängen (Rate-Limits)."
  fi
  echo "  • Impressum und Datenschutzerklärung an deinen Betrieb anpassen:"
  echo "    $INSTALL_DIR/src/app/impressum/page.tsx, …/datenschutz/page.tsx (danach: install.sh update)"
  echo "  • Firewall: nur 22, 80, 443 öffnen. Port $PORT nicht freigeben."
  echo
}

# ── Ablauf ────────────────────────────────────────────────────────────
case "$MODE" in
  install)
    echo "${B}unser-geheimnis — Self-Hosted Installation${N}"
    preflight
    collect_config
    install_packages
    step "Benutzer"; create_user
    fetch_code
    write_env
    build_app
    write_service
    setup_caddy
    health_check
    summary
    ;;
  update)
    echo "${B}unser-geheimnis — Update${N}"
    [[ $EUID -eq 0 ]] || die "Bitte als root ausführen."
    [[ -f "$INSTALL_DIR/.env" ]] || die "Keine Installation in $INSTALL_DIR gefunden (Option --dir)."
    step "Sicherung"; backup_db
    fetch_code
    build_app
    step "Neustart"; systemctl restart "$SERVICE"; ok "Dienst neu gestartet"
    health_check
    echo; echo "${G}${B}Update abgeschlossen.${N}"
    ;;
esac
