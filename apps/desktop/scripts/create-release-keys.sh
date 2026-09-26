#!/usr/bin/env bash
# Creates the two signing keys a desktop release needs and stores them as GitHub Actions secrets.
# Run it once, from the repository root, on your own Mac:
#
#   bash apps/desktop/scripts/create-release-keys.sh
#
# 1. Updater key (minisign): the app only installs updates signed with it.
# 2. "Layout Fixer" code-signing certificate (self-signed): macOS keeps the Accessibility permission
#    across updates because every release carries the same signature.
#
# The private files stay in ~/.tauri/layout-fixer/ (readable only by you). Back that folder and both
# passwords up in your password manager: losing them means users reinstall and re-grant Accessibility once.
set -euo pipefail

REPO="BugsBountyHunter/layout-fixer"
KEYS_DIR="$HOME/.tauri/layout-fixer"
PUBLIC_KEY_OUT="apps/desktop/src-tauri/updater.pub"
CERT_NAME="Layout Fixer"

fail() { printf '\n✗ %s\n' "$1" >&2; exit 1; }
step() { printf '\n▸ %s\n' "$1"; }

[ -f apps/desktop/package.json ] || fail "Run this from the repository root."
command -v gh >/dev/null || fail "Install the GitHub CLI first: brew install gh"
command -v openssl >/dev/null || fail "openssl is missing."
gh auth status >/dev/null 2>&1 || fail "Sign in to GitHub first: gh auth login"
[ -e "$KEYS_DIR/updater.key" ] && fail "$KEYS_DIR already has keys. Delete that folder only if you really want new keys."

read_password() {
  local prompt="$1" first second
  while true; do
    read -r -s -p "$prompt: " first; echo
    read -r -s -p "Repeat it: " second; echo
    [ "${#first}" -ge 12 ] || { echo "Use at least 12 characters."; continue; }
    [ "$first" = "$second" ] && { REPLY="$first"; return; }
    echo "The passwords don't match, try again."
  done
}

mkdir -p "$KEYS_DIR" && chmod 700 "$KEYS_DIR"

step "1/4 Updater key"
read_password "Choose a password for the updater key"
UPDATER_PASSWORD="$REPLY"
npx --yes --prefix apps/desktop tauri signer generate --ci -w "$KEYS_DIR/updater.key" -p "$UPDATER_PASSWORD" >/dev/null
chmod 600 "$KEYS_DIR/updater.key"

step "2/4 Code-signing certificate \"$CERT_NAME\" (valid 10 years)"
read_password "Choose a password for the certificate file"
CERT_PASSWORD="$REPLY"
# macOS can only import PKCS#12 files in the legacy format; OpenSSL 3 needs -legacy for that.
LEGACY=""
openssl version | grep -q '^OpenSSL 3' && LEGACY="-legacy"
WORK="$(mktemp -d)"
trap 'rm -rf "$WORK"' EXIT
cat > "$WORK/cert.cnf" <<EOF
[req]
distinguished_name = dn
x509_extensions = ext
prompt = no
[dn]
CN = $CERT_NAME
O = Layout Fixer
[ext]
basicConstraints = critical,CA:false
keyUsage = critical,digitalSignature
extendedKeyUsage = critical,codeSigning
subjectKeyIdentifier = hash
EOF
openssl req -x509 -newkey rsa:3072 -nodes -days 3650 -config "$WORK/cert.cnf" \
  -keyout "$WORK/key.pem" -out "$KEYS_DIR/certificate.pem" 2>/dev/null
openssl pkcs12 -export $LEGACY -name "$CERT_NAME" -inkey "$WORK/key.pem" -in "$KEYS_DIR/certificate.pem" \
  -out "$KEYS_DIR/certificate.p12" -passout "pass:$CERT_PASSWORD"
chmod 600 "$KEYS_DIR/certificate.p12"

step "3/4 Uploading GitHub Actions secrets to $REPO (values are never printed)"
gh secret set TAURI_SIGNING_PRIVATE_KEY --repo "$REPO" < "$KEYS_DIR/updater.key"
printf '%s' "$UPDATER_PASSWORD" | gh secret set TAURI_SIGNING_PRIVATE_KEY_PASSWORD --repo "$REPO"
base64 < "$KEYS_DIR/certificate.p12" | tr -d '\n' | gh secret set MACOS_CERTIFICATE --repo "$REPO"
printf '%s' "$CERT_PASSWORD" | gh secret set MACOS_CERTIFICATE_PASSWORD --repo "$REPO"
unset UPDATER_PASSWORD CERT_PASSWORD

step "4/4 Public updater key → $PUBLIC_KEY_OUT (safe to commit)"
cp "$KEYS_DIR/updater.key.pub" "$PUBLIC_KEY_OUT"

printf '\n✓ Done. Secrets on GitHub:\n'
gh secret list --repo "$REPO"
printf '\nNext:\n'
printf '  • Save %s and both passwords in your password manager.\n' "$KEYS_DIR"
printf '  • Tell Claude it is done, so the public key gets committed.\n'
