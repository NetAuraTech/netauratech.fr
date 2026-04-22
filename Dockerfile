FROM dunglas/frankenphp:php8.4-alpine AS builder

RUN apk add --no-cache \
    libpq-dev libpng-dev libzip-dev zip unzip git icu-dev \
    imagemagick-dev libtool make gcc g++ autoconf \
    freetype-dev libjpeg-turbo-dev libwebp-dev nodejs npm

RUN docker-php-ext-configure gd --with-freetype --with-jpeg --with-webp \
    && docker-php-ext-install pdo_pgsql pgsql bcmath gd zip intl opcache \
    && pecl install imagick redis \
    && docker-php-ext-enable imagick redis

COPY --from=composer:latest /usr/bin/composer /usr/bin/composer
WORKDIR /app
COPY . .

RUN DB_CONNECTION=sqlite DB_DATABASE=:memory: composer install \
    --no-interaction --optimize-autoloader
RUN composer require laravel/octane

RUN cp .env.example .env || touch .env \
    && DB_CONNECTION=sqlite DB_DATABASE=:memory: php artisan octane:install --server=frankenphp \
    && npm install \
    && DB_CONNECTION=sqlite DB_DATABASE=:memory: npm run build

FROM dunglas/frankenphp:latest-php8.4-alpine
RUN apk add --no-cache \
    libpq libpng libzip icu-libs \
    imagemagick freetype libjpeg-turbo libwebp

COPY --from=builder /usr/local/lib/php/extensions /usr/local/lib/php/extensions
COPY --from=builder /usr/local/etc/php/conf.d /usr/local/etc/php/conf.d
WORKDIR /var/www
COPY --from=builder --chown=www-data:www-data /app /var/www

RUN chown -R www-data:www-data /var/www/storage /var/www/bootstrap/cache \
    && chmod -R 775 /var/www/storage /var/www/bootstrap/cache

USER www-data
EXPOSE 8000

CMD ["php", "artisan", "octane:frankenphp", "--host=0.0.0.0", "--port=8000", "--workers=4"]
