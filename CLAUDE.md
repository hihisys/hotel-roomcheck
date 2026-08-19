# CLAUDE.md — 호텔 룸첵 개발 원칙 (최종 확정)

**프로젝트명**: Hotel Roomcheck with Agency API Integration  
**최종 갱신**: 2026년 8월 7일  
**상태**: ✅ 폴더 정리 완료 & 운영 구조 명확화

---

## 1. 프로젝트 기본 규칙 (MUST DO)

### ✅ 필수 준수 사항

#### 폴더 구조 (정리 완료)
```
호텔 룸첵/
├── 📂 server/                   ⭐ 현재 운영 폴더 (배포 대상)
│   ├── 📂 public/              신버전 프론트엔드 (배포됨)
│   ├── 📂 src/                 신버전 백엔드 (배포됨)
│   ├── 📂 data/                데이터 폴더
│   ├── Dockerfile
│   ├── mock_agency.php
│   └── DEPLOY.md               배포 가이드
│
├── 📂 live/                     ⭐ GitHub 저장소 (CI/CD)
│   ├── .github/workflows/
│   │   └── deploy-to-cloud-run.yml  (asia-southeast1 ✅)
│   └── (GitHub 저장소 동기화)
│
├── 📂 OLD/                      📦 백업 아카이브
│   ├── 📂 ARCHIVED_PUBLIC_ROOT/ (루트 구버전 public)
│   ├── 📂 ARCHIVED_SRC_ROOT/    (루트 구버전 src)
│   ├── deploy-to-cloud-run07-30.yml.backup
│   ├── hotel-roomcheck.zip
│   └── 기타 백업 파일들
│
├── 📂 claude/                   🤖 AI 작업 파일
├── 📂 harness/                  🧪 테스트/스킬
│
└── 📄 주요 문서들
    ├── CLAUDE.md                (본 파일 - 개발 원칙)
    ├── PROJECT_STATUS.md        (현황 및 다음 작업)
    ├── README.md                (간단 설명)
    ├── Dockerfile               (배포용)
    ├── SETUP_WIF_GITHUB_ACTIONS.md
    └── 기타 배포 관련 문서
```

#### 개발 원칙
- **운영 폴더**: `server/` 폴더만 수정 및 배포
  - `server/public/` → 신버전 프론트엔드 (HTML, CSS, JS)
  - `server/src/` → 신버전 백엔드 (PHP)
  - `server/data/` → 데이터 폴더

- **GitHub 저장소**: `live/` 폴더 (자동 동기화)
  - CI/CD 파이프라인: GitHub Actions
  - 배포 자동화: main 브랜치 push
  - 배포 리전: **asia-southeast1 (싱가포르)** ✅

- **백업**: `OLD/` 폴더
  - `OLD/ARCHIVED_PUBLIC_ROOT/` → 루트 구버전 public
  - `OLD/ARCHIVED_SRC_ROOT/` → 루트 구버전 src
  - `OLD/` → 구버전 배포 설정 파일 및 압축 백업

#### 배포 원칙
- 모든 수정은 **`server/` 폴더에서만** 진행
- 변경 전 관련 파일 전체를 먼저 검토
- 수정 내용은 `PROJECT_STATUS.md`에 기록
- 배포: GitHub push → 자동 배포 (약 3-5분)
- 배포 결과는 `DEPLOYMENT_SUCCESS_*.md`에 기록

#### 결과 파일 관리
- 새로운 버전은 기존 파일을 덮어쓰지 않음
- 주요 수정 내용은 배포 노트에 남김
- 구버전은 `OLD/` 폴더에서만 관리

---

## 2. 금지 사항 (MUST NOT DO)

### ❌ 절대 금지

#### 폴더/파일 조작
```
❌ 루트에서 /public/, /src/ 폴더 생성/수정
   (이미 정리됨 - OLD/에 백업됨)

❌ 구버전과 신버전 파일 동시 배포
   - server/ 폴더의 내용만 배포 대상
   - 루트 public/src는 배포되면 안 됨
   - OLD/ 폴더 파일은 절대 배포 금지

❌ OLD/ 폴더 파일 실제 운영에 사용
   - 백업 목적으로만 유지
   - 참고용으로만 접근 가능
```

#### 배포 설정
```
❌ GitHub Actions 워크플로우 핵심 변경 금지
❌ Docker 이미지 기본 구조 변경 금지
❌ Cloud Run 인증 방식 변경 금지 (WIF는 필수)
❌ 배포 리전 임의 변경 금지 (asia-southeast1 확정)
```

#### 기존 기능
```
❌ 에이전트 부계정 생성 로직 임의 변경
❌ 권한 체계 변경
❌ 데이터 격리 메커니즘 변경
❌ API 인터페이스 변경
```

---

## 3. 개발 체크리스트

### 새 세션 시작 시
```
1. CLAUDE.md 읽기 (개발 원칙) ← 현재 파일
2. PROJECT_STATUS.md 읽기 (현황 파악)
3. 현재 코드와 문서 내용이 일치하는지 확인
4. PROJECT_STATUS.md의 "다음에 해야 할 작업" 진행
5. 기존 기능은 임의로 변경하지 않기
```

### 코드 수정 전
- [ ] 수정할 파일이 `server/` 폴더에 있는지 확인
- [ ] 백업 확인 (이미 `OLD/`에 보관되어 있나)
- [ ] 관련 파일들을 모두 검토했는지 확인
- [ ] 수정 내용을 간단히 메모

### 수정 후
- [ ] 변경 파일 목록 작성
- [ ] 간단한 테스트 (로그인, API 호출 등)
- [ ] GitHub에 commit & push
- [ ] GitHub Actions 배포 완료 확인 (3-5분)
- [ ] `PROJECT_STATUS.md` 갱신
- [ ] 배포 결과 기록

---

## 4. 현재 시스템 구성

### 기술 스택
| 항목 | 값 | 상태 |
|------|-----|------|
| **Language** | PHP 8.4 | ✅ |
| **Server** | Apache | ✅ |
| **Database** | Cloud SQL (MySQL) | ✅ |
| **Deployment** | Google Cloud Run | ✅ |
| **Region** | **asia-southeast1 (싱가포르)** | ✅ 확정 |
| **CI/CD** | GitHub Actions | ✅ |
| **Authentication** | WIF (Workload Identity Federation) | ✅ |

### 운영 현황
- **서비스명**: hotel-roomcheck-356950571433
- **배포 상태**: ✅ 운영 중 (2026-07-28 배포)
- **접속 URL**: https://hotel-roomcheck-356950571433.asia-southeast1.run.app/
- **메모리**: 512Mi
- **포트**: 8080
- **Auto-scaling**: 1-100 replicas
- **업타임**: 연속 운영 중

### API 연동
- AGENCY_API: https://nirvana835.mycafe24.com
- HOTEL_API: https://nirvana835.mycafe24.com
- 인증: 에이전트 부계정 자동채우기 시스템

### 다국어 지원
- ✅ 한국어 (ko)
- ✅ English (en)
- ✅ ไทย (th)

---

## 5. 배포 프로세스

```
로컬 수정 (server/ 폴더)
         ↓
Git 커밋 & Push (main 브랜치)
         ↓
GitHub Actions 자동 트리거
         ↓
Docker 이미지 빌드 (23초)
         ↓
Google Container Registry 푸시 (36초)
         ↓
Google Cloud Run 배포 (26초)
         ↓
✅ 서비스 업데이트 (총 2-3분)
```

### 간단한 배포 명령
```bash
# 1. 로컬에서 수정 (server/ 폴더에서만)
# 예: server/public/admin.html 수정

# 2. Git 커밋
cd ~/호텔 룸첵/live
git add .
git commit -m "Update: admin page UI improvement"

# 3. GitHub 푸시 (자동 배포)
git push origin main

# ✅ 완료! (배포는 자동으로 진행 - 약 3-5분)
```

### 배포 모니터링
1. GitHub 저장소 → Actions 탭
2. Deploy to Cloud Run 워크플로우 확인
3. 실시간 로그 보기
4. 배포 완료 후 https://cloud.google.com/run 에서 확인

---

## 6. 파일 위치 참고

### ✅ 수정 대상 (이곳만 수정)
```
server/
├── public/
│   ├── index.html
│   ├── admin.html
│   ├── login.html
│   ├── app.js
│   └── style.css
├── src/
│   ├── index.php
│   └── (기타 PHP 파일)
└── data/
```

### ❌ 수정 금지 (백업본)
```
OLD/ARCHIVED_PUBLIC_ROOT/   ← 루트 구버전 (수정 금지)
OLD/ARCHIVED_SRC_ROOT/      ← 루트 구버전 (수정 금지)
OLD/                        ← 아카이브 (참고만 가능)
```

### 📂 보조 폴더
```
live/            ← GitHub 저장소 (자동 동기화)
claude/          ← AI 작업 파일
harness/         ← 테스트 & 스킬 정의
```

---

## 7. 주요 변경사항 (2026-08-07)

### ✅ Phase 1-3 완료
- [x] 폴더 중복 정리 완료
- [x] 구버전 파일 OLD/ 으로 이동
- [x] 배포 리전 확인 (asia-southeast1 ✅)
- [x] 운영 구조 명확화

### ✅ 최종 정리 상태
- [x] 루트 /public/ → OLD/ARCHIVED_PUBLIC_ROOT/
- [x] 루트 /src/ → OLD/ARCHIVED_SRC_ROOT/
- [x] 루트 deploy-to-cloud-run07-30.yml → OLD/
- [x] server/ 폴더 확인 (현재 운영)
- [x] live/ 폴더 확인 (GitHub)
- [x] 폴더 구조 정확화

---

## 8. 문의 & 참고

**더 알아보기**:
- `PROJECT_STATUS.md` → 현황 및 다음 작업
- `server/DEPLOY.md` → 배포 상세 가이드
- `DEPLOYMENT_SUCCESS_2026-07-28.md` → 마지막 배포 기록

**문제 발생 시**:
- GitHub Actions 로그 확인
- Cloud Run 서비스 상태 확인
- `PROJECT_STATUS.md`의 "해결하지 못한 오류" 참고

---

**최종 갱신**: 2026년 8월 7일  
**작성**: Claude AI  
**상태**: ✅ 폴더 정리 완료 및 운영 구조 확정  
**다음 세션**: PROJECT_STATUS.md 참고
