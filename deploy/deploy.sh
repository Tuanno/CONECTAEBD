#!/usr/bin/env bash
#
# Atualiza a aplicacao para a versao mais recente do branch main.
# Rode como o usuario ubuntu (nao root):  ~/CONECTAEBD/deploy/deploy.sh
#
set -euo pipefail

APP_DIR="${APP_DIR:-/var/www/conectaebd}"
BRANCH="${BRANCH:-main}"

cd "$APP_DIR"

echo "==> Entrando em modo manutencao"
php artisan down --render="errors::503" || true
# Garante que o site volte mesmo se algum passo abaixo falhar.
trap 'php artisan up || true' EXIT

echo "==> Baixando codigo (${BRANCH})"
git fetch --prune origin
git reset --hard "origin/${BRANCH}"

echo "==> Dependencias PHP"
composer install --no-dev --optimize-autoloader --no-interaction --prefer-dist

echo "==> Build dos assets"
npm ci --include=dev
npm run build

echo "==> Migrations"
php artisan migrate --force

echo "==> Recriando caches"
php artisan config:cache
php artisan route:cache
php artisan view:cache
php artisan event:cache

echo "==> Permissoes"
sudo chown -R ubuntu:www-data storage bootstrap/cache public/build
sudo chmod -R ug+rw storage bootstrap/cache

echo "==> Recarregando PHP-FPM"
sudo systemctl reload php8.3-fpm

php artisan up
trap - EXIT

echo
echo "Deploy concluido."
