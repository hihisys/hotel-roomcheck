# localStorage 시드 데이터 템플릿

키: `nirvana_roomcheck_v2`

```js
await page.evaluate(() => {
  const now = Date.now();
  const db = {
    seq: 2, checker: '수진', agentName: '', hist: { ag: [], am: [], st: [] },
    vault: [], fullbook: {}, phones: {}, langs: {},   // langs:{sreq:'ko'} 등으로 언어 고정 가능
    requests: [
      { // 일반 요청 (확인자에게 보임)
        id: 1001, no: 1, createdAt: now - 1000, status: 'requested', direct: false,
        quoteRequested: false, quoteSent: false, answeredAt: null,
        registrant: '심은선', agentManager: '정인태', agent: '닥터', manager: '',
        mode: 'single',            // 'single' | 'multi'(연박 이동) | 'parallel'(다중호텔 동일기간)
        startDate: '2026-09-20', sharedNights: 2, notes: '',
        rows: [{ id: 11, region: '카오락', hotel: 'JW 메리어트 카오락', roomType: '디럭스',
                 rooms: 1, nights: 2, note: '', options: [] }],
        ws: {},                    // 답변: { '<rowId>|<iso>': {status:'av'|'rq'|'so', price:'3000'} }
        quote: { rate: 40, pax: 2, addl: [], override: null }
      },
      { // 직접 등록 (요청자 페이지에만 보임)
        id: 1002, no: 2, createdAt: now - 500, status: 'requested', direct: true,
        quoteRequested: false, quoteSent: false, answeredAt: null,
        registrant: '심은선', agentManager: '', agent: '', manager: '',
        mode: 'single', startDate: '2026-10-01', sharedNights: 2, notes: '',
        rows: [{ id: 22, region: '푸켓', hotel: '카타타니 푸켓 비치 리조트', roomType: '디럭스',
                 rooms: 1, nights: 2, note: '', options: [] }],
        ws: {}, quote: { rate: 40, pax: 2, addl: [], override: null }
      }
    ]
  };
  localStorage.setItem('nirvana_roomcheck_v2', JSON.stringify(db));
});
await page.reload();
```

## 상태 변형 포인트
- **답변 완료 상태**: `status:'answered', answeredAt:now, answerComplete:true, manager:'수진'` + rows 전 날짜에 ws 상태 입력.
- **부분 답변**: rows 2개 중 1개만 ws 채우고 `answerComplete:false` → 확인자 요청 탭에 "부분 답변 n/N" 배지.
- **견적 발송**: `quoteSent:true, quoteSentAt:now, quoteBy:'심은선'`.
- **풀북**: 전 날짜 `status:'so'` + answered → 불가 탭.
- **지난 리스트**: `archivedAt: now`. **계약완료**: `contractedAt: now`.
- **전화번호**: `phones: { 'JW 메리어트 카오락': ['+66 76 123 456'] }`, 선택값은 `rows[].phone`, 호텔 확인자는 `rows[].confirmedBy`.

## 주의
- id는 숫자(코드가 `Number()` 캐스팅), 호텔·룸타입·지역은 **한글 원본값**으로 넣는다.
- 옵션: `{id:1, name:'조식 포함', qty:1, amt:0, show:true, memo:''}` — name은 OPTLIST의 한글.
- rows[].id와 ws 키의 rowId가 일치해야 한다.
