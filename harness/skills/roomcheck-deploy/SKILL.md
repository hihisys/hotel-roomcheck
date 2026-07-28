---
name: roomcheck-deploy
description: 룸체크 웹앱 변경 사항을 배포할 때 발동 — 캐시 버전 범프, 맥 폴더 저장, 프로젝트 문서 갱신 절차. 트리거: "저장해주세요", "배포", 오케스트레이터 파이프라인의 마지막 단계.
---

# 룸체크 배포 절차

## 워크플로우
1. **문법 검사**: `node --check /home/claude/site/app.js` (i18n.js 수정 시 동일).
2. **버전 범프** (css/js 수정이 있을 때만):
   ```bash
   cd /home/claude/site && V=$(date +%Y%m%d%H%M%S) && \
   for f in index.html agent.html request.html check.html; do \
     sed -i -E "s/(\.(css|js)\?v=)[0-9]+/\1$V/g" $f; done
   ```
3. **전달**: 변경된 파일 전부를 SendUserFile 한 번에 보내고 file_uuid를 받는다.
4. **맥 저장**: `device_commit_files`로 각 uuid를 `/Users/alex/너바나 프로젝트/호텔 룸첵/<파일명>`에 force:true로 커밋. uuid는 복사-붙여넣기 실수 주의 (오타 시 HTTP 404).
5. **프로젝트 갱신**: 변경 파일을 `project_write`로 claude/site/<파일명>에 저장 (local_path 방식).
6. **보고**: 사용자에게 한국어로 변경 요약 + "새로고침하면 반영됩니다" 안내.

## 에러 핸들링
- device bridge 도구가 안 보이면: ToolSearch로 `select:mcp__remote-devices__device_commit_files` 재로드.
- 커밋 rejected(404): uuid 오타 — SendUserFile 결과에서 다시 복사하거나 해당 파일만 재전송.
- 기기 오프라인: 파일 첨부는 이미 완료된 상태이므로, 사용자에게 데스크톱 앱 접속 후 다시 요청하라고 안내.

## 주의
- 버전 범프 없이 저장하면 브라우저 캐시 때문에 "반영 안 됨" 문의가 온다 — 범프는 필수.
- 규칙(삭제·이동 기준, 언어 규칙)이 바뀐 배포면 claude/작업규칙.md도 함께 갱신한다.
