FROM php:8.4-apache

# Install system dependencies for SQLite
RUN apt-get update && apt-get install -y \
    sqlite3 \
    libsqlite3-dev \
    && rm -rf /var/lib/apt/lists/*

# Install PHP extensions - SQLite support
RUN docker-php-ext-install pdo pdo_sqlite

# Remove default Apache ports configuration and set port 8080
RUN rm -f /etc/apache2/ports.conf && \
    echo "Listen 8080" > /etc/apache2/ports.conf

# Enable Apache mod_rewrite
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

# Configure Apache VirtualHost with public folder as DocumentRoot
RUN printf '%s\n' \
  '<VirtualHost *:8080>' \
  '    ServerName localhost' \
  '    DocumentRoot /var/www/html/public' \
  '    <Directory /var/www/html/public>' \
  '        Options Indexes FollowSymLinks' \
  '        AllowOverride All' \
  '        Require all granted' \
  '    </Directory>' \
  '    ErrorLog ${APACHE_LOG_DIR}/error.log' \
  '    CustomLog ${APACHE_LOG_DIR}/access.log combined' \
  '</VirtualHost>' > /etc/apache2/sites-available/000-default.conf && \
    a2dissite 000-default.conf 2>/dev/null || true && \
    a2ensite 000-default.conf

# Environment and expose
ENV PORT=8080
# 외부 API 연동 설정 — 에이전시 부계정 로그인 / 호텔 목록·상세 조회 (2026-07-30)
ENV AGENCY_API_BASE=https://nirvana835.mycafe24.com
ENV HOTEL_API_BASE=https://nirvana835.mycafe24.com

# 텔레그램 알림 + 관리자 계정 + 다이제스트 (2026-07-30, 값 출처: claude/server/DEPLOY.md)
ENV TELEGRAM_BOT_TOKEN=8804358854:AAH1OLKQGc-8uZdp2255KIhLwVIXXQ5x1FY
ENV TELEGRAM_BOT_USERNAME=Nirvana_hotel_bot
ENV TELEGRAM_WEBHOOK_SECRET=qYgyAJ8HXip7sx7xlN3CmwHmFGahCH21
ENV CRON_KEY=3bQaKHPq3aSwu0Fhn59WQwoxGWLz8MZX
ENV ADMIN_EMAIL=hihisys@gmail.com
ENV ADMIN_PASSWORD=123456
EXPOSE 8080

# Start Apache
CMD ["apache2-foreground"]
