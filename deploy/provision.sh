#!/usr/bin/env bash
#
# Provisionamento de um servidor limpo (Ubuntu 24.04 ARM na Oracle Cloud)
# para rodar o ConectaEBD: nginx + PHP 8.3-FPM + MySQL 8 + Node 22.
#
# Rode UMA VEZ, como root, na VM recem-criada:
#
#   sudo DOMAIN=conectaebd.com.br bash provision.sh
#
# Sem DOMAIN o site sobe em HTTP pelo IP publico e o SSL fica para depois
# (rode o certbot manualmente quando o DNS estiver apontado).
#
set -euo pipefail

APP_DIR="${APP_DIR:-/var/www/conectaebd}"
REPO_URL="${REPO_URL:-https://github.com/arbcaio/CONECTAEBD.git}"
BRANCH="${BRANCH:-main}"
DEPLOY_USER="${DEPLOY_USER:-ubuntu}"
DOMAIN="${DOMAIN:-}"
CERTBOT_EMAIL="${CERTBOT_EMAIL:-}"
DB_NAME="${DB_NAME:-conectaebd}"
DB_USER="${DB_USER:-conectaebd}"
DB_PASS="${DB_PASS:-$(openssl rand -base64 24 | tr -d '/+=' | head -c 24)}"
PHP_V=8.3

if [[ $EUID -ne 0 ]]; then
    echo "Este script precisa de root. Use: sudo bash provision.sh" >&2
    exit 1
fi

if ! id "$DEPLOY_USER" &>/dev/null; then
    echo "Usuario '$DEPLOY_USER' nao existe. Ajuste DEPLOY_USER." >&2
    exit 1
fi

run_as() { sudo -u "$DEPLOY_USER" -H bash -c "cd '$APP_DIR' && $*"; }

echo "==> 1/10 Atualizando o sistema"
export DEBIAN_FRONTEND=noninteractive
apt-get update -y
apt-get upgrade -y

echo "==> 2/10 Instalando nginx, PHP ${PHP_V} e MySQL"
apt-get install -y \
    nginx mysql-server git unzip curl ca-certificates \
    php${PHP_V}-fpm php${PHP_V}-cli php${PHP_V}-mysql php${PHP_V}-mbstring \
    php${PHP_V}-xml php${PHP_V}-curl php${PHP_V}-zip php${PHP_V}-gd \
    php${PHP_V}-bcmath php${PHP_V}-intl \
    certbot python3-certbot-nginx

echo "==> 3/10 Instalando Node 22 (Vite 7 exige Node >= 20.19)"
if ! command -v node &>/dev/null || [[ "$(node -v | cut -d. -f1 | tr -d v)" -lt 20 ]]; then
    curl -fsSL https://deb.nodesource.com/setup_22.x | bash -
    apt-get install -y nodejs
fi

echo "==> 4/10 Instalando Composer"
if ! command -v composer &>/dev/null; then
    curl -fsSL https://getcomposer.org/installer -o /tmp/composer-setup.php
    php /tmp/composer-setup.php --install-dir=/usr/local/bin --filename=composer
    rm -f /tmp/composer-setup.php
fi

echo "==> 5/10 Liberando as portas 80 e 443"
# A imagem Ubuntu da Oracle vem com um REJECT no final da chain INPUT.
# Abrir a Security List no console nao basta: sem isto o trafego morre aqui.
for port in 80 443; do
    if ! iptables -C INPUT -p tcp --dport "$port" -j ACCEPT 2>/dev/null; then
        iptables -I INPUT 1 -p tcp --dport "$port" -j ACCEPT
    fi
done
netfilter-persistent save

echo "==> 6/10 Criando o banco de dados"
mysql --protocol=socket <<SQL
CREATE DATABASE IF NOT EXISTS \`${DB_NAME}\`
    CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER IF NOT EXISTS '${DB_USER}'@'127.0.0.1' IDENTIFIED BY '${DB_PASS}';
ALTER USER '${DB_USER}'@'127.0.0.1' IDENTIFIED BY '${DB_PASS}';
GRANT ALL PRIVILEGES ON \`${DB_NAME}\`.* TO '${DB_USER}'@'127.0.0.1';
FLUSH PRIVILEGES;
SQL

echo "==> 7/10 Clonando o repositorio em ${APP_DIR}"
mkdir -p "$(dirname "$APP_DIR")"
if [[ ! -d "$APP_DIR/.git" ]]; then
    git clone --branch "$BRANCH" "$REPO_URL" "$APP_DIR"
fi
chown -R "$DEPLOY_USER":www-data "$APP_DIR"
git config --global --add safe.directory "$APP_DIR"

echo "==> 8/10 Gerando o .env"
if [[ ! -f "$APP_DIR/.env" ]]; then
    cp "$APP_DIR/.env.production.example" "$APP_DIR/.env"

    if [[ -n "$DOMAIN" ]]; then
        APP_URL="https://${DOMAIN}"
        SECURE_COOKIE=true
    else
        # Sem dominio ainda: HTTP pelo IP publico. Cookie seguro precisa
        # ficar desligado, senao a sessao nunca persiste e o login falha.
        APP_URL="http://$(curl -fsS --max-time 5 https://checkip.amazonaws.com || echo localhost)"
        SECURE_COOKIE=false
        echo "    (sem DOMAIN: subindo em ${APP_URL})"
    fi

    sed -i \
        -e "s|^APP_URL=.*|APP_URL=${APP_URL}|" \
        -e "s|^DB_DATABASE=.*|DB_DATABASE=${DB_NAME}|" \
        -e "s|^DB_USERNAME=.*|DB_USERNAME=${DB_USER}|" \
        -e "s|^DB_PASSWORD=.*|DB_PASSWORD=${DB_PASS}|" \
        -e "s|^SESSION_SECURE_COOKIE=.*|SESSION_SECURE_COOKIE=${SECURE_COOKIE}|" \
        -e "s|SEU_DOMINIO|${DOMAIN:-localhost}|g" \
        "$APP_DIR/.env"

    chown "$DEPLOY_USER":www-data "$APP_DIR/.env"
    chmod 640 "$APP_DIR/.env"
else
    echo "    .env ja existe, mantido como esta."
fi

echo "==> 9/10 Instalando a aplicacao"
run_as "composer install --no-dev --optimize-autoloader --no-interaction --prefer-dist"
run_as "npm ci --include=dev"
run_as "npm run build"
grep -q '^APP_KEY=base64' "$APP_DIR/.env" || run_as "php artisan key:generate --force"
run_as "php artisan migrate --force"
run_as "php artisan config:cache && php artisan route:cache && php artisan view:cache && php artisan event:cache"

chown -R "$DEPLOY_USER":www-data "$APP_DIR/storage" "$APP_DIR/bootstrap/cache" "$APP_DIR/public/build"
chmod -R ug+rw "$APP_DIR/storage" "$APP_DIR/bootstrap/cache"

echo "==> 10/10 Configurando o nginx"
sed -e "s|__DOMAIN__|${DOMAIN:-_}|g" -e "s|__APP_DIR__|${APP_DIR}|g" \
    "$APP_DIR/deploy/nginx.conf.template" > /etc/nginx/sites-available/conectaebd
ln -sf /etc/nginx/sites-available/conectaebd /etc/nginx/sites-enabled/conectaebd
rm -f /etc/nginx/sites-enabled/default
nginx -t
systemctl reload nginx
systemctl enable --now nginx "php${PHP_V}-fpm" mysql

if [[ -n "$DOMAIN" && -n "$CERTBOT_EMAIL" ]]; then
    echo "==> Emitindo certificado SSL para ${DOMAIN}"
    # So funciona se o DNS ja estiver apontando para este servidor.
    certbot --nginx -d "$DOMAIN" -d "www.${DOMAIN}" \
        --non-interactive --agree-tos -m "$CERTBOT_EMAIL" --redirect \
        || echo "    !! Certbot falhou. Confira o DNS e rode de novo depois."
fi

cat <<RESUMO

===========================================================
 Provisionamento concluido.

 App:    ${APP_DIR}
 Banco:  ${DB_NAME}
 Usuario:${DB_USER}
 Senha:  ${DB_PASS}
         ^ anote agora, ela tambem esta no .env do servidor.

 Proximos deploys:  ${APP_DIR}/deploy/deploy.sh
===========================================================
RESUMO
