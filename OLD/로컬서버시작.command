#!/bin/bash
# 룸 체크 로컬 웹 서버 — 더블클릭으로 실행
cd "$(dirname "$0")"
IP=$(ipconfig getifaddr en0 2>/dev/null || ipconfig getifaddr en1 2>/dev/null)
clear
echo "==============================================="
echo "  룸 체크 로컬 서버를 시작합니다"
echo ""
echo "  이 맥에서 :  http://localhost:8000"
if [ -n "$IP" ]; then
echo "  핸드폰에서:  http://$IP:8000   (같은 와이파이)"
fi
echo ""
echo "  끄려면 이 창에서 Ctrl+C 를 누르거나 창을 닫으세요"
echo "==============================================="
echo ""
( sleep 1; open "http://localhost:8000" ) &
if command -v node >/dev/null 2>&1; then
  node server.js
elif command -v python3 >/dev/null 2>&1; then
  python3 -m http.server 8000
else
  echo "⚠️  node 또는 python3가 설치되어 있지 않습니다."
  echo "   App Store에서 Xcode 명령어 도구를 설치하거나 nodejs.org에서 node를 설치해주세요."
  read -n 1 -s -r -p "아무 키나 누르면 닫힙니다..."
fi
