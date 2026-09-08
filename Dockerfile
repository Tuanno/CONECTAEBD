# ==========================================
# ETAPA 1 - Build do React/Vite
# ==========================================
FROM node:20 AS frontend

WORKDIR /var/www

# Copia os arquivos do npm
COPY package*.json ./

# Instala as dependências
RUN npm install

# Copia o projeto
COPY . .

# Gera os arquivos do Vite
RUN npm run build


# ==========================================
# ETAPA 2 - Laravel/PHP
# ==========================================
FROM php:8.3-fpm

# Instalar dependências do sistema
RUN apt-get update && apt-get install -y \
    git \
    unzip \
    libpng-dev \
    libjpeg-dev \
    libfreetype6-dev \
    libonig-dev \
    libxml2-dev \
    zip \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Instalar extensões PHP
RUN docker-php-ext-configure gd \
    --with-freetype \
    --with-jpeg \
    && docker-php-ext-install \
    pdo_mysql \
    mbstring \
    exif \
    pcntl \
    bcmath \
    gd

# Instalar Composer
COPY --from=composer:2.7 /usr/bin/composer /usr/bin/composer

# Diretório do Laravel
WORKDIR /var/www

# Copiar o projeto Laravel
COPY . .

# Instalar dependências PHP
RUN composer install \
    --no-dev \
    --optimize-autoloader \
    --no-interaction

# Copiar os arquivos compilados do React/Vite
COPY --from=frontend /var/www/public/build ./public/build

# Permissões
RUN chown -R www-data:www-data \
    /var/www/storage \
    /var/www/bootstrap/cache

# Railway usa a variável PORT
EXPOSE 8080

# Iniciar Laravel
CMD php artisan serve --host=0.0.0.0 --port=${PORT:-8080}