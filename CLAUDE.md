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

---

## 9. 확정된 설계 원칙 (2026-08-25 추가)

이 절은 작업하며 확정된 규칙이다. **위의 1~8절 내용은 그대로 유효하며 여기서 덮지 않는다.**

### 9-1. 사람과 회사를 우리 DB에 묶지 않는다

담당자는 이직한다. 소속을 룸체크 DB에 저장해 두면 니르바나는 최신인데 우리만 옛 정보를 들고 있게 된다.

- **원본은 니르바나.** 부계정 로그인 응답의 `parent_idx`가 그 사람의 현재 소속이다
- **필요할 때 읽는다.** 목록을 고르는 순간 API를 부르고 캐시만 한다
- **요청 저장 시 이름을 문자열로 박는다.** 과거 요청은 그때의 회사·담당자로 영원히 남는다

`requests` 테이블의 `agency_name` / `agency_parent_name`이 이 스냅샷이다. **이 값은 나중에 갱신하지 않는다.**

### 9-2. 컬럼 이름은 API 필드명을 따른다

니르바나가 `parent_idx`로 주므로 우리도 `agency_parent_idx`를 쓴다. `users`와 `requests`가 같은 이름을 쓴다. 업무 용어로는 "파트너"가 더 맞지만, 값이 어디서 왔는지 추적할 수 있는 쪽을 택했다.

### 9-3. 지역은 약어를 쓰지 않는다

API가 `PK`, `KL`, `KI-PK` 같은 코드로 준다. 화면에는 **절대 노출하지 않는다.** `canonRegion()`이 코드·한글명·영문명·합성코드를 전부 풀네임으로 바꾼다. 끝내 못 알아본 약어는 빈 값으로 감춘다.

표시 언어는 **역할이 아니라 실제로 고른 언어**를 따른다(`isEN()`). 한글 이름이 없으면 영어로 내린다.

### 9-4. 직원의 관할지역은 권역이다

단일 지역이 아니라 여러 지역을 묶은 권역이다.

```
krabi   = 카오락 + 푸켓 + 크라비
bangkok = 방콕 + 파타야
표에 없는 지역(사무이 등) = krabi 담당
```

요청이 걸친 권역은 **저장하지 않고 읽을 때 행에서 계산한다**(`requestZones()`). 그래야 이미 쌓인 요청도 규칙 변경이 즉시 반영된다. 한 요청이 두 권역에 걸치면 양쪽 담당자 모두에게 보인다. **관할지역을 정하지 않은 직원은 제한 없이 전부 본다** — 안 보여서 놓치는 손해가 더 크다.

### 9-5. 상태 색은 예약색이다

`--av #2F7A55` · `--rq #B07908` · `--so #AE4238`은 룸체크 상태 전용이다. **버튼·태그·탭에 쓰지 않는다.**

### 9-6. 입력칸은 "선택 또는 직접 입력"이다

호텔·룸타입·담당자 칸은 목록에서 고르거나 직접 칠 수 있다.

- ▾ 를 누르거나 칸을 누르면 **이미 고른 값과 무관하게 전체**를 보여준다
- 친 게 있으면 친 대로 살리고, 빈 채로 나갈 때만 원래 값으로 되돌린다
- 한글·영문 어느 쪽으로 쳐도 찾는다
- ▾ 로 열 때는 **입력칸에 포커스를 주지 않는다**. 아이폰에서 키보드가 뜨면 사파리가 화면을 옆으로 밀어 틀이 쏠린다
- 목록은 `position:fixed`로 화면에 얹는다. 문서 안에 두면 넘칠 때 페이지가 넓어진다

### 9-7. 룸타입은 한 곳에서만 파싱한다

목록 응답과 상세 응답이 같은 규칙을 쓰도록 `parseRooms()` 하나로 모았다.

```
active='Y' · del≠'Y' · view≠'N' 만
name_kr 우선, 없으면 영문
RT_EN / RT_KO 상호 매핑 (언어 전환·교차 검색)
sort 순서, 중복 제거
```

### 9-8. 비밀번호는 니르바나에서만 관리한다

룸체크는 부계정 비밀번호를 **저장하지 않는다**(`pass_hash='!agency-external-auth'`). 변경·분실 시 니르바나에 재발급을 요청한다. 룸체크에서 비밀번호를 바꾸는 기능은 만들지 않는다.

### 9-9. 저장소에 올리는 것과 올리지 않는 것

```
최상위에 두고 공유    CLAUDE.md · PROJECT_STATUS.md · README.md
private/ 로 분리      지난 작업 기록·개인 메모 (git 제외)
git 제외              *.sqlite · .env · 모든 백업 파일(*.bak* *.backup* *.old ...)
```

`server/public/`은 **웹 루트**다. 여기 두는 파일은 주소만 알면 누구나 받을 수 있다. 백업 파일을 이 폴더에 만들지 않는다.

### 9-10. 모바일 기준

분기점은 **440px**이다. 400px이던 시절 아이폰 에어(402px)가 조건을 벗어나 데스크톱 설정을 받으면서 좌우가 비고 라벨이 두 줄로 감겼다. 360px 이하는 별도 tier로 기존 크기를 지킨다.

라벨에 `(선택·입력)` 같은 안내 문구를 넣지 않는다. 열이 좁아 두 줄로 감긴다.

### 9-11. "현재 상태 저장해" 의 뜻 (2026-08-25 확정)

**프로젝트 폴더**: `~/nirvana_project/hotel roomcheck`

이 프로젝트에서 사용자가 **"현재 상태 저장해"**, **"상태 저장"**, **"저장해둬"** 라고 하면
**`PROJECT_STATUS.md` 를 갱신하라는 뜻이다.** 대화 요약이나 별도 메모 파일이 아니다.

갱신할 때는 7개 절 구조를 그대로 유지한다.

```
1. 완료된 기능
2. 수정한 파일과 수정 내용
3. 아직 해결하지 못한 오류
4. 현재 확정된 계산 공식
5. 테스트 결과
6. 다음에 해야 할 작업
7. 절대로 변경하면 안 되는 기존 기능
```

- 기존 내용을 지우지 않는다. 완료된 항목은 6절에서 "완료" 로 내리고 1절에 근거를 남긴다
- 이전 기록이 사실과 다르면 지우지 말고 **정정 항목을 3절에 추가**한다
- 갱신 전 원본을 `_to_delete/misc/` 에 백업한다
- 갱신 후 `docs:` 커밋으로 남긴다

다른 프로젝트는 규칙이 다를 수 있으므로 이 규칙은 위 폴더에만 적용한다.
