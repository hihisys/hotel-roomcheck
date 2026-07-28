FROM php:8.4-apache

RUN docker-php-ext-install pdo pdo_mysql && \
    a2enmod rewrite

WORKDIR /var/www/html

COPY public/ /var/www/html/
COPY src/ /var/www/src/

RUN mkdir -p /var/www/html/data && \
    chown -R www-data:www-data /var/www/html /var/www/src && \
    chmod -R 755 /var/www/html && \
    chmod -R 644 /var/www/html/* && \
    find /var/www/html -type d -exec chmod 755 {} \; && \
    chmod -R 775 /var/www/html/data && \
    chmod -R 755 /var/www/src

# VirtualHost 설정 - Directory 권한 명시
RUN cat > /etc/apache2/sites-available/000-default.conf << 'APACHE'
<VirtualHost *:8080>
    ServerName localhost
    DocumentRoot /var/www/html
    <Directory /var/www/html>
        Options Indexes FollowSymLinks
        AllowOverride All
        Require all granted
    </Directory>
    ErrorLog ${APACHE_LOG_DIR}/error.log
    CustomLog ${APACHE_LOG_DIR}/access.log combined
</VirtualHost>
APACHE

EXPOSE 8080
RUN sed -i 's/Listen 80/Listen 8080/' /etc/apache2/ports.conf

CMD ["apache2-foreground"]
