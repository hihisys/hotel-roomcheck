# Phase 1: 호텔 룸첵 폴더 정리 지침서

**진행 날짜**: 2026년 8월 7일  
**목표**: 구버전 파일을 OLD/ 폴더로 정리하여 구조 명확화

---

## 📋 **정리 대상 확인**

### 🔴 이동할 파일/폴더 (OLD/로 이동)

#### 1️⃣ 루트 `deploy-to-cloud-run07-30.yml`
```
위치: 호텔 룸첵/deploy-to-cloud-run07-30.yml
→ 이동: 호텔 룸첵/OLD/deploy-to-cloud-run07-30.yml.backup
사유: 구버전 배포 설정 (live/.github/workflows/ 의 신버전이 실제 사용 중)
```

#### 2️⃣ 루트 `/public/` 폴더 전체
```
파일 개수: 14개
- admin.html (48.2 KB)
- agent.html (1.4 KB)
- app.js (92.3 KB)
- check.html (1.5 KB)
- i18n.js (39.6 KB)
- index.html (1 KB)
- index.php (960 B)
- login.html (10.6 KB)
- logo.png (16.2 KB)
- myoffdays.html (13.2 KB)
- profile.html (19.4 KB)
- request.html (1.5 KB)
- style.css (29.6 KB)
- .htaccess (289 B)

→ 이동: 호텔 룸첵/OLD/ARCHIVED_PUBLIC_ROOT/
사유: 구버전 (server/public/이 신버전으로 실제 배포 중)
```

#### 3️⃣ 루트 `/src/` 폴더
```
→ 이동: 호텔 룸첵/OLD/ARCHIVED_SRC_ROOT/
사유: 구버전 (server/src/이 신버전으로 실제 배포 중)
```

---

## ✅ **유지할 폴더/파일**

### 루트에 유지할 폴더
```
✅ live/              (GitHub 저장소 - CI/CD 설정)
✅ server/            (현재 운영 폴더 - 배포되는 코드)
✅ claude/            (AI 작업 파일)
✅ harness/           (테스트 & 스킬)
✅ OLD/               (백업 아카이브)
✅ public/ ❌         → OLD/ARCHIVED_PUBLIC_ROOT/로 이동
✅ src/ ❌            → OLD/ARCHIVED_SRC_ROOT/로 이동
```

### 루트에 유지할 파일
```
✅ CLAUDE.md
✅ PROJECT_STATUS.md
✅ README.md
✅ Dockerfile (배포용)
✅ SETUP_WIF_GITHUB_ACTIONS.md
✅ setup-wif-github-actions.sh
✅ DEPLOYMENT_SUCCESS_2026-07-28.md
✅ DEPLOYMENT_WIF_SETUP_2026-07-27.md
✅ .github/ (폴더)
✅ .git/ (폴더)
✅ .gitignore
✅ .dockerignore
✅ 텔레그램 ID 권한 자료.xlsx

❌ deploy-to-cloud-run07-30.yml → OLD/로 이동
```

---

## 🎯 **정리 단계별 진행**

### Step 1: OLD 폴더 내 서브폴더 생성
```
Finder에서:
호텔 룸첵/OLD/ 폴더 열기
  ├─ 우클릭 → "새 폴더"
  ├─ 이름: ARCHIVED_PUBLIC_ROOT
  │
  └─ 우클릭 → "새 폴더"
     이름: ARCHIVED_SRC_ROOT
```

### Step 2: 루트 public/ 폴더 이동
```
Finder에서:
호텔 룸첵/ 폴더 열기
  ├─ public/ 폴더 선택
  ├─ 우클릭 → "이동" (또는 Command+Option+V)
  └─ OLD/ARCHIVED_PUBLIC_ROOT/ 에 붙여넣기
```

### Step 3: 루트 src/ 폴더 이동
```
Finder에서:
호텔 룸첵/ 폴더 열기
  ├─ src/ 폴더 선택
  ├─ 우클릭 → "이동" (또는 Command+Option+V)
  └─ OLD/ARCHIVED_SRC_ROOT/ 에 붙여넣기
```

### Step 4: deploy-to-cloud-run07-30.yml 파일 이동
```
Finder에서:
호텔 룸첵/ 폴더 열기
  ├─ deploy-to-cloud-run07-30.yml 선택
  ├─ 우클릭 → "이동" (또는 Command+Option+V)
  └─ OLD/ 에 붙여넣기

또는 이름 변경:
  └─ deploy-to-cloud-run07-30.yml.backup
```

---

## ✨ **완료 후 예상 구조**

```
호텔 룸첵/ (정리 완료)
│
├── 📂 live/                          ✅ GitHub 저장소
│   ├── .github/workflows/
│   │   └── deploy-to-cloud-run.yml   (asia-southeast1)
│   └── (GitHub 저장소)
│
├── 📂 server/                        ✅ 현재 운영 (배포)
│   ├── 📂 public/                   (신버전 프론트엔드)
│   ├── 📂 src/                      (신버전 백엔드)
│   ├── 📂 data/
│   ├── Dockerfile
│   ├── mock_agency.php
│   └── DEPLOY.md
│
├── 📂 claude/                        🤖 AI 작업
├── 📂 harness/                       🧪 테스트
│
├── 📂 OLD/                           📦 백업 아카이브
│   ├── 📂 ARCHIVED_PUBLIC_ROOT/     (루트 public/ 백업)
│   ├── 📂 ARCHIVED_SRC_ROOT/        (루트 src/ 백업)
│   ├── deploy-to-cloud-run07-30.yml.backup
│   ├── hotel-roomcheck.zip
│   ├── server_deploy.tar.gz
│   └── room-check-v16.html
│
├── 📄 CLAUDE.md                      개발 원칙
├── 📄 PROJECT_STATUS.md              프로젝트 현황
├── 📄 README.md                      프로젝트 개요
├── 📄 Dockerfile                     배포용
├── 📄 SETUP_WIF_GITHUB_ACTIONS.md
├── 📄 setup-wif-github-actions.sh
├── 📄 DEPLOYMENT_SUCCESS_2026-07-28.md
├── 📄 DEPLOYMENT_WIF_SETUP_2026-07-27.md
├── 📂 .github/
├── 📂 .git/
├── 📄 .gitignore
├── 📄 .dockerignore
├── 📄 .DS_Store
└── 📄 텔레그램 ID 권한 자료.xlsx
```

---

## ⏱️ **예상 소요 시간**
- Step 1 (폴더 생성): 1분
- Step 2 (public/ 이동): 2분
- Step 3 (src/ 이동): 1분
- Step 4 (파일 이동): 1분
- **총 예상**: 5분

---

## ✅ **완료 확인**

정리 완료 후 다음을 확인하세요:

- [ ] 루트에 `/public/` 폴더 없음
- [ ] 루트에 `/src/` 폴더 없음
- [ ] 루트에 `deploy-to-cloud-run07-30.yml` 없음
- [ ] `OLD/ARCHIVED_PUBLIC_ROOT/` 에 14개 파일 있음
- [ ] `OLD/ARCHIVED_SRC_ROOT/` 에 src 파일들 있음
- [ ] `server/` 폴더는 그대로 있음 ✅
- [ ] `live/` 폴더는 그대로 있음 ✅

---

**준비 완료! 이제 위 단계대로 Finder에서 진행하세요.** 🚀
