# PROJECT_STATUS.md — 현재 진행 상황

**최종 갱신**: 2026-08-26 00:24 (부계정 소속명 세션·요청 스냅샷 저장)

> ~~이전 기록: 커밋 5개가 push되지 않음~~ → 2026-08-26 확인 결과 `main`과
> `origin/main`이 동기화되었고, 아래 부계정 개선 커밋 2개도 원격에 반영되어 있다.
**배포 URL**: https://hotel-roomcheck-356950571433.asia-southeast1.run.app/

> 새 세션은 `CLAUDE.md`(변하지 않는 개발 원칙)를 먼저 읽고, 이 문서의
> **6. 다음에 할 일**부터 이어서 진행한다. 기존 기능을 임의로 지우거나 바꾸지 않는다.

---

## 1. 완료된 기능

### 호텔 · 룸타입 · 지역 입력
- 지역을 바꾸면 호텔·룸타입이 자동으로 비워진다 (기본·추가·추천 세 곳 모두)
- 호텔 이름 빨리 찾기 — 한글·영문, 띄어쓰기·대소문자 무시. 한 글자부터 걸러 준다
- ▾ 를 누르면 이미 고른 값과 무관하게 등록된 전체 목록이 다시 열린다
- 목록은 화면 언어 기준으로 정렬 (한글 ㄱㄴㄷ / 영문 A→Z). 룸타입은 API `sort` 순서를 지킨다
- 호텔을 고르면 지역이 자동 선택되고 룸타입을 받아온다
- 목록 응답의 `room_types` 를 사용 — 있으면 상세 API 를 부르지 않는다

### 언어
- `isEN()` 이 역할이 아니라 **실제로 고른 언어**를 따른다
- 지역·호텔·룸타입 모두 언어를 따르고, 한글이 없으면 영어로 내린다
- 지역 약어(`PK`, `KL`, `KI-PK`)는 어떤 경우에도 노출되지 않는다

### 에이전트 · 담당자
- 에이전트를 고르면 그 에이전시의 담당자만 나온다 (에이전시 상세 API 의 `managers`)
- `AG_DEL_YN='Y'` 담당자는 제외. 목록에 없는 사람은 직접 입력 가능
- API 실패 시 기존 입력 이력으로 폴백

### 관할권역 (중요 — 실제 장애였다)
서버가 지역으로 요청을 걸렀는데 **요청에 지역을 넣는 코드가 없어** 값이 늘 비어 있었다.
그 결과 직원은 **자기가 만든 요청만** 볼 수 있었다 (확인자에게 에이전트 요청이 안 넘어감).
호텔 지역에서 권역을 뽑아내도록 고쳤고, 읽을 때 계산하므로 기존 요청도 살아난다.

### 알림
- 조건에 맞는 직원 수만큼 중복 삽입되던 것을 권역별 1건으로
- `notifications.zone` 칼럼 추가 — 자기 권역 알림만 받는다

### requests 테이블 에이전시 칼럼 (2026-08-25)
```
agency_idx          BIGINT NULL        요청을 넣은 부계정 idx
agency_name         VARCHAR(120) NULL  그 사람 이름       ← 저장 시점 스냅샷
agency_parent_idx   BIGINT NULL        소속 에이전시 idx
agency_parent_name  VARCHAR(190) NULL  에이전시 이름      ← 저장 시점 스냅샷
```
- **새 요청에만 채운다.** 기존 요청은 비워 둔다 (사용자 결정)
- 부계정 직접 등록은 로그인 세션의 4개 값으로 저장하고, 직원의 대신 등록만 브라우저 선택값 사용
- `currentUser()` SELECT 에 `agency_parent_idx` / `agency_kind` 를 추가해야 했다 (빠져 있었음)
- 부계정 로그인 API의 `parent_agent_name`을 `agency` 세션에 함께 보관
- 로그인한 부계정은 화면 우측 상단에 `parent_agent_name · 사용자명`으로 표시

### 부계정 로그인 세션 (2026-08-26)
- 니르바나 로그인 응답의 `idx` · `name` · `parent_idx` · `parent_agent_name`을 세션에 보관
- 보조 필드 `kind` · `login_id` · `nickname`도 기존처럼 세션에 함께 보관
- `api/me`의 `user.agency`로 프론트에 전달하며 비밀번호는 세션·응답·DB 어디에도 저장하지 않음
- 에이전트가 직접 요청을 등록하면 서버가 브라우저 입력값보다 로그인 세션을 우선하여
  `agency_idx` · `agency_name` · `agency_parent_idx` · `agency_parent_name`에 스냅샷 저장
- 직원이 대신 등록할 때만 화면에서 선택한 에이전시 값을 사용
- 변경 전 로그인한 세션에는 새 필드가 없으므로 적용 확인 시 로그아웃 후 다시 로그인해야 함

### 화면
- 모바일 분기점 400px → 440px. 아이폰 에어(402px)가 데스크톱 설정을 받던 문제
- 좌우로 버려지는 폭 64px → 32px, 글씨 확대 (입력 15px / 라벨 11.5px)
- 라벨의 `(선택·입력)` 안내 문구 제거
- 목록 열 때 화면이 왼쪽으로 쏠리던 문제 (아이폰 사파리)
- 비밀번호 안내를 니르바나 재발급 방식으로 (한/영/태)
- 0바이트로 깨져 있던 `logo.png` 복구

### 저장소 정리
- `private/` 로 개인 작업 메모 분리 (git 제외)
- `.gitignore` 신규 생성 — sqlite · `.env` · 모든 백업 파일
- 백업 파일 15개를 git 추적에서 제외 (파일은 디스크에 남음)

### 저장소 · 배포 이미지 정리 (2026-08-25)
`Dockerfile` 이 `COPY . /var/www/html/` 로 폴더 전체를 복사하는데 `.dockerignore` 가
`data/` 한 줄뿐이라, 쓰지 않는 파일이 전부 이미지에 실려 나가고 있었다.

- **`server-laravel`, `server-laravel.backup.1786125886` 제거 — 합계 178MB**
  현재 구조는 PHP 8.4 + Apache 이고 참조하는 코드가 없다. 매 배포마다 실려 나갔다
- **`live/` 제거** — 같은 GitHub 저장소를 폴더 안에 한 번 더 clone 한 중첩 저장소(13MB).
  `.gitmodules` 매핑이 없어 서브모듈도 아니었다. 마지막 fetch 가 8/20 이라 46커밋
  뒤처져 있었고, 안에 있던 미커밋 변경은 이후 `server/public/app.js` 에 다시 반영된
  내용임을 줄 단위로 대조해 확인했다. **이로써 이 폴더의 git 저장소는 하나가 되었다**
- **`OLD/` 아카이브 제거** (924KB) — 루트 `public`·`src` 를 옮겨둔 것. 참조 없음
- **`server/mock_api.php`, `server/mock_agency.php` 제거** — 테스트용 모의 API. 참조 없음
- **`server/public/` 잔재 17개 제거** (1.1MB) — `app.js.bak`·`.orig`·`.rej` 등 백업 14개,
  `style.css.backup`, `patch_editable.py`, `.DS_Store`
- **`텔레그램 ID 권한 자료.xlsx` → `private/`** — 부계정 권한 자료라 저장소에 두지 않는다
- **`.dockerignore` 2줄 → 67줄** — 아카이브·중첩저장소·개인메모·백업·저장소메타·문서 제외

지운 파일은 전부 `_to_delete/` 로 옮겨두었다 (약 190MB). 확인 후 폴더째 버리면 된다.
배포 동작 변화는 없다 — `server/public` 23개 파일과 `server/src` 는 그대로다.

### 상태 저장 규칙 (2026-08-25)
`CLAUDE.md` **9-11절** 신설. 이 프로젝트(`~/nirvana_project/hotel roomcheck`)에서
**"현재 상태 저장해"** 는 이 문서를 갱신하라는 뜻으로 확정했다. 7개 절 구조 유지,
기존 내용 삭제 금지, 틀린 기록은 3절에 정정 추가, 갱신 전 백업, `docs:` 커밋.

---

## 2. 수정한 파일

| 파일 | 내용 |
|------|------|
| `server/public/app.js` | 위 프론트 기능 + 소속명 헤더 표시·요청 에이전시 스냅샷 생성 |
| `server/public/i18n.js` | 라벨·안내 문구 (ko/en/th) |
| `server/public/style.css` | 모바일 분기점·글씨, `.hfind` 목록 |
| `server/public/login.html`, `profile.html` | 비밀번호 안내 |
| `server/src/lib.php` | 권역 계산, `currentUser()` SELECT 보강 |
| `server/src/events.php` | 알림 권역·중복 |
| `server/src/router.php` | 알림 읽기 권역 필터, requests 칼럼을 부계정 세션 기준으로 저장 |
| `server/src/agency.php` | 부계정 로그인 세션에 `name`·`parent_agent_name` 보관 |
| `server/src/db.php` | `notifications.zone`, `requests` 칼럼 4개 |
| `docs/룸첵-작동원리.html` | 작동 원리 설명서 (도표 7개) |
| `.dockerignore` | 2줄 → 67줄. 배포 이미지에 들어갈 것만 남긴다 |
| `CLAUDE.md` | 9-11절 — "현재 상태 저장해" 의 뜻과 갱신 규칙 |
| `PROJECT_STATUS.md` | 1·2·3·5·6·7절 갱신 (저장소 정리 · 정정 · 검증) |

---

## 3. 아직 해결하지 못한 것

### 확인이 필요한 것 (사용자)
- **확인자에게 에이전트 요청이 뜨는지** — 권역 수정이 실제로 통했는지
- **에이전트로 로그인했을 때 다른 회사 요청이 보이는지**
- **실 부계정 재로그인 후 헤더에 `parent_agent_name`이 표시되는지**
- **새 에이전트 요청의 에이전시 칼럼 4개가 실제 운영 DB에 정확히 저장되는지**
- **`DB_DSN` 이 MySQL 로 설정돼 있는지** — 빠져 있으면 배포마다 데이터 초기화
  ```
  gcloud run services describe hotel-roomcheck --region=asia-southeast1 \
    --format="value(spec.template.spec.containers[0].env)"
  ```

### 구조 문제 (미수정)
- **에이전트 목록 거르기가 사람 이름과 회사 이름을 맞춰보는 방식이다.** 담당자가 이직하면
  깨진다. 회사(`parent_idx`) 기준으로 바꾸고 **서버로 옮겨야 한다** — 지금은 브라우저에서만
  거르고 서버는 모든 에이전트에게 모든 회사 요청을 내려보낸다
- **금액 가림도 화면 단에서만 이뤄진다.** 서버는 에이전트에게도 워크시트 전체를 보낸다
- **부분 답변 알림 개수가 항상 `?`** — 브라우저가 `_doneCount` 를 안 보낸다 (한 줄 수정)
- 쓰이지 않는 잔재: `quoteAsk` · `quoteOnly` · `row.subOptions` · `req.checkerAddedHotels`

### 니르바나 회신 대기
- 부계정 비밀번호 **자동 발급 · 변경 API**
- **부계정 목록 API** (지금은 로그인한 적 있는 부계정만 알 수 있다)
- 담당자 목록 API (있으면 담당자→에이전시 자동 채움이 훨씬 간단해진다)

### 검증 못 한 것
컨테이너·Mac 원격 셸 모두 `nirvana835.mycafe24.com` 접근이 프록시에서 막혀 있다.
**실 API 응답 필드명은 문서와 관리 화면 스크린샷 기준**이며, 실물로 확인하지 못했다.
Mac 터미널에서 로컬 실행하면 실 API 로 확인 가능하다.

### 이 문서의 이전 기록 정정 (2026-08-25)
6절에 **"백업 파일이 git 에서만 빠지고 배포 이미지에는 들어간다"** 고 적혀 있었으나
**사실이 아니었다.** 원격 저장소를 clone 해 확인한 결과 `server/public/` 에 백업 파일은
0개였다. 이미 `.gitignore` 로 빠져 있었고, GitHub Actions 는 checkout 한 코드로 빌드하므로
이미지에 들어간 적이 없다. **웹으로 소스가 새어나가는 상황은 없었다.**

다만 Mac 에서 로컬로 `docker build .` 할 때는 실제로 들어가므로 `.dockerignore` 보강은
유효하다. 그리고 `server-laravel` 178MB 는 저장소에 실제로 있었으므로 **이쪽이 진짜
낭비였다.**

### 작업 환경 — git 잠금 파일 (2026-08-25)
Cowork 원격 세션에서 이 폴더에 git 명령을 실행하면 `.git/index.lock` 과 `HEAD.lock` 이
남아 다음 명령을 막는다. 세션이 마운트된 폴더에서 **파일을 지울 권한이 없어** git 이
자기 잠금 파일을 정리하지 못하기 때문이다. `_to_delete/gitlocks_*` 가 그 잔재다.

**Mac 터미널에서 직접 실행할 때는 생기지 않는다.** 이 폴더의 git 작업은 Mac 터미널에서
하는 편이 안정적이다.

### 이 문서의 push 기록 정정 (2026-08-26)
이전 기록에는 커밋 5개가 미push라고 되어 있었으나, `git status` 확인 결과
`main...origin/main`으로 동기화되어 있다. 부계정 개선 커밋 `8c4751f`, `b62188e`도
현재 `origin/main`에 포함되어 있다.

---

## 4. 현재 확정된 계산 공식

- 신규 견적 환율 `QRATE = 45`. 기존 견적은 저장값 유지
- 호텔 요금 = 구간별 선택 호텔의 일자별 `price` 합
- 워크시트 키: `rowId|iso` · `rowId_chk_ci|iso` · `rec_recId|iso`
- 총액(원) = (호텔 ฿ + 옵션 ฿) × 환율 + 추가항목(원)
- 1인 만원 = 총액 ÷ 인원 ÷ 10,000
- 진행률 분모 = 기본 호텔 + 추가 호텔. **추천 호텔은 제외**

---

## 5. 테스트 결과

Playwright + PHP 8.4 로 Cloud Run 과 같은 구조에서 검증. **JS 오류 0건.**

- 권역: 카오락/방콕/카오락+파타야/사무이 4건 등록 후
  krabi 담당 → 1·3·4 / bangkok 담당 → 2·3 / 미설정 → 전부
- requests 칼럼: 부계정 직접 등록 4개 다 채워짐, 요청자 대행 시 parent 만 채워짐,
  브라우저가 안 보내도 세션에서 채워짐
- 룸타입: 원본 7건(중복·삭제·비노출·비활성 포함) → 화면 3건, sort 순서 유지
- 모바일 360/390/402/430px 두 줄 라벨 없음, 가로 넘침 0px
- 전 페이지 HTTP 200 (admin 403 은 부계정 권한 차단으로 정상)

### 부계정 세션·요청 저장 변경 검증 (2026-08-26)
- `php -l server/src/agency.php` 통과
- `php -l server/src/router.php` 통과
- `node --check server/public/app.js` 통과
- IDE 린트 오류 0건
- 실 니르바나 API 로그인과 운영 DB INSERT는 아직 검증하지 못함

### 저장소 정리 검증 (2026-08-25)
- `server/public` 23개 파일이 원격 저장소 목록과 일치. 배포 필수 파일 11종 존재 확인
- `server/` 는 자기완결 구조 확인 — `index.php` → `__DIR__.'/../src/router.php'`,
  `server/` 밖을 참조하는 코드 없음 (`../../` 참조 0건)
- `live` 최신 커밋 `1be0b13` 이 `origin/main` 의 조상임을 확인 (이미 GitHub 에 있음)
- `live` 미커밋 변경 384줄 중 288줄이 본체에 이미 존재. 나머지는 표시 방식 차이
- 루트 `public/app.js` 미커밋 변경 7건 중 6건이 배포본에 이미 반영 (3건은 주석까지 동일).
  남은 1건은 이후 `hgnum` 그룹 헤더 설계로 교체된 것

### 커밋 (2026-08-25, 전부 미push)
```
a84dd16  docs: "현재 상태 저장해" = PROJECT_STATUS.md 갱신 규칙 추가 (9-11)
08d7ada  docs: PROJECT_STATUS 갱신 — 저장소 · 배포 이미지 정리 반영
2da4b5c  chore: 텔레그램 ID 권한 자료.xlsx 를 private/ 로 이동
3c7e4f0  chore: OLD 아카이브 · live 중복 저장소 · 모의 API 파일 제거
814c1b7  chore: 배포 이미지에서 server-laravel 제거 + .dockerignore 보강
```
워킹트리는 깨끗하다. **push 후 배포 결과 확인이 남아 있다.**

### 추가 커밋 (2026-08-26, 원격 반영 확인)
```
8c4751f  feat: 부계정 로그인 API에 parent_agent_name 추가 및 세션 저장 방식 개선
b62188e  feat: 부계정 로그인 및 요청 처리 개선
```
`git status` 기준 기능 코드와 `origin/main`은 동기화되어 있다.

---

## 6. 다음에 할 일

0. **실 부계정으로 로그아웃→재로그인 후 운영 검증** — 우측 상단 소속명 표시와
   새 요청의 에이전시 칼럼 4개를 DB에서 확인한다
1. **에이전트 목록 거르기를 회사 기준으로 바꾸고 서버로 이동** — 위 "구조 문제" 첫 항목.
   운영 확인 결과에 따라 방향이 갈린다
2. **금액 가림을 서버로 이동** — 서버가 에이전트에게 보낼 때 `ws` 의 `price` 를 제거
3. **부분 답변 알림 개수** — 브라우저가 `_doneCount` 를 함께 보내도록 한 줄 추가
4. 담당자 → 에이전시 자동 채움 (에이전시 개수·캐시 기간·동명이인 처리 결정 필요)
5. 잔재 필드 정리 — `quoteAsk` · `quoteOnly` · `row.subOptions` · `req.checkerAddedHotels`
6. **루트 `public/` 과 `src/` 를 어떻게 할지 결정** — 배포되지 않는데 저장소에 남아 있다.
   `OLD/` 로 옮겼어야 할 것이 되돌아온 상태로 보인다. 지울지 되살릴지 판단 필요
7. **`Dockerfile` 의 평문 비밀값 처리** — `TELEGRAM_BOT_TOKEN` · `TELEGRAM_WEBHOOK_SECRET` ·
   `CRON_KEY` · `ADMIN_PASSWORD` 가 `ENV` 로 박혀 있다. 저장소가 공개면 그대로 노출된다.
   `.dockerignore` 로는 해결되지 않고 값 자체를 재발급해야 한다 (커밋 이력에 남아 있음).
   **사용자 판단 대기 중 — 2026-08-25 시점에서 보류하기로 함**

### 완료 (2026-08-25)
- ~~`.dockerignore` 에 백업 파일 패턴 추가~~ → 1절 "저장소 · 배포 이미지 정리" 참조
- ~~저장소 2개(본체 + `live`) 정리~~ → 하나로 통합
- ~~`_to_delete/` 정리 대상 분류~~ → 약 190MB. 사용자가 확인 후 버리면 된다
- ~~미push 커밋 5개 push~~ → 2026-08-26 `main...origin/main` 동기화 확인

---

## 7. 절대로 변경하면 안 되는 것

`CLAUDE.md` 9절 참조. 요약하면:

- 상태 색 `--av` · `--rq` · `--so` 는 예약색 — 버튼·태그·탭에 쓰지 않는다
- `isEN()` 은 **고른 언어** 기준. 지역은 약어를 쓰지 않는다
- 추천 호텔 금액은 에이전트에게 보이지 않는다 (`costVisible()`)
- 추천 호텔은 진행률에서 제외 — 추가 호텔과 같은 배열에 섞지 않는다
- 워크시트 키 스킴, localStorage 키 `nirvana_roomcheck_v2`
- `requests` 의 `agency_name` / `agency_parent_name` 은 **저장 시점 스냅샷** — 갱신하지 않는다
- Cloud Run DocumentRoot 는 `server/public` (루트 `public/` 이 아니다)
- `server/.env` 는 커밋 금지
- **배포에 실제로 쓰이는 것은 `server/` 하나뿐이다** — `server/public`(웹 루트) +
  `server/src`(PHP). 루트 `public/`·`src/` 는 배포되지 않는다. 기능을 고칠 때
  **루트 쪽을 고치면 배포에 반영되지 않는다** (2026-08-25 실제로 그런 미커밋 변경이 있었다)
- `.dockerignore` 를 줄일 때는 `server/` 와 `Dockerfile` 이 제외되지 않는지 확인한다
