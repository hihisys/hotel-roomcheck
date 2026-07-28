FROM php:8.4-apache

RUN docker-php-ext-install pdo pdo_mysql
RUN a2enmod rewrite

WORKDIR /var/www/html

# public 폴더만 복사
COPY public/ /var/www/html/
COPY src/ /var/www/src/

RUN mkdir -p /var/www/html/data && \
    chown -R www-data:www-data /var/www/html && \
    chown -R www-data:www-data /var/www/src && \
    chmod -R 755 /var/www/html && \
    chmod -R 644 /var/www/html/* && \
    find /var/www/html -type d -exec chmod 755 {} \; && \
    chmod -R 755 /var/www/src && \
    chmod -R 775 /var/www/html/data

EXPOSE 8080
RUN sed -i 's/Listen 80/Listen 8080/' /etc/apache2/ports.conf && \
    sed -i 's/:80/:8080/' /etc/apache2/sites-enabled/000-default.conf

CMD ["apache2-foreground"]
