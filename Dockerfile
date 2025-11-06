# Imagem base com PHP 8.3 + extensões necessárias
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
    curl

# Instalar extensões PHP comuns
RUN docker-php-ext-install pdo_mysql mbstring exif pcntl bcmath gd

# Instalar o Composer
COPY --from=composer:2.7 /usr/bin/composer /usr/bin/composer

# Definir diretório de trabalho
WORKDIR /var/www

# Copiar os arquivos do Laravel
COPY . .

# Instalar dependências do Laravel
RUN composer install

# Dar permissão de escrita nas pastas de storage e cache
RUN chown -R www-data:www-data /var/www/storage /var/www/bootstrap/cache

# Porta do servidor
EXPOSE 9000

CMD ["php-fpm"]
