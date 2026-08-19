# Laravel 11 마이그레이션 워크플로우 계획

**프로젝트**: Hotel Roomcheck Laravel 11 Upgrade  
**작성일**: 2026년 8월 7일  
**현재 환경**: PHP 8.4 + Apache (Production) → Laravel 11 + MySQL (Development)  
**상태**: 📋 계획 수립 단계

---

## 1. 전략적 개요

### 1.1 핵심 원칙 (Core Principles)

```
┌────────────────────────────────────────────────────────┐
│                     현재 상태 (NOW)                     │
├────────────────────────────────────────────────────────┤
│ ✅ PHP 8.4 + Apache (Production)                       │
│ ✅ Asia-southeast1 (싱가포르) 운영 중                  │
│ ✅ GitHub Actions 자동 배포                           │
│ ✅ 에이전트 부계정, 다국어, 로그인 기능 완성           │
└────────────────────────────────────────────────────────┘
                         │
                    (계획 실행)
                         │
                         ↓
┌────────────────────────────────────────────────────────┐
│                   목표 상태 (FUTURE)                    │
├────────────────────────────────────────────────────────┤
│ 🚀 Laravel 11 + MySQL (Production)                    │
│ 🚀 Asia-southeast1 (싱가포르) 배포                    │
│ 🚀 GitHub Actions 자동 배포 (동일)                   │
│ 🚀 기존 기능 + 신 기능 완벽 호환                      │
└────────────────────────────────────────────────────────┘

         ⚠️ 중요: 기존 PHP 버전은 계속 운영!
```

### 1.2 작업 분리 원칙 (Separation Strategy)

```
┌─────────────────────────────────────────────────────────┐
│           호텔 룸첵 프로젝트 폴더 구조                   │
├─────────────────────────────────────────────────────────┤
│ 호텔 룸첵/                                              │
│ ├── server/ .................. ✅ PHP 프로덕션 (배포)  │
│ │   ├── public/                  신버전 프론트엔드     │
│ │   ├── src/                     신버전 백엔드 (PHP)  │
│ │   └── data/                    데이터 폴더           │
│ │                                                      │
│ ├── server-laravel/ .......... 🚀 Laravel 개발 (LOCAL) │
│ │   ├── public/                  신버전 프론트엔드     │
│ │   ├── app/                     Laravel 앱 로직      │
│ │   ├── routes/                  API 라우팅           │
│ │   ├── resources/               뷰 템플릿            │
│ │   ├── config/                  설정 파일            │
│ │   ├── database/                마이그레이션         │
│ │   ├── .env.local               개발용 환경 설정     │
│ │   └── laravel.log              개발 로그            │
│ │                                                      │
│ ├── error-fixes/ ............. 📝 에러 수정 (별도 관리)│
│ │   ├── 2026-08-07/              PHP 에러 수정         │
│ │   ├── 2026-08-08/              추가 에러 수정        │
│ │   └── FIXES_INDEX.md           에러 수정 인덱스     │
│ │                                                      │
│ ├── live/ ..................... 📦 GitHub 저장소      │
│ │   └── .github/workflows/       GitHub Actions       │
│ │                                                      │
│ ├── OLD/ ...................... 🗄️  백업 아카이브    │
│ │                                                      │
│ └── CLAUDE.md, PROJECT_STATUS.md, README.md 등        │
└─────────────────────────────────────────────────────────┘
```

### 1.3 병렬 운영 전략 (Parallel Operations)

```
PRODUCTION (PHP 8.4)               DEVELOPMENT (Laravel 11)
     │                                      │
     ├─ User Traffic                       ├─ Local Development
     ├─ Live Data                          ├─ Isolated Testing
     ├─ API 연동                           ├─ Feature Building
     ├─ Error Fixes 적용                   └─ Integration Testing
     └─ Continuous Operation                
                │                           │
                └──── (최종 데이터 마이그레이션) ────┘
                         (커트오버 전)
```

---

## 2. 폴더 구조 상세 설계

### 2.1 server/ 폴더 (기존 운영)

```
server/                          [현재: Production]
├── public/                       [신버전 프론트엔드]
│   ├── index.html               로그인 페이지
│   ├── admin.html               관리 페이지
│   ├── login.html               로그인 폼
│   ├── app.js                   메인 애플리케이션
│   ├── i18n.js                  다국어 지원
│   ├── style.css                스타일
│   ├── logo.png                 로고
│   └── fonts/                   글꼴
│
├── src/                         [신버전 백엔드 - PHP]
│   ├── index.php                메인 API 엔드포인트
│   ├── Config.php               설정 클래스
│   ├── Agent.php                에이전트 관리
│   ├── Auth.php                 인증 시스템
│   └── (기타 PHP 파일)
│
├── data/                        [데이터 폴더]
│   ├── users.json               사용자 정보
│   ├── agents.json              에이전트 정보
│   └── (기타 데이터 파일)
│
├── Dockerfile                   [배포 설정]
├── docker-compose.yml           [로컬 테스트용]
└── .env.production              [운영 환경 변수]

[상태] ✅ Production 운영 중 (변경 금지)
```

### 2.2 server-laravel/ 폴더 (신규 개발)

```
server-laravel/                  [신규: Development]
├── app/
│   ├── Http/
│   │   ├── Controllers/
│   │   │   ├── AuthController.php
│   │   │   ├── AgentController.php
│   │   │   ├── AdminController.php
│   │   │   └── APIController.php
│   │   ├── Middleware/
│   │   │   ├── AuthMiddleware.php
│   │   │   └── RoleMiddleware.php
│   │   └── Requests/
│   │       ├── LoginRequest.php
│   │       └── (기타 폼 요청)
│   ├── Models/
│   │   ├── User.php
│   │   ├── Agent.php
│   │   ├── SubAccount.php
│   │   └── (기타 모델)
│   ├── Services/
│   │   ├── AgentService.php
│   │   ├── AuthService.php
│   │   └── APIService.php
│   └── Exceptions/
│       └── (예외 클래스)
│
├── routes/
│   ├── api.php                  [API 라우팅]
│   └── web.php                  [웹 라우팅]
│
├── resources/
│   └── views/
│       ├── login.blade.php
│       ├── admin.blade.php
│       └── (기타 뷰)
│
├── public/
│   ├── index.php                [Laravel 진입점]
│   ├── css/
│   ├── js/
│   └── images/
│
├── config/
│   ├── app.php
│   ├── database.php
│   ├── api.php                  [API 설정]
│   └── (기타 설정)
│
├── database/
│   ├── migrations/
│   │   ├── create_users_table.php
│   │   ├── create_agents_table.php
│   │   ├── create_sub_accounts_table.php
│   │   └── (기타 마이그레이션)
│   ├── seeders/
│   │   ├── UserSeeder.php
│   │   └── (기타 시더)
│   └── factories/
│
├── tests/
│   ├── Feature/
│   │   ├── AuthTest.php
│   │   ├── AgentTest.php
│   │   └── APITest.php
│   └── Unit/
│
├── .env.local                   [개발 환경 변수]
├── .env.testing                 [테스트 환경 변수]
├── .gitignore
├── composer.json                [PHP 의존성]
├── composer.lock
├── artisan                       [Laravel CLI]
├── Dockerfile                   [개발/배포용]
├── docker-compose.local.yml     [로컬 개발 환경]
└── laravel.log                  [개발 로그]

[상태] 🚀 Local development only (배포 금지)
```

### 2.3 error-fixes/ 폴더 (에러 수정 관리)

```
error-fixes/                     [PHP 에러 수정 보관]
├── 2026-08-07/
│   ├── ERROR_001_Login_Issue.md
│   │   ├── 문제 설명
│   │   ├── 수정 코드
│   │   ├── 적용 파일 (server/src/xxx.php)
│   │   └── 테스트 결과
│   │
│   ├── ERROR_002_API_Response.md
│   │   └── (동일 구조)
│   │
│   └── FIXES_APPLIED_2026-08-07.json
│       ├── error_id: "ERROR_001"
│       ├── file_modified: "server/src/Auth.php"
│       ├── date_applied: "2026-08-07"
│       └── ready_for_laravel: true
│
├── 2026-08-08/
│   └── (다른 날짜의 에러 수정)
│
├── 2026-08-15/
│   └── (계속 추가)
│
└── FIXES_INDEX.md              [모든 에러 수정 목록]
    ├── ERROR_001: Login Issue (✅ Applied to PHP)
    ├── ERROR_002: API Response (✅ Applied to PHP)
    ├── ERROR_003: Permission Bug (✅ Applied to PHP)
    └── [Laravel 개발 중 통합할 항목 표시]

[사용] PHP 버전에서 수정 → error-fixes에 기록 → Laravel 개발 중 통합
```

---

## 3. 단계별 워크플로우 (Phase-by-Phase Workflow)

### Phase 1: 준비 단계 (Preparation) - Week 1

#### 1.1 환경 설정

```
단계 1-1: 로컬 개발 환경 구성
├─ Laravel 11 프로젝트 생성
│  └─ composer create-project laravel/laravel server-laravel
│
├─ MySQL 연결 설정 (.env.local)
│  ├─ DB_HOST=localhost
│  ├─ DB_DATABASE=hotel_roomcheck_dev
│  ├─ DB_USERNAME=root
│  └─ DB_PASSWORD=***
│
├─ Laravel 초기화
│  ├─ php artisan key:generate
│  ├─ php artisan migrate (database schema 생성)
│  └─ php artisan serve (로컬 테스트)
│
└─ Git 브랜치 전략
   ├─ main: PHP production 운영 (보호)
   ├─ develop-laravel: Laravel 개발 분기
   └─ feature/laravel-*: 기능별 분기

타임라인: 2-3시간
```

#### 1.2 API 명세서 검토

```
단계 1-2: 기존 PHP API 완전 분석
├─ server/src/index.php 상세 분석
│  ├─ 모든 엔드포인트 목록화
│  │  ├─ POST /api/auth/login
│  │  ├─ POST /api/auth/register
│  │  ├─ GET /api/agents/{id}
│  │  ├─ GET /api/agents/{id}/sub-accounts
│  │  ├─ POST /api/agents/{id}/sub-accounts
│  │  ├─ PUT /api/agents/{id}/profile
│  │  └─ (기타 모든 엔드포인트)
│  │
│  ├─ 각 엔드포인트별 명세서
│  │  ├─ 입력 파라미터
│  │  ├─ 출력 JSON 포맷
│  │  ├─ 에러 응답
│  │  └─ 권한 요구사항
│  │
│  └─ 데이터 모델 분석
│     ├─ User 구조
│     ├─ Agent 구조
│     ├─ SubAccount 구조
│     └─ Permission hierarchy
│
├─ 데이터베이스 스키마 분석
│  ├─ Cloud SQL 구조 검토
│  ├─ 테이블 목록화
│  ├─ 관계도 작성
│  └─ 인덱스 전략 검토
│
└─ API_SPECIFICATION.md 문서 작성
   └─ Laravel 개발 가이드로 사용

타임라인: 3-4시간

결과: API_SPECIFICATION_Laravel.md 저장
```

#### 1.3 데이터 마이그레이션 계획

```
단계 1-3: 데이터 이관 전략 수립
├─ 현재 데이터 상황 파악
│  ├─ Cloud SQL의 기존 데이터 량 확인
│  ├─ 사용자 수, 에이전트 수 확인
│  ├─ 데이터 무결성 점검
│  └─ 백업 전략 검토
│
├─ 마이그레이션 스크립트 설계
│  ├─ PHP → MySQL 데이터 이관
│  ├─ 데이터 검증 로직
│  ├─ 롤백 절차
│  └─ 테스트 시나리오
│
└─ DATA_MIGRATION_PLAN.md 문서 작성

타임라인: 2-3시간

결과: 명확한 데이터 마이그레이션 절차 문서화
```

### Phase 2: Laravel 백엔드 개발 (Backend Development) - Week 2-3

#### 2.1 데이터베이스 마이그레이션 작성

```
단계 2-1: Laravel 마이그레이션 파일 생성
├─ Users 테이블
│  ├─ php artisan make:migration create_users_table
│  ├─ 필드: id, name, email, password, role, created_at, updated_at
│  └─ 스키마 최적화
│
├─ Agents 테이블
│  ├─ php artisan make:migration create_agents_table
│  ├─ 필드: id, user_id, agent_code, status, created_at
│  └─ foreign key: users.id
│
├─ SubAccounts 테이블
│  ├─ php artisan make:migration create_sub_accounts_table
│  ├─ 필드: id, agent_id, account_name, role, data_json, created_at
│  └─ foreign key: agents.id
│
├─ Permissions 테이블
│  ├─ php artisan make:migration create_permissions_table
│  ├─ 필드: id, role, permission, created_at
│  └─ permission hierarchy 정의
│
└─ php artisan migrate (로컬 테스트)

타임라인: 1-2시간

결과: 완벽한 Laravel 데이터베이스 스키마
```

#### 2.2 모델과 관계 정의

```
단계 2-2: Laravel Eloquent 모델 생성
├─ php artisan make:model User
│  ├─ hasMany(Agent)
│  ├─ hasMany(Role)
│  └─ timestamps
│
├─ php artisan make:model Agent
│  ├─ belongsTo(User)
│  ├─ hasMany(SubAccount)
│  └─ timestamps
│
├─ php artisan make:model SubAccount
│  ├─ belongsTo(Agent)
│  ├─ hasMany(Permission)
│  └─ timestamps
│
├─ php artisan make:model Permission
│  ├─ belongsTo(SubAccount)
│  └─ timestamps
│
└─ 모델 관계 테스트 (database/factories/)

타임라인: 1.5시간

결과: 완벽한 모델 구조와 관계 설정
```

#### 2.3 API 컨트롤러 개발

```
단계 2-3: RESTful API 컨트롤러 구현
├─ php artisan make:controller AuthController --model=User
│  ├─ login(): 로그인 처리
│  ├─ register(): 회원가입
│  ├─ logout(): 로그아웃
│  ├─ forgot_password(): 비밀번호 찾기
│  └─ reset_password(): 비밀번호 재설정
│
├─ php artisan make:controller AgentController --model=Agent
│  ├─ getAgents(): 에이전트 목록
│  ├─ getAgent($id): 특정 에이전트 조회
│  ├─ createAgent(): 에이전트 생성
│  ├─ getSubAccounts(): 부계정 목록
│  ├─ createSubAccount(): 부계정 생성
│  ├─ updateProfile(): 프로필 수정
│  └─ (AGENCY_API 연동)
│
├─ php artisan make:controller AdminController
│  ├─ getDashboard(): 관리 대시보드
│  ├─ getUserManagement(): 사용자 관리
│  ├─ getReports(): 리포트
│  └─ (관리 기능)
│
└─ php artisan make:controller APIController
   ├─ handleExternalAPI(): 외부 API 호출
   ├─ processWebhook(): 웹훅 처리
   └─ (API 통합)

타임라인: 8-10시간

결과: 모든 API 엔드포인트 구현
```

#### 2.4 API 라우팅 설정

```
단계 2-4: routes/api.php 작성
├─ 인증 관련 라우팅
│  ├─ POST /api/auth/login
│  ├─ POST /api/auth/register
│  ├─ POST /api/auth/logout
│  ├─ POST /api/auth/forgot-password
│  └─ POST /api/auth/reset-password
│
├─ 에이전트 관련 라우팅 (인증 필수)
│  ├─ GET /api/agents/{id}
│  ├─ GET /api/agents/{id}/sub-accounts
│  ├─ POST /api/agents/{id}/sub-accounts
│  ├─ PUT /api/agents/{id}/profile
│  └─ (모든 에이전트 API)
│
├─ 관리자 관련 라우팅 (권한 필수)
│  ├─ GET /api/admin/dashboard
│  ├─ GET /api/admin/users
│  ├─ GET /api/admin/reports
│  └─ (모든 관리 API)
│
└─ Middleware 적용
   ├─ auth:api (토큰 검증)
   ├─ role:admin (권한 검증)
   └─ rate limiting (속도 제한)

타임라인: 1-2시간

결과: 완벽한 라우팅 구조
```

#### 2.5 외부 API 통합

```
단계 2-5: AGENCY_API / HOTEL_API 연동
├─ APIService 클래스 개발
│  ├─ callAgencyAPI()
│  ├─ callHotelAPI()
│  ├─ handleResponse()
│  ├─ handleError()
│  └─ retry logic (실패 시 재시도)
│
├─ 환경 변수 설정 (.env.local)
│  ├─ AGENCY_API_URL=https://nirvana835.mycafe24.com
│  ├─ HOTEL_API_URL=https://nirvana835.mycafe24.com
│  ├─ API_KEY=***
│  └─ API_SECRET=***
│
├─ API 요청/응답 로깅
│  ├─ storage/logs/api-requests.log
│  ├─ 디버깅 정보 기록
│  └─ 성능 모니터링
│
└─ 테스트 구현
   ├─ Mock API 응답
   ├─ 성공 시나리오
   ├─ 실패 시나리오
   └─ 타임아웃 처리

타임라인: 4-5시간

결과: 완벽한 외부 API 통합
```

### Phase 3: 프론트엔드 적응 (Frontend Adaptation) - Week 3

#### 3.1 기존 HTML/JS 마이그레이션

```
단계 3-1: 프론트엔드 파일 적응
├─ public/ 폴더 구조
│  ├─ 기존 server/public/ 파일 복사
│  ├─ API 엔드포인트 경로 수정
│  │  ├─ /api/auth/login (변경 없음)
│  │  ├─ /api/agents/* (변경 없음)
│  │  └─ 모두 동일한 엔드포인트 유지
│  │
│  └─ CSRF 토큰 처리
│     ├─ Laravel Blade에서 {{ csrf_token() }} 사용
│     ├─ 모든 POST 요청에 포함
│     └─ JavaScript에서 헤더 설정
│
├─ JavaScript 수정
│  ├─ app.js 업데이트
│  │  ├─ API 호출 경로 확인 (동일)
│  │  ├─ 토큰 관리 (Bearer token)
│  │  ├─ 에러 처리 업데이트
│  │  └─ 로딩 상태 관리
│  │
│  └─ i18n.js 유지 (다국어 지원)
│     ├─ 한국어, English, ไทย
│     ├─ localStorage 사용 (미변경)
│     └─ 전체 호환성 유지
│
└─ CSS 유지 (변경 불필요)
   ├─ style.css 복사
   └─ 레이아웃 호환성 확인

타임라인: 2-3시간

결과: 프론트엔드 완벽 호환성 달성
```

#### 3.2 Blade 템플릿 (선택사항)

```
단계 3-2: Laravel Blade 템플릿 (optional)
├─ 기본 레이아웃 (resources/views/layouts/app.blade.php)
│  ├─ HTML 기본 구조
│  ├─ @csrf 토큰 포함
│  ├─ @yield('content')
│  └─ CSS/JS 링크
│
├─ 페이지 템플릿
│  ├─ resources/views/login.blade.php
│  ├─ resources/views/admin.blade.php
│  ├─ resources/views/profile.blade.php
│  └─ (필요한 페이지)
│
└─ 주의: 기존 HTML 그대로 사용 가능
   └─ Blade 템플릿은 선택사항 (필수 아님)

타임라인: 1-2시간 (선택)

상태: 기존 HTML/JS 그대로 운영 가능
```

### Phase 4: 테스트 및 검증 (Testing & Validation) - Week 3-4

#### 4.1 단위 테스트 (Unit Tests)

```
단계 4-1: PHPUnit 단위 테스트
├─ 모델 테스트 (tests/Unit/Models/)
│  ├─ UserTest.php
│  │  ├─ canCreateUser()
│  │  ├─ canUpdateUser()
│  │  ├─ canDeleteUser()
│  │  └─ relationshipTests()
│  │
│  ├─ AgentTest.php
│  │  ├─ canCreateAgent()
│  │  ├─ canCreateSubAccount()
│  │  ├─ canAssignPermissions()
│  │  └─ relationshipTests()
│  │
│  └─ SubAccountTest.php
│     ├─ dataIsolationTest()
│     ├─ permissionTest()
│     └─ relationshipTests()
│
├─ 서비스 테스트 (tests/Unit/Services/)
│  ├─ AuthServiceTest.php
│  ├─ AgentServiceTest.php
│  └─ APIServiceTest.php
│
└─ 테스트 실행
   └─ php artisan test --filter=Unit

타임라인: 4-6시간

결과: 모든 단위 테스트 통과 (coverage >80%)
```

#### 4.2 기능 테스트 (Feature Tests)

```
단계 4-2: Feature 테스트
├─ 인증 테스트 (tests/Feature/AuthTest.php)
│  ├─ canLogin()
│  ├─ canRegister()
│  ├─ canLogout()
│  ├─ canResetPassword()
│  └─ invalidCredentials()
│
├─ 에이전트 테스트 (tests/Feature/AgentTest.php)
│  ├─ canGetAgentInfo()
│  ├─ canCreateSubAccount()
│  ├─ canManagePermissions()
│  ├─ dataIsolation()
│  └─ unauthorizedAccess()
│
├─ API 통합 테스트 (tests/Feature/APITest.php)
│  ├─ canCallAgencyAPI()
│  ├─ canCallHotelAPI()
│  ├─ handleAPIError()
│  └─ retryLogic()
│
└─ 테스트 실행
   └─ php artisan test --filter=Feature

타임라인: 6-8시간

결과: 모든 기능 테스트 통과
```

#### 4.3 통합 테스트 (Integration Tests)

```
단계 4-3: E2E 통합 테스트
├─ 전체 워크플로우 테스트
│  ├─ 1. 회원가입 → 2. 로그인 → 3. 프로필 조회
│  ├─ 1. 에이전트 조회 → 2. 부계정 생성 → 3. 권한 할당
│  ├─ 1. API 호출 → 2. 응답 처리 → 3. 데이터 저장
│  └─ 1. 에러 발생 → 2. 재시도 → 3. 복구
│
├─ 데이터 일관성 검증
│  ├─ 트랜잭션 테스트
│  ├─ 동시성 테스트
│  ├─ 데이터 무결성
│  └─ 격리 수준 확인
│
├─ 성능 테스트
│  ├─ 응답 시간 (< 500ms)
│  ├─ 동시 사용자 (100+ 지원)
│  ├─ 메모리 사용 (< 256MB)
│  └─ 쿼리 성능
│
└─ 테스트 도구
   ├─ php artisan test (전체)
   ├─ Laravel Dusk (브라우저 테스트 - 선택)
   └─ Apache Bench (성능 테스트)

타임라인: 8-10시간

결과: 완벽한 통합 테스트 완료
```

#### 4.4 데이터 마이그레이션 테스트

```
단계 4-4: 데이터 이관 검증
├─ 사전 점검
│  ├─ 기존 데이터 백업
│  ├─ 마이그레이션 스크립트 검증
│  ├─ 롤백 절차 테스트
│  └─ 예상 시간 산정
│
├─ 마이그레이션 실행 (테스트)
│  ├─ 스테이징 DB에서 먼저 테스트
│  ├─ 전체 데이터 이관
│  ├─ 데이터 검증
│  └─ 성능 측정
│
├─ 데이터 검증
│  ├─ 사용자 데이터 일치율
│  ├─ 에이전트 데이터 일치율
│  ├─ 부계정 데이터 일치율
│  ├─ 권한 데이터 일치율
│  └─ 전체 일치율 > 99.9%
│
└─ 검증 결과 문서
   └─ MIGRATION_VALIDATION_REPORT.md

타임라인: 3-4시간

결과: 데이터 마이그레이션 완벽성 검증 완료
```

### Phase 5: 에러 수정 통합 (Error Fixes Integration) - Week 4

#### 5.1 에러 목록 검토

```
단계 5-1: error-fixes/ 폴더에서 모든 수정사항 검토
├─ PHP 버전에서 적용된 모든 에러 수정 검토
│  ├─ error-fixes/2026-08-07/ 모든 파일 확인
│  ├─ error-fixes/2026-08-08/ 모든 파일 확인
│  ├─ error-fixes/2026-08-15/ 모든 파일 확인
│  └─ error-fixes/FIXES_INDEX.md 전체 검토
│
├─ 각 에러별 상세 분석
│  ├─ 에러의 원인
│  ├─ PHP에서 적용된 수정 내용
│  ├─ 테스트 방법
│  └─ Laravel에서 구현 방식
│
└─ 통합 계획서 작성
   └─ ERRORS_FOR_LARAVEL_INTEGRATION.md

타임라인: 2-3시간

결과: 모든 에러 수정사항 명확히 파악
```

#### 5.2 에러 수정 구현

```
단계 5-2: Laravel에 에러 수정 적용
├─ 각 에러별 Laravel 구현
│  ├─ ERROR_001: Login Issue
│  │  ├─ AuthController에서 수정 구현
│  │  ├─ AuthService에서 로직 개선
│  │  ├─ 동일한 에러 발생 방지
│  │  └─ 테스트 작성
│  │
│  ├─ ERROR_002: API Response
│  │  ├─ APIService에서 응답 처리
│  │  ├─ 에러 메시지 표준화
│  │  ├─ 재시도 로직 구현
│  │  └─ 테스트 작성
│  │
│  └─ ERROR_003: Permission Bug
│     ├─ Permission middleware 개선
│     ├─ Role 체크 로직 강화
│     ├─ 데이터 격리 검증
│     └─ 테스트 작성
│
├─ 통합 테스트
│  ├─ 각 에러 수정이 정상 작동하는지 확인
│  ├─ 회귀 테스트 (다른 기능에 영향 없음)
│  └─ 전체 시스템 테스트
│
└─ 검증 체크리스트
   └─ ALL_ERRORS_INTEGRATED.md

타임라인: 6-8시간

결과: 모든 에러 수정 완벽 적용
```

### Phase 6: 최종 검증 및 준비 (Final Validation & Preparation) - Week 4

#### 6.1 완전한 로컬 테스트

```
단계 6-1: 로컬 환경에서 완전한 테스트
├─ 로컬 서버 시작
│  └─ php artisan serve (localhost:8000)
│
├─ 브라우저에서 전체 기능 테스트
│  ├─ 로그인 페이지 접속
│  ├─ 회원가입 및 로그인
│  ├─ 프로필 조회 및 수정
│  ├─ 에이전트 관리
│  ├─ 부계정 생성 및 관리
│  ├─ 권한 할당 및 검증
│  ├─ 다국어 전환
│  └─ 로그아웃
│
├─ API 엔드포인트 테스트
│  ├─ 모든 API 엔드포인트 호출 검증
│  ├─ 요청/응답 형식 확인
│  ├─ 에러 처리 확인
│  └─ 성능 측정
│
├─ 외부 API 연동 테스트
│  ├─ AGENCY_API 호출
│  ├─ HOTEL_API 호출
│  ├─ 응답 처리
│  └─ 에러 처리
│
├─ 데이터베이스 검증
│  ├─ 데이터 저장 정확성
│  ├─ 관계 무결성
│  ├─ 트랜잭션 일관성
│  └─ 격리 수준 검증
│
└─ 성능 측정
   ├─ 응답 시간 (< 500ms 목표)
   ├─ 메모리 사용
   ├─ 동시 요청 처리
   └─ 리소스 사용률

타임라인: 8-10시간

결과: FINAL_VALIDATION_REPORT.md 작성
```

#### 6.2 배포 준비 (Docker & Cloud Run)

```
단계 6-2: 배포 환경 준비
├─ Dockerfile 작성 (Laravel 버전)
│  ├─ 기본 이미지: php:8.2-apache
│  ├─ 확장 설치: mysql, gd, curl 등
│  ├─ Composer 의존성 설치
│  ├─ 권한 설정 (storage, bootstrap)
│  ├─ Apache 설정 (mod_rewrite)
│  └─ 건강 체크 설정
│
├─ Docker Compose (로컬 테스트용)
│  ├─ Laravel 서비스
│  ├─ MySQL 서비스
│  ├─ 환경 변수 설정
│  └─ 네트워크 구성
│
├─ Cloud Run 배포 준비
│  ├─ .env.production 설정
│  ├─ Cloud SQL 연결 설정
│  ├─ 환경 변수 확인
│  ├─ 로그 설정
│  └─ 모니터링 설정
│
├─ GitHub Actions 워크플로우 (Laravel)
│  ├─ 테스트 자동화
│  ├─ Docker 빌드
│  ├─ GCR 푸시
│  ├─ Cloud Run 배포
│  └─ 배포 후 검증
│
└─ 배포 명령어 검증
   └─ 수동 배포 테스트

타임라인: 4-5시간

결과: DEPLOYMENT_READY.md 작성
```

#### 6.3 롤백 계획 (Rollback Plan)

```
단계 6-3: 예비 계획 수립
├─ 롤백 절차 문서화
│  ├─ PHP 버전으로 신속히 복원
│  ├─ 데이터베이스 복구
│  ├─ DNS 전환
│  └─ 사용자 공지
│
├─ Blue-Green 배포 전략
│  ├─ Blue: 기존 PHP 버전 (live)
│  ├─ Green: 새로운 Laravel 버전 (준비)
│  ├─ 트래픽 전환 (0→100%)
│  ├─ 모니터링 (30분)
│  └─ 필요시 롤백
│
├─ 모니터링 체크리스트
│  ├─ 에러율 (< 0.1% 목표)
│  ├─ 응답 시간 (< 500ms)
│  ├─ 사용자 피드백
│  ├─ 시스템 리소스
│  └─ 데이터베이스 성능
│
└─ ROLLBACK_PLAN.md 작성

타임라인: 2-3시간

결과: 안전한 롤백 계획 완성
```

### Phase 7: 배포 (Deployment) - Week 5

#### 7.1 프로덕션 배포

```
단계 7-1: 프로덕션에 Laravel 버전 배포
├─ 배포 전 최종 체크
│  ├─ 모든 테스트 통과 확인
│  ├─ 모든 문서 검토
│  ├─ 데이터 백업 확인
│  ├─ 롤백 절차 이해
│  └─ 팀 준비 확인
│
├─ 배포 실행
│  ├─ main 브랜치에 develop-laravel merge
│  ├─ 버전 태그 생성 (v2.0.0-laravel)
│  ├─ GitHub push
│  └─ GitHub Actions 자동 배포 시작 (3-5분)
│
├─ 실시간 모니터링
│  ├─ Cloud Run 배포 진행상황 확인
│  ├─ Docker 빌드 완료 대기
│  ├─ 배포 완료 확인
│  └─ 헬스 체크 (HTTP 200)
│
├─ Post-Deployment 검증
│  ├─ 웹사이트 접속 확인
│  ├─ 로그인 기능 테스트
│  ├─ 주요 기능 테스트
│  ├─ API 응답 검증
│  └─ 데이터 일관성 확인
│
└─ 배포 결과 기록
   └─ DEPLOYMENT_SUCCESS_LARAVEL_*.md

타임라인: 1-2시간 (배포 시간 포함)

결과: Laravel 버전 프로덕션 배포 완료
```

#### 7.2 사용자 공지 및 모니터링

```
단계 7-2: 배포 후 관리
├─ 사용자 공지
│  ├─ 배포 완료 알림
│  ├─ 새로운 기능 안내 (있으면)
│  ├─ 이슈 보고 채널 안내
│  └─ 지원 연락처 제공
│
├─ 모니터링 (배포 후 24시간)
│  ├─ 에러율 모니터링
│  ├─ 응답 시간 모니터링
│  ├─ 사용자 반응 모니터링
│  ├─ 데이터베이스 성능 모니터링
│  └─ 리소스 사용 모니터링
│
├─ 핫픽스 준비
│  ├─ 긴급 이슈 대응 프로세스
│  ├─ 신속한 롤백 능력
│  ├─ 빠른 수정 및 재배포
│  └─ 사용자 소통
│
└─ 최종 확인
   ├─ 모든 기능 정상 작동
   ├─ 데이터 무결성 확인
   ├─ 성능 기준 충족
   └─ 사용자 만족도 높음

타임라인: 24시간 (모니터링 기간)

결과: 안정적인 배포 완료 및 운영 안정화
```

---

## 4. 폴더별 작업 체크리스트

### 4.1 server-laravel/ 폴더 생성 및 개발 체크리스트

```
✅ 폴더 생성 단계
├─ [ ] 프로젝트 루트에서 server-laravel/ 폴더 생성
├─ [ ] Laravel 프로젝트 초기화 (composer create-project)
├─ [ ] .env.local 파일 생성 및 설정
├─ [ ] Database 마이그레이션 실행
└─ [ ] php artisan serve 로컬 테스트

✅ 백엔드 개발
├─ [ ] 데이터베이스 마이그레이션 파일 생성
├─ [ ] Eloquent 모델 생성 (User, Agent, SubAccount, Permission)
├─ [ ] 컨트롤러 생성 (Auth, Agent, Admin, API)
├─ [ ] 라우팅 설정 (routes/api.php)
├─ [ ] 미들웨어 설정 (Auth, Role)
├─ [ ] 외부 API 통합 (APIService)
└─ [ ] 모든 기능 로컬 테스트

✅ 테스트 개발
├─ [ ] 단위 테스트 작성 (tests/Unit/)
├─ [ ] 기능 테스트 작성 (tests/Feature/)
├─ [ ] 통합 테스트 작성
├─ [ ] 데이터 마이그레이션 테스트
├─ [ ] 모든 테스트 실행 및 통과
└─ [ ] 테스트 커버리지 >80%

✅ 배포 준비
├─ [ ] Dockerfile 작성
├─ [ ] docker-compose.local.yml 작성
├─ [ ] .env.production 설정
├─ [ ] GitHub Actions 워크플로우 (Laravel용)
├─ [ ] Cloud Run 배포 설정
└─ [ ] 배포 전 최종 검증

상태: 🚀 Local development only (배포 금지)
```

### 4.2 error-fixes/ 폴더 관리 체크리스트

```
✅ 에러 수정 기록
├─ [ ] PHP 버전에서 발생한 에러 문서화
├─ [ ] 각 에러별 폴더 생성 (2026-08-07/, 2026-08-08/ 등)
├─ [ ] 에러 설명 파일 작성
├─ [ ] 수정 코드 저장
├─ [ ] 적용 결과 기록
└─ [ ] FIXES_INDEX.md 유지보수

✅ 에러 통합 계획
├─ [ ] 모든 에러 검토
├─ [ ] Laravel 구현 방식 계획
├─ [ ] 통합 일정 수립
├─ [ ] 각 에러별 구현
├─ [ ] 통합 테스트
└─ [ ] 최종 검증

상태: 📝 PHP 에러 수정 → Laravel 통합
```

### 4.3 server/ 폴더 보호 체크리스트

```
✅ Production 보호
├─ [ ] server/public/ 변경 금지
├─ [ ] server/src/ 변경 금지 (에러 수정 제외)
├─ [ ] server/data/ 변경 신중히
├─ [ ] Dockerfile 변경 금지
├─ [ ] Docker 배포 진행 중이 아닌지 확인
└─ [ ] 모든 수정은 error-fixes/에 기록

상태: 🔒 Production 운영 중 (변경 금지)
```

---

## 5. 병렬 운영 관리 (Parallel Operations Management)

### 5.1 PHP 버전 에러 수정 (진행 중)

```
시나리오: PHP 프로덕션에서 에러 발생
───────────────────────────────────

1️⃣ 에러 발생 → 즉시 보고
   ├─ 에러 내용 상세 기록
   ├─ 스크린샷 또는 로그 저장
   └─ error-fixes/2026-08-xx/ 폴더에 저장

2️⃣ 즉시 수정 (PHP 버전)
   ├─ server/src/에서 수정
   ├─ 테스트 완료
   ├─ 배포 (git push)
   └─ 모니터링

3️⃣ 수정 내용 기록 (error-fixes/)
   ├─ ERROR_0XX_Description.md 작성
   ├─ 수정 코드 저장
   ├─ 테스트 결과 기록
   └─ FIXES_INDEX.md 업데이트

4️⃣ Laravel 준비
   ├─ 주석: "Laravel에 추가할 에러 수정"
   ├─ 우선순위 표시
   ├─ 구현 시기 계획
   └─ Laravel 개발 중에 통합

결과: PHP는 항상 안정적 + Laravel 개발과 동시 진행
```

### 5.2 Laravel 개발 (Local Only)

```
시나리오: Laravel 개발 진행 중
────────────────────────────

1️⃣ Local 개발 환경
   ├─ php artisan serve (localhost:8000)
   ├─ 모든 테스트 로컬에서 실행
   ├─ GitHub에 develop-laravel 브랜치에만 push
   └─ Production 배포 없음 (아직!)

2️⃣ 에러 수정 통합
   ├─ error-fixes/ 폴더의 모든 수정 검토
   ├─ Laravel에 해당 내용 구현
   ├─ 테스트로 검증
   └─ GitHub에 커밋

3️⃣ 정기적 테스트
   ├─ 모든 유닛 테스트 통과
   ├─ 모든 기능 테스트 통과
   ├─ 통합 테스트 통과
   ├─ 데이터 마이그레이션 테스트
   └─ 성능 테스트

4️⃣ 준비 완료 확인
   ├─ FINAL_VALIDATION_REPORT.md 작성
   ├─ 배포 준비 완료 확인
   ├─ 롤백 계획 검증
   └─ "배포 준비 완료" 신호

결과: Laravel은 완벽하게 준비 완료 후 배포
```

### 5.3 데이터 마이그레이션 (최종 단계)

```
시나리오: 배포 직전 최종 준비
──────────────────────────

1️⃣ 배포 전 최종 점검
   ├─ PHP 버전 완전 백업
   ├─ MySQL 데이터 완전 백업
   ├─ Laravel 모든 테스트 통과
   └─ 배포 환경 준비 완료

2️⃣ 배포 시작 (Blue-Green 전략)
   ├─ Blue: 기존 PHP 버전 (운영 중)
   ├─ Green: 새로운 Laravel 버전 (준비)
   ├─ 최종 검증 (Green 환경에서)
   └─ 데이터 마이그레이션 (PHP → Laravel)

3️⃣ 트래픽 전환
   ├─ 10% 트래픽 → Laravel
   ├─ 모니터링 (15분)
   ├─ 50% 트래픽 → Laravel
   ├─ 모니터링 (15분)
   ├─ 100% 트래픽 → Laravel
   ├─ 모니터링 (30분)
   └─ 안정성 확인

4️⃣ 완전히 전환 또는 롤백
   ├─ 안정적이면 → Laravel 완전 운영
   ├─ 문제 발생하면 → PHP로 즉시 롤백
   └─ 결과 기록

결과: 안전하고 검증된 배포
```

---

## 6. 위험 관리 (Risk Management)

### 6.1 잠재적 위험 요소

```
위험 #1: 데이터 마이그레이션 실패
─────────────────────────────
증상: 데이터 손실, 불일치, 오류
영향도: 🔴 치명적
예방책:
├─ 완벽한 백업 (3중 백업)
├─ 테스트 환경에서 먼저 마이그레이션
├─ 데이터 검증 로직 구현
├─ 롤백 스크립트 준비
└─ 최대 1시간 배포 시간 할당

위험 #2: API 호환성 문제
─────────────────────────
증상: 외부 API 응답 오류, 데이터 형식 불일치
영향도: 🟡 높음
예방책:
├─ 모든 API 엔드포인트 상세 문서화
├─ Mock API로 테스트
├─ 실제 API와 통합 테스트
├─ 에러 처리 강화
└─ API 변경사항 사전 점검

위험 #3: 성능 저하
─────────────────────────
증상: 응답 시간 증가, 높은 리소스 사용
영향도: 🟡 높음
예방책:
├─ 로컬에서 부하 테스트
├─ 데이터베이스 쿼리 최적화
├─ 캐싱 전략 구현
├─ 인덱스 설정 확인
└─ 모니터링 대시보드 구축

위험 #4: 권한/권한 시스템 오류
─────────────────────────────
증상: 일부 사용자 접근 불가, 권한 오류
영향도: 🟡 높음
예방책:
├─ 권한 시스템 상세 테스트
├─ 모든 역할(owner, manager, staff, guest) 테스트
├─ 데이터 격리 검증
├─ 권한 체계 문서화
└─ 통합 테스트

위험 #5: 배포 중 장애
─────────────────────────
증상: 배포 실패, 부분 배포, 서비스 중단
영향도: 🔴 치명적
예방책:
├─ GitHub Actions 워크플로우 완벽 검증
├─ 배포 전 드라이런
├─ 롤백 절차 사전 테스트
├─ 모니터링 설정
└─ 즉각 롤백 능력

각 위험에 대해 상세한 대응 계획을 수립하고 정기적으로 검토합니다.
```

### 6.2 모니터링 계획

```
배포 후 모니터링 (24시간 집중 모니터링)
─────────────────────────────────

시간    모니터링 항목              목표값      알림
───────────────────────────────────────────
0-5분   배포 진행 상황            100% 완료    즉시
5-15분  서비스 응답성             < 500ms     즉시
        에러율                   < 0.5%      즉시
        
15-1시간 기능 정상 작동            100%       즉시
        데이터 일관성             99.9%+     즉시
        사용자 피드백             긍정적     1시간마다
        
1-24시간 성능 안정성              기준 유지   매 1시간
        에러율 추이               감소 추세   매 1시간
        데이터 무결성             99.9%+     매 4시간
        사용자 만족도             높음       매 6시간

알림 수신처: 관리자, 개발팀 (메일, 핸드폰)
롤백 트리거: 에러율 > 1% 또는 완전 오류
```

---

## 7. 일정 계획 (Timeline)

### 7.1 상세 일정

```
Week 1 (Phase 1: 준비)
├─ Day 1-2: 환경 설정 (4-6시간)
│   ├─ Laravel 프로젝트 초기화
│   ├─ MySQL 로컬 연결
│   └─ 초기 테스트
│
├─ Day 3: API 명세서 작성 (3-4시간)
│   ├─ PHP API 상세 분석
│   ├─ 엔드포인트 문서화
│   └─ 데이터 모델 정의
│
└─ Day 4-5: 마이그레이션 계획 (4-6시간)
    ├─ 데이터 구조 분석
    ├─ 마이그레이션 스크립트 설계
    └─ 일정 최종 확인

✅ Week 1 결과: 전체 준비 완료

───────────────────────────────────

Week 2 (Phase 2-3: 개발 & 프론트엔드)
├─ Day 1-2: 데이터베이스 마이그레이션 (2-3시간)
│   ├─ Laravel 마이그레이션 파일 생성
│   ├─ 스키마 검증
│   └─ 로컬 DB 준비
│
├─ Day 3: 모델 및 컨트롤러 (6-8시간)
│   ├─ Eloquent 모델 생성
│   ├─ 기본 컨트롤러 구현
│   └─ 라우팅 설정
│
├─ Day 4-5: API 컨트롤러 & 라우팅 (8-10시간)
│   ├─ 모든 API 엔드포인트 구현
│   ├─ 미들웨어 설정
│   ├─ 외부 API 통합
│   └─ 기본 테스트
│
└─ Week 2 완료: 백엔드 85% 구현

───────────────────────────────────

Week 3 (Phase 3-4: 테스트 & 프론트엔드)
├─ Day 1-2: 프론트엔드 적응 (2-3시간)
│   ├─ 기존 HTML/JS 마이그레이션
│   ├─ API 경로 업데이트
│   └─ 호환성 검증
│
├─ Day 3-5: 테스트 개발 (15-20시간)
│   ├─ 단위 테스트 작성 (4-6시간)
│   ├─ 기능 테스트 작성 (6-8시간)
│   ├─ 통합 테스트 작성 (4-6시간)
│   └─ 모든 테스트 통과
│
└─ Week 3 완료: 전체 시스템 구현 & 테스트

───────────────────────────────────

Week 4 (Phase 5-6: 에러 통합 & 최종 검증)
├─ Day 1-2: 에러 수정 통합 (6-8시간)
│   ├─ 에러 목록 검토
│   ├─ Laravel 구현
│   └─ 통합 테스트
│
├─ Day 3-4: 최종 검증 (16-20시간)
│   ├─ 로컬 완전 테스트 (8-10시간)
│   ├─ 배포 준비 (4-5시간)
│   ├─ 롤백 계획 (2-3시간)
│   └─ 문서화 (2-3시간)
│
└─ Day 5: 배포 준비 완료 확인 (2-3시간)
    └─ ✅ "배포 준비 완료" 신호

✅ Week 4 결과: 배포 준비 100% 완료

───────────────────────────────────

Week 5 (Phase 7: 배포 & 모니터링)
├─ Day 1: 최종 점검 및 배포 (2-3시간)
│   ├─ 최종 테스트 실행
│   ├─ GitHub push (deploy-laravel → main)
│   ├─ GitHub Actions 자동 배포
│   └─ 배포 완료 확인 (5분 대기)
│
├─ Day 1-2: 배포 후 모니터링 (24시간)
│   ├─ 실시간 모니터링 (첫 1시간)
│   ├─ 주기적 모니터링 (24시간)
│   ├─ 사용자 피드백 수집
│   └─ 필요시 핫픽스
│
└─ Day 3-5: 안정화 (운영 정상화)
    ├─ 최종 성능 검증
    ├─ 운영 절차 확립
    └─ ✅ 배포 완료!

✅ Week 5 결과: 프로덕션 배포 완료 & 안정화
```

### 7.2 병렬 작업 일정 (PHP 에러 수정)

```
PHP 버전은 계속 운영되며 에러 수정은 독립적으로 진행:

Week 1-4 (Laravel 개발 중):
├─ PHP 프로덕션에서 에러 발생 → 즉시 수정 (보통 30분-2시간)
├─ error-fixes/ 폴더에 기록 (30분)
├─ Laravel 통합 목록에 추가 (10분)
└─ PHP는 계속 안정적으로 운영

수정 예상:
├─ Week 1: 0-2개 에러 수정
├─ Week 2: 0-3개 에러 수정
├─ Week 3: 0-2개 에러 수정
└─ Week 4: 0-1개 에러 수정
└─ 총계: 평균 2-8개 에러 수정 (비즈니스 이용량에 따라)

Laravel 통합은 배포 후 (선택사항)
```

---

## 8. 문서 생성 일정

```
작성할 주요 문서들
──────────────────

✅ Phase 1 (Week 1)
├─ API_SPECIFICATION_Laravel.md
├─ DATA_MIGRATION_PLAN.md
└─ LARAVEL_PROJECT_SETUP.md

✅ Phase 2-3 (Week 2-3)
├─ DATABASE_SCHEMA.md
├─ API_ENDPOINTS.md
├─ TESTING_STRATEGY.md
└─ INTEGRATION_CHECKLIST.md

✅ Phase 4 (Week 3)
├─ TEST_RESULTS.md
├─ PERFORMANCE_REPORT.md
└─ FINAL_VALIDATION_REPORT.md

✅ Phase 5 (Week 4)
├─ DEPLOYMENT_READY.md
├─ ROLLBACK_PLAN.md
├─ MONITORING_PLAN.md
└─ ERRORS_FOR_LARAVEL_INTEGRATION.md

✅ Phase 6 (Week 5)
├─ DEPLOYMENT_SUCCESS_LARAVEL_*.md
├─ MONITORING_RESULTS_24H.md
└─ OPERATIONS_MANUAL.md

모든 문서는 프로젝트에 저장됨
```

---

## 9. 성공 기준 (Success Criteria)

### 9.1 기술적 성공 기준

```
✅ 배포 성공
├─ GitHub Actions 워크플로우 성공
├─ Docker 이미지 빌드 성공
├─ Cloud Run 배포 성공
├─ HTTPS 정상 작동
└─ 배포 시간 < 5분

✅ 기능 정상 작동
├─ 모든 로그인 기능 작동
├─ 모든 에이전트 기능 작동
├─ 모든 관리자 기능 작동
├─ 모든 API 엔드포인트 응답
└─ 외부 API 연동 정상

✅ 데이터 무결성
├─ 데이터 마이그레이션 성공
├─ 데이터 일치율 > 99.9%
├─ 사용자 데이터 완벽 보존
├─ 에이전트 정보 완벽 보존
└─ 권한 정보 완벽 보존

✅ 성능 기준 충족
├─ 응답 시간 < 500ms (목표: < 300ms)
├─ 동시 사용자 100+ 지원
├─ 에러율 < 0.1% (목표)
├─ 메모리 사용 < 256MB
└─ CPU 사용 < 50%

✅ 테스트 통과
├─ 유닛 테스트 100% 통과
├─ 기능 테스트 100% 통과
├─ 통합 테스트 100% 통과
├─ 테스트 커버리지 > 80%
└─ 데이터 마이그레이션 테스트 통과

✅ 보안 확인
├─ CSRF 보호 활성화
├─ SQL Injection 방지
├─ XSS 방지
├─ 권한 검증 강화
└─ 데이터 격리 검증
```

### 9.2 운영 성공 기준

```
✅ 배포 후 안정성 (24시간)
├─ 서비스 가용성 > 99.5%
├─ 에러율 < 0.1%
├─ 평균 응답시간 < 500ms
├─ 사용자 만족도 높음
└─ 긴급 이슈 0개

✅ 데이터 일관성
├─ 데이터 손실 없음
├─ 트랜잭션 일관성 유지
├─ 데이터베이스 무결성 검증
└─ 사용자 데이터 완벽 보존

✅ 사용자 경험
├─ 기존 기능 모두 작동
├─ 성능 개선 또는 동등
├─ 사용자 피드백 긍정적
└─ 새로운 기능 준비 (향후)

✅ 운영 효율성
├─ 자동 배포 정상 작동
├─ 모니터링 시스템 정상
├─ 로그 기록 정상
└─ 알림 시스템 정상
```

---

## 10. 최종 체크리스트

### 10.1 배포 전 최종 확인

```
배포 48시간 전 (최종 준비)
──────────────────────────

개발 상태
├─ [ ] 모든 코드 작성 완료
├─ [ ] 모든 테스트 작성 완료
├─ [ ] 모든 테스트 통과 (100%)
├─ [ ] 테스트 커버리지 > 80%
└─ [ ] 코드 리뷰 완료

문서화
├─ [ ] API 명세서 완성
├─ [ ] 데이터베이스 스키마 문서화
├─ [ ] 배포 절차 문서화
├─ [ ] 롤백 절차 문서화
└─ [ ] 모니터링 계획 작성

배포 준비
├─ [ ] Dockerfile 최종 확인
├─ [ ] .env.production 설정 완료
├─ [ ] GitHub Actions 워크플로우 검증
├─ [ ] Cloud Run 배포 설정 확인
└─ [ ] 데이터 백업 완료 (3중)

배포 24시간 전 (배포 리허설)
──────────────────────────

리허설
├─ [ ] GitHub Actions 테스트 배포
├─ [ ] Docker 이미지 빌드 테스트
├─ [ ] Cloud Run 배포 테스트 (스테이징)
├─ [ ] 배포 후 검증 스크립트 테스트
└─ [ ] 롤백 절차 테스트

팀 준비
├─ [ ] 팀원들에게 배포 계획 설명
├─ [ ] 긴급 연락 체계 확인
├─ [ ] 모니터링 역할 분담
├─ [ ] 문제 발생 시 대응 절차 확인
└─ [ ] 커뮤니케이션 채널 준비

배포 당일 (배포 2시간 전)
──────────────────────────

최종 확인
├─ [ ] 모든 팀원 온라인 확인
├─ [ ] 모니터링 도구 준비
├─ [ ] 롤백 절차 최종 확인
├─ [ ] 배포 계획 최종 검토
└─ [ ] 긴급 연락처 확인
```

### 10.2 배포 후 확인

```
배포 직후 (1시간)
────────────────

기본 기능 확인
├─ [ ] 사이트 접속 가능
├─ [ ] 로그인 페이지 로드
├─ [ ] 회원가입 기능 작동
├─ [ ] 로그인 기능 작동
├─ [ ] 로그아웃 기능 작동
└─ [ ] 메인 페이지 로드

배포 후 1시간 (모니터링)
────────────────────

모니터링
├─ [ ] 에러율 확인 (< 0.1% 목표)
├─ [ ] 응답 시간 확인 (< 500ms)
├─ [ ] 리소스 사용 확인
├─ [ ] 사용자 피드백 수집
└─ [ ] 문제 발생 여부 확인

배포 후 24시간 (최종 검증)
──────────────────────────

최종 검증
├─ [ ] 모든 기능 정상 작동 확인
├─ [ ] 데이터 무결성 검증
├─ [ ] 성능 기준 충족 확인
├─ [ ] 보안 체크 완료
└─ [ ] 최종 성공 보고서 작성
```

---

## 11. 다음 단계 (Next Steps)

### 즉시 실행 (이 주)

```
1️⃣ Phase 1 시작 (환경 설정)
   └─ server-laravel/ 폴더 생성 및 Laravel 초기화

2️⃣ API 명세서 작성 시작
   └─ 기존 PHP API 상세 분석

3️⃣ error-fixes/ 폴더 정리
   └─ 현재까지의 모든 에러 수정 문서화
```

### 확인이 필요한 사항

```
✅ 확인 완료
├─ PHP 버전 production 안정성 확인
├─ Database (Cloud SQL) 연결 확인
├─ GitHub Actions 배포 프로세스 확인
└─ 현재 운영 구조 안정성

❓ 추가 확인 필요
├─ 로컬 MySQL 설치 및 구성 (필요한 경우)
├─ Laravel 개발 환경 권한 확인
├─ 저장소 용량 확인 (server-laravel/ 추가)
└─ 팀원의 개발 환경 준비 여부
```

---

## 12. 연락처 및 지원

### 질문 또는 문제 발생 시

```
📝 문서 확인
├─ CLAUDE.md - 개발 원칙
├─ PROJECT_STATUS.md - 현재 상황
├─ API_SPECIFICATION.md - API 명세서 (작성 예정)
└─ 각 Phase별 생성 문서

🆘 문제 해결
├─ 로컬 환경 문제 → Laravel 설정 가이드
├─ API 연동 문제 → API 명세서 참고
├─ 테스트 실패 → 테스트 전략 검토
├─ 배포 문제 → 배포 절차 검토
└─ 데이터 문제 → 데이터 마이그레이션 계획 참고

📊 진행 상황 추적
├─ 주간 체크리스트 검토
├─ 일일 진행 상황 기록
├─ 주간 회의 (선택)
└─ PROJECT_STATUS.md 정기 업데이트
```

---

**작성자**: Claude AI  
**작성일**: 2026년 8월 7일  
**상태**: 📋 계획 수립 완료  
**다음 단계**: Phase 1 (준비) 시작 준비  

이 워크플로우 계획은 리빙 문서이며, 필요에 따라 수정 및 보완될 수 있습니다.  
각 Phase를 진행하면서 새로운 발견사항이 있으면 즉시 업데이트하세요.
