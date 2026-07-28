---
name: roomcheck-test
description: 룸체크 웹앱을 Playwright로 자동 테스트할 때 발동. 로컬 서버 구동, localStorage 시드 데이터 구성, 역할별 페이지 검증 절차를 제공한다. 트리거: "룸체크 테스트", tester 에이전트의 검증 작업.
---

# 룸체크 Playwright 테스트

## 워크플로우
1. 서버: `cd /home/claude/site && (node server.js &>/tmp/srv.log &)` 후 `sleep 1`. 주소는 `http://localhost:8000/{agent|request|check}.html`.
2. 시드: `references/seed-template.md`의 요청 객체를 `page.evaluate`로 localStorage 키 `nirvana_roomcheck_v2`에 넣고 `page.reload()`.
3. 검증: 테스트 포인트별로 클릭·입력 후 상태 확인. `page.on('pageerror')` 리스너 필수, 에러 0건 확인.
4. 판정: 모든 항목 ✓ 이고 pageerror 없으면 PASS.

## 핵심 셀렉터
- 리스트 카드 열기: 에이전트 `[data-sel="<id>"]`, 직원(요청자/확인자) `[data-ssel="<id>"]` — **토글이므로 두 번 클릭하면 닫힌다.**
- 워크시트: 상태 일괄 `select.stsel[data-all="<rowId>"]` (값 av/rq/so), 요금 일괄 `input.pall[data-all]`, 날짜별 `[data-key="<rowId>|<iso>"]`.
- 전화: `.phSel`(드롭다운, `__add`=번호 추가), `.phNew`(번호 입력, Enter), `.phWho`(호텔 확인자).
- 답변 전송 `#sendA`, 견적 포함 `#sendQ`, 견적 빌더 열기 `#qTog`, 리스트 탭 `#listTab button[data-t=...]`, 언어 전환 `[data-lang="ko|en|th"]`, 토스트 `#toast`.
- 폼 제출: `#run`(직원 전달), `#runDirect`(직접 등록, sreq 전용).

## 필수 확인 규칙 (변경과 무관하게 깨지면 FAIL)
- 직접 등록(direct:true) 건은 확인자·에이전트 페이지에 안 보임.
- 확인자 기본 언어 태국어, 요청자 기본 영어, 에이전트 한국어(언어 칩 없음).
- 요청자/확인자: 날짜 17Jul26 형식·영문 호텔명. 견적서 카드: 한국식 날짜(2026.07.16 수).
- input.pall 등 onchange 이벤트는 `dispatchEvent(new Event('change',{bubbles:true}))`로 발화.

## 참조
- references/seed-template.md — localStorage 시드 데이터 원형 (요청 객체 필수 필드)
