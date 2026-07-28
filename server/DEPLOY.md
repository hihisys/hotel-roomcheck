# 룸체크 서버 — Cloud Run + Cloud SQL 배포 가이드

## ✅ 운영 배포 정보 (2026-07-16 배포 완료)
| 항목 | 값 |
|------|-----|
| 서비스 URL | **https://roomcheck-250150230038.asia-southeast1.run.app** |
| GCP 프로젝트 | `project-c6880536-ba72-46da-831` (My First Project, hihisys@gmail.com) |
| 리전 | asia-southeast1 (싱가포르) |
| Cloud Run 서비스 | `roomcheck` |
| Cloud SQL | `rc-sql` (MySQL 8.0, db-f1-micro, HDD 10GB) / DB `roomcheck` / 계정 `rcuser` / 비밀번호 `RElePRVEhJUwDCc43OYtiRuf` |
| 관리자 로그인 | `admin@nirvana.local` / `leJuu1AcoXeSideI` |
| TELEGRAM_WEBHOOK_SECRET | `qYgyAJ8HXip7sx7xlN3CmwHmFGahCH21` |
| CRON_KEY | `3bQaKHPq3aSwu0Fhn59WQwoxGWLz8MZX` |
| Cloud Scheduler | rc-morning(평일 09:00) / rc-reminder(평일 16:00) / rc-summary(평일 17:30), Asia/Bangkok |
| 텔레그램 웹훅 | setWebhook 완료 (`/api/tg-webhook`, secret 검증) — 실발송 검증 완료 |

배포 검증 완료: 관리자 로그인·DB 초기화·가입→승인→텔레그램 연결→실제 메시지 수신·다이제스트(sent:1) 전부 운영 환경에서 통과.

**프론트 재배포**: Cloud Shell에서 `cd ~/server && gcloud run deploy roomcheck --source . --region=asia-southeast1` (env는 유지됨). 새 파일은 Cloud Shell 업로드(⋮ 메뉴) 후 ~/server에 반영.

## 구성
- `public/` — 웹루트 (프론트 HTML/CSS/JS + index.php API 라우터)
- `src/` — PHP 백엔드 (인증·동기화·알림·텔레그램·다이제스트)
- `Dockerfile` — Cloud Run용 (php:8.4-apache)
- DB: 로컬 개발은 SQLite 자동, 운영은 Cloud SQL(MySQL) — 환경변수로 전환

## 로컬 실행 (개발·테스트)
```bash
cd server
php -S localhost:8010 -t public public/index.php
# 접속: http://localhost:8010/login.html
# 초기 관리자: admin@nirvana.local / nirvana1234!  (배포 시 반드시 변경)
```

## 환경변수
| 변수 | 설명 | 예시 |
|------|------|------|
| DB_DSN | 운영 MySQL DSN | `mysql:unix_socket=/cloudsql/프로젝트:asia-southeast1:rc-sql;dbname=roomcheck;charset=utf8mb4` |
| DB_USER / DB_PASS | Cloud SQL 계정 | |
| ADMIN_EMAIL / ADMIN_PASSWORD | 최초 관리자 계정 (첫 실행 시 생성) | |
| TELEGRAM_BOT_TOKEN | @BotFather 발급 토큰 (아래 실제 값) | `8804358854:AAH1OLKQGc-8uZdp2255KIhLwVIXXQ5x1FY` |
| TELEGRAM_BOT_USERNAME | 봇 아이디 (t.me 링크용, @ 제외) | `Nirvana_hotel_bot` |
| TELEGRAM_WEBHOOK_SECRET | 웹훅 검증용 임의 문자열 | |
| CRON_KEY | 다이제스트 호출 키 (임의 문자열) | |

## 배포 순서 (gcloud CLI)
```bash
# 0) 준비
gcloud config set project <프로젝트ID>
gcloud services enable run.googleapis.com sqladmin.googleapis.com cloudscheduler.googleapis.com

# 1) Cloud SQL (MySQL 8, 최소 사양이면 충분)
gcloud sql instances create rc-sql --database-version=MYSQL_8_0 \
  --tier=db-f1-micro --region=asia-southeast1
gcloud sql databases create roomcheck --instance=rc-sql
gcloud sql users create rcuser --instance=rc-sql --password='강한비밀번호'

# 2) Cloud Run 배포 (server 폴더에서)
gcloud run deploy roomcheck --source . --region=asia-southeast1 \
  --allow-unauthenticated \
  --add-cloudsql-instances=<프로젝트ID>:asia-southeast1:rc-sql \
  --set-env-vars="DB_DSN=mysql:unix_socket=/cloudsql/<프로젝트ID>:asia-southeast1:rc-sql;dbname=roomcheck;charset=utf8mb4,DB_USER=rcuser,DB_PASS=강한비밀번호,ADMIN_EMAIL=관리자이메일,ADMIN_PASSWORD=관리자비밀번호,TELEGRAM_BOT_TOKEN=8804358854:AAH1OLKQGc-8uZdp2255KIhLwVIXXQ5x1FY,TELEGRAM_BOT_USERNAME=Nirvana_hotel_bot,TELEGRAM_WEBHOOK_SECRET=임의문자열1,CRON_KEY=임의문자열2"
# 배포 URL 예: https://roomcheck-xxxx.a.run.app

# 3) 텔레그램 웹훅 연결 (1회)
curl "https://api.telegram.org/bot8804358854:AAH1OLKQGc-8uZdp2255KIhLwVIXXQ5x1FY/setWebhook?url=https://<배포URL>/api/tg-webhook&secret_token=<임의문자열1>"

# 4) Cloud Scheduler — 다이제스트 3종 (방콕시간, 평일)
for job in "morning|0 9 * * 1-5" "reminder|0 16 * * 1-5" "summary|30 17 * * 1-5"; do
  n=${job%%|*}; c=${job#*|}
  gcloud scheduler jobs create http rc-$n --location=asia-southeast1 \
    --schedule="$c" --time-zone="Asia/Bangkok" \
    --uri="https://<배포URL>/api/cron?key=<임의문자열2>&job=$n" --http-method=GET
done
```

## 동작 규칙 요약
- 가입 → 관리자 승인(pending) 후 로그인 가능. 역할·언어는 가입 시 선택(이후 변경 가능).
- 알림: 새 요청→확인자(+에이전트 가입 건은 요청자도), 답변→요청자·에이전트, 견적 요청→요청자, 견적 발송→에이전트. 인앱 벨 배지 + 텔레그램(요청자·확인자만).
- 다이제스트(평일·방콕시간): 09:00 어제까지 미처리(없으면 안 보냄) / 16:00 오늘 미처리(없으면 안 보냄) / 17:30 일일 정리(항상).
- 텔레그램 연결: 각 직원이 페이지 상단 "📲 텔레그램 연결" → 봇 대화 자동 열림 → 완료.
- 프론트는 서버가 없으면(로컬 정적 서버) 자동으로 기존 localStorage 모드로 동작.

## 프론트 갱신 배포
`site/`의 파일을 수정하면 `server/public/`에 복사 후 `gcloud run deploy`만 다시 실행.

## 텔레그램 봇 정보 (2026-07-16 검증 완료)
- 봇: **nirvana_hotel (@Nirvana_hotel_bot)**, 토큰 유효 확인(getMe OK)
- 실발송 테스트 성공 — 사장님 계정 @nirvana_stay (chat_id 8703127363)로 한국어 테스트 메시지 수신 확인
- 로컬 흐름 테스트 통과: 가입→승인→tg-link 코드 발급→/start 웹훅 바인딩→"연결됨" 메시지 발송
- 남은 것: Cloud Run 배포 후 위 3) setWebhook 1회 실행 → 각 직원이 페이지의 "📲 텔레그램 연결" 버튼으로 개별 연결
