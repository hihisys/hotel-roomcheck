FROM php:8.4-apache

# Cloud Run은 8080 포트 사용
RUN sed -i 's/80/8080/g' /etc/apache2/sites-available/000-default.conf /etc/apache2/ports.conf \
 && sed -i 's#/var/www/html#/var/www/html/public#g' /etc/apache2/sites-available/000-default.conf \
 && a2enmod rewrite \
 && docker-php-ext-install pdo_mysql

# 상위 디렉토리에서 server/public 복사
COPY ../server/public /var/www/html/public/
COPY ../server/src /var/www/html/src/
COPY ../server/data /var/www/html/data/

RUN mkdir -p /var/www/html/data \
 && chown -R www-data:www-data /var/www/html

EXPOSE 8080
