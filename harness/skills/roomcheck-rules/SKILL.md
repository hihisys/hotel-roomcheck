---
name: roomcheck-rules
description: 룸체크 프로젝트 표준 규칙 체크리스트. auditor 에이전트의 검수 기준이며, 규칙이 변경되면 이 파일과 프로젝트 문서(claude/작업규칙.md)를 함께 갱신한다. 트리거: "규칙 검수", "룸체크 검수".
---

# 룸체크 작업 규칙 체크리스트

## A. 언어팩 (i18n.js)
- [ ] 새/변경 UI 문자열이 하드코딩 없이 T()/TF()를 쓰는가
- [ ] 해당 키가 LPACK **ko/en/th 3곳 모두**에 존재하는가 (`grep -c "키:" i18n.js` = 3)
- [ ] 언어 허용: agent=[ko], sreq=[en,ko], schk=[th,en] — 변경하지 않았는가

## B. 항상 영어 고정 (요청자·확인자 화면)
- [ ] 날짜 17Jul26(fdate/fdshort), 지역 RG_EN, 박수 N/객실 R, 호텔 HOTEL_EN, 룸타입 RT_EN, 옵션 OPT_EN
- [ ] 데이터 저장은 한글 원본값 (영어 입력은 HOTEL_KO/RT_KO로 역변환)

## C. 항상 한국어 (고객용)
- [ ] 견적서 카드/텍스트(quoteCardHTML/quoteText): 한국식 날짜(kdstr), 가용상태 avKo
- [ ] 견적 관리자 이미지(saveFullImg): FORCE_KO로 한국어 강제
- [ ] 에이전트 페이지 전체 한국어

## D. 페이지별 노출 규칙
- [ ] 직접 등록(direct) 카드: 요청자 페이지에만 (에이전트·확인자 숨김)
- [ ] 호텔 확인자 입력(.phWho): 확인자 전체 + 요청자는 direct 건만. 에이전트에 전화 UI 없음
- [ ] 계약완료·지난이동·견적만들기·관리자 이미지/URL 버튼: 요청자 전용. 에이전트에 지난 이동 버튼 없음
- [ ] 확인자 탭: 요청/완료/불가. 요청자·에이전트 탭: 요청/지난/계약완료

## E. 리스트 이동·삭제 기준 (변경 시 ⓘ 패널 동기화 필수!)
- [ ] 기준 변경 시 rules_chk/rules_req **3개 언어** + 관련 캡션(cap_*) 갱신
- [ ] 기준 변경 시 프로젝트 문서 claude/작업규칙.md 갱신
- [ ] 부분 답변: answerComplete가 아닌 건은 확인자 요청 탭에 남는다

## F. 코드 품질·화면 규격
- [ ] node --check 통과 (app.js, i18n.js)
- [ ] 갤럭시 폴드 세로(320~400px) 기준 깨지지 않음 (미디어쿼리 ≤400/≤340)
- [ ] localStorage 스키마 하위 호환 (기존 데이터가 깨지지 않게 — 새 필드는 옵셔널 + sweep 마이그레이션)
- [ ] wshead의 data-toggle 가드: 새 인터랙티브 요소는 `closest('select,input,textarea,button,a')`에 포함되는 태그인가

## G. 배포 규칙
- [ ] HTML의 ?v= 버전이 수정된 css/js 모두에 대해 범프되었는가
- [ ] 맥 폴더(/Users/alex/너바나 프로젝트/호텔 룸첵)와 프로젝트 문서(claude/site/*) 모두 갱신되었는가
