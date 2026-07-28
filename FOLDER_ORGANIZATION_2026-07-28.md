# 호텔 룸첵 폴더 정리 가이드 📁

**작성일**: 2026년 7월 28일

## 📊 현재 폴더 상태 분석

### 🗂️ 루트 디렉토리 구조

```
호텔 룸첵/
├── 📂 live/                          ✅ 현재 운영 (GitHub 저장소)
│   ├── .github/workflows/            → GitHub Actions 워크플로우
│   ├── Dockerfile                    → Cloud Run용 Docker
│   └── claude/                       → 배포 문서
├── 📂 server/                        ✅ 현재 운영 (백엔드)
│   ├── public/                       → 최신 프론트엔드 파일들
│   ├── src/                          → PHP 백엔드 코드
│   └── DEPLOY.md                     → 배포 가이드
├── 📂 claude/                        ✅ Claude AI 작업 파일
│   ├── DEPLOYMENT_WIF_SETUP_*.md
│   ├── SETUP_WIF_GITHUB_ACTIONS.md
│   └── setup-wif-github-actions.sh
├── 📂 harness/                       ✅ 테스트/스킬 정의
│   ├── agents/
│   └── skills/
├── 📂 OLD/ (새로 만들 폴더)          ❌ 구형 파일들
│   ├── admin.html
│   ├── app.js
│   ├── agent.html
│   ├── check.html
│   ├── i18n.js
│   ├── index.html
│   ├── login.html
│   ├── logo.png
│   ├── myoffdays.html
│   ├── profile.html
│   ├── request.html
│   ├── room-check-v16.html
│   ├── style.css
│   ├── server.js
│   ├── 로컬서버시작.command
│   ├── hotel-roomcheck.zip
│   └── server_deploy.tar.gz
└── 📄 최신 배포 파일들
    ├── DEPLOYMENT_SUCCESS_2026-07-28.md
    ├── DEPLOYMENT_WIF_SETUP_2026-07-27.md
    ├── SETUP_WIF_GITHUB_ACTIONS.md
    └── setup-wif-github-actions.sh
```

## 📝 정리할 파일 목록

### 🗑️ OLD 폴더로 이동할 파일

**구형 프론트엔드 파일** (server/public에 최신 버전이 있음):
- `admin.html` - 구형 관리자 페이지
- `agent.html` - 구형 에이전트 페이지
- `check.html` - 구형 체크 페이지
- `index.html` - 구형 인덱스
- `login.html` - 구형 로그인 페이지
- `myoffdays.html` - 구형 휴무일 페이지
- `profile.html` - 구형 프로필 페이지
- `request.html` - 구형 요청 페이지
- `app.js` - 구형 JavaScript 파일
- `i18n.js` - 구형 국제화 파일
- `style.css` - 구형 스타일 파일
- `logo.png` - 로고 이미지
- `room-check-v16.html` - 구형 버전 파일

**로컬 개발 파일**:
- `server.js` - 로컬 서버 파일
- `로컬서버시작.command` - 로컬 서버 시작 스크립트

**압축 백업 파일**:
- `hotel-roomcheck.zip` - 프로젝트 압축 파일
- `server_deploy.tar.gz` - 서버 배포 압축 파일

### ✅ 루트에 유지할 파일

**배포 문서** (최신):
- `DEPLOYMENT_SUCCESS_2026-07-28.md` - 배포 성공 현황
- `DEPLOYMENT_WIF_SETUP_2026-07-27.md` - WIF 설정 현황
- `SETUP_WIF_GITHUB_ACTIONS.md` - WIF 설정 가이드
- `setup-wif-github-actions.sh` - 자동 설정 스크립트

## 📋 정리 절차 (Finder에서 수동 진행)

### 1단계: OLD 폴더 생성
```
호텔 룸첵/ 
└── OLD/ (새 폴더 생성)
```

### 2단계: 파일 이동 (Drag & Drop 또는 Cut & Paste)

#### 구형 HTML/CSS/JS 파일 이동
```
admin.html → OLD/
agent.html → OLD/
check.html → OLD/
index.html → OLD/
login.html → OLD/
myoffdays.html → OLD/
profile.html → OLD/
request.html → OLD/
room-check-v16.html → OLD/
app.js → OLD/
i18n.js → OLD/
style.css → OLD/
logo.png → OLD/
```

#### 로컬 서버 파일 이동
```
server.js → OLD/
로컬서버시작.command → OLD/
```

#### 백업 파일 이동
```
hotel-roomcheck.zip → OLD/
server_deploy.tar.gz → OLD/
```

### 3단계: 불필요한 파일 정리
```
.DS_Store 삭제 (또는 OLD로 이동)
```

## ✨ 정리 후 예상 구조

```
호텔 룸첵/
├── 📂 live/                          (GitHub 저장소 - 운영 중)
├── 📂 server/                        (백엔드 서버 - 운영 중)
├── 📂 claude/                        (Claude AI 작업)
├── 📂 harness/                       (테스트/스킬)
├── 📂 OLD/                           (구형 파일 아카이브)
├── 📄 DEPLOYMENT_SUCCESS_2026-07-28.md       (배포 성공 현황)
├── 📄 DEPLOYMENT_WIF_SETUP_2026-07-27.md     (WIF 설정 현황)
├── 📄 SETUP_WIF_GITHUB_ACTIONS.md            (WIF 설정 가이드)
└── 📄 setup-wif-github-actions.sh            (자동 설정 스크립트)
```

## 🎯 정리 목표

✅ **명확한 구조**
- 현재 운영 중인 디렉토리와 구형 파일 분리
- 최신 배포 문서 한눈에 확인 가능

✅ **쉬운 유지보수**
- server/ : 백엔드 API
- live/ : 프론트엔드 + 배포 설정
- claude/ : AI 작업 기록
- OLD/ : 과거 버전 아카이브

✅ **빠른 접근**
- 운영 중인 파일들이 루트에 명확히 표시
- 배포 관련 문서들이 한 곳에 정리

## 📞 정리 팁

### Finder에서 효율적으로 정리하기

1. **선택 다중 선택**
   - Cmd 키 누른 상태에서 여러 파일 선택
   - 또는 Shift 키로 범위 선택

2. **빠른 이동**
   - 선택한 파일들 우클릭 → "이동" 선택
   - 또는 Command+Option+V로 이동

3. **그룹화**
   - 비슷한 파일들을 한 번에 이동
   - 구형 HTML 5개 → 로컬 파일 2개 → 백업 파일 2개 순서로

## ✅ 정리 완료 체크리스트

- [ ] OLD 폴더 생성
- [ ] 구형 HTML 파일 13개 이동
- [ ] 로컬 서버 파일 2개 이동
- [ ] 백업 압축 파일 2개 이동
- [ ] .DS_Store 정리
- [ ] 최신 배포 문서 4개 루트에 확인
- [ ] 폴더 구조 검증

## 🎉 정리 후 이점

✅ 폴더가 깔끔하고 체계적
✅ 현재 운영 파일과 구형 파일 명확히 분리
✅ 새로운 개발자도 쉽게 이해 가능
✅ 배포 문서를 쉽게 찾을 수 있음
✅ 백업 파일도 보존하면서 숨김

---

**작성자**: Claude AI  
**상태**: 정리 계획 완료 - 사용자 수동 실행 필요  
**예상 소요 시간**: 5-10분 (Finder에서)
