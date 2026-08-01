FROM php:8.4-apache

# Install system dependencies for SQLite
RUN apt-get update && apt-get install -y \
    sqlite3 \
    libsqlite3-dev \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Install PHP extensions — SQLite(로컬 개발) + MySQL(운영 Cloud SQL)
# ⚠️ pdo_mysql 없으면 Cloud SQL 연결 시 "could not find driver" 오류 (2026-08-01)
RUN docker-php-ext-install pdo pdo_sqlite pdo_mysql

# Remove default Apache ports configuration and set port 8080
RUN rm -f /etc/apache2/ports.conf && \
    echo "Listen 8080" > /etc/apache2/ports.conf

# Enable Apache mod_rewrite + headers (JS/CSS 캐시 재검증용, 2026-08-01)
RUN a2enmod rewrite headers

# Set working directory
WORKDIR /var/www/html

# Copy all project files
COPY . /var/www/html/

# html2canvas 라이브러리를 빌드 시 내장 (2026-07-31) — 브라우저의 외부 CDN 의존 제거 (이미지 저장 실패 수정)
RUN mkdir -p /var/www/html/public/vendor && \
    curl -fsSL https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js \
      -o /var/www/html/public/vendor/html2canvas.min.js

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
  '    <FilesMatch "\.(js|css|html)$">' \
  '        Header set Cache-Control "no-cache, must-revalidate"' \
  '    </FilesMatch>' \
  '    ErrorLog ${APACHE_LOG_DIR}/error.log' \
  '    CustomLog ${APACHE_LOG_DIR}/access.log combined' \
  '</VirtualHost>' > /etc/apache2/sites-available/000-default.conf && \
    a2dissite 000-default.conf 2>/dev/null || true && \
    a2ensite 000-default.conf

# Environment and expose
ENV PORT=8080
# 외부 API 연동 설정 — 에이전시 부계정 로그인 / 호텔 목록·상세 조회 (2026-07-30)
ENV AGENCY_API_BASE=https://nirvana835.mycafe24.com
# 부계정 목록 API 경로 (2026-08-01): 미지정 시 후보 경로를 자동 탐색한다.
#   너바나 측 경로가 아래 후보와 다르면 이 값만 바꿔서 재배포하면 된다.
#   후보: /api2/agency-sub-accounts, /api2/agency-sub-accounts/list, /api2/sub-accounts, /api2/agency-subaccounts
ENV AGENCY_SUBS_PATH=
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
