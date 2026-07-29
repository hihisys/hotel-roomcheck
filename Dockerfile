FROM php:8.4-apache

# Install system dependencies for SQLite
RUN apt-get update && apt-get install -y \
    sqlite3 \
    libsqlite3-dev \
    && rm -rf /var/lib/apt/lists/*

# Install PHP extensions - SQLite support
RUN docker-php-ext-install pdo pdo_sqlite

# Enable Apache mod_rewrite for URL rewriting
RUN a2enmod rewrite

# Set working directory
WORKDIR /var/www/html

# Copy all project files
COPY . /var/www/html/

# Create data directory and set proper permissions
RUN mkdir -p /var/www/html/data && \
    chown -R www-data:www-data /var/www/html && \
    chmod -R 755 /var/www/html && \
    chmod -R 777 /var/www/html/data

# Configure Apache using printf for proper newline handling
RUN printf '%s\n' \
  '<VirtualHost *:8080>' \
  '    ServerName localhost' \
  '    DocumentRoot /var/www/html' \
  '    <Directory /var/www/html>' \
  '        Options Indexes FollowSymLinks' \
  '        AllowOverride All' \
  '        Require all granted' \
  '    </Directory>' \
  '    ErrorLog ${APACHE_LOG_DIR}/error.log' \
  '    CustomLog ${APACHE_LOG_DIR}/access.log combined' \
  '</VirtualHost>' > /etc/apache2/sites-available/000-default.conf && \
    a2dissite 000-default.conf 2>/dev/null || true && \
    a2ensite 000-default.conf

# Set environment variables
ENV PORT=8080
EXPOSE 8080

# Start Apache
CMD ["apache2-foreground"]
