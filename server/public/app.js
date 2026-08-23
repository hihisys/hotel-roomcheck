/* ================= 기준 데이터 ================= */
/* ===== 외부 호텔 API 연동 =====
   서버가 POST {HOTEL_API_BASE}/api2/hotels 를 프록시한다 (GET api/hotels).
   응답이 없거나 503(not_configured)이면 아래 기본 목록으로 자동 폴백해 화면이 멈추지 않는다.
   그래서 const가 아니라 let 이다. */
let HOTELS=[
 {name:"마이카오락 비치 리조트",region:"카오락",rooms:["디럭스","디럭스 풀액세스","주니어 스위트"]},
 {name:"로빈슨 클럽 카오락",region:"카오락",rooms:["디럭스","풀빌라","비치프론트"]},
 {name:"카오락 에메랄드 비치 리조트",region:"카오락",rooms:["디럭스","프리미어 디럭스","풀액세스"]},
 {name:"JW 메리어트 카오락",region:"카오락",rooms:["디럭스","풀액세스","풀빌라"]},
 {name:"카오락 메리어트 비치 리조트",region:"카오락",rooms:["디럭스","풀액세스","이그제큐티브"]},
 {name:"카타타니 푸켓 비치 리조트",region:"푸켓",rooms:["디럭스","씨뷰","풀 스위트"]},
 {name:"더 쇼어 앳 카타타니",region:"푸켓",rooms:["풀빌라","오션프론트 풀빌라"]},
 {name:"로얄 클리프 비치 호텔",region:"파타야",rooms:["디럭스","씨뷰","스위트"]},
 {name:"아바니 파타야",region:"파타야",rooms:["디럭스","풀액세스"]},
];
const GENERIC=["디럭스","슈페리어","풀액세스","풀빌라","주니어 스위트","스위트","씨뷰","비치프론트","오션뷰"];
let REGIONS=["전체","카오락","푸켓","파타야","크라비"];
const OPTLIST=["올인","올인 2회","풀보드","하프보드","조식 포함","허니문 세팅","고층 요청","커넥팅룸","레이트 체크아웃","얼리 체크인","패스트 트랙","VIP 라운지","공항 픽업"];
const MON=["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
const WDK=["일","월","화","수","목","금","토"];
const STOPT=[["","–"],["av","AV"],["rq","RQ"],["so","S/O"]];
const STCLS={av:"st-av",rq:"st-rq",so:"st-so","":""};

/* ================= Phase 2-B: 추가 룸테크 호텔/룸타입 목록 ================= */
const CHECK_HOTELS=["마이카오락 비치 리조트","로빈슨 클럽 카오락","카오락 에메랄드 비치 리조트","JW 메리어트 카오락","카오락 메리어트 비치 리조트","카타타니 푸켓 비치 리조트","더 쇼어 앳 카타타니","로얄 클리프 비치 호텔","아바니 파타야"];
const CHECK_ROOMS=["디럭스","슈페리어","풀액세스","풀빌라","주니어 스위트","스위트","씨뷰","비치프론트","오션뷰","프리미어 디럭스","이그제큐티브","펜트하우스"];

/* ================= 헬퍼 ================= */
const _utc=iso=>{const p=iso.split('-').map(Number);return new Date(Date.UTC(p[0],p[1]-1,p[2]))};
const addDays=(iso,n)=>{const d=_utc(iso);d.setUTCDate(d.getUTCDate()+n);return d.toISOString().slice(0,10)};
const diffD=(a,b)=>Math.round((_utc(b)-_utc(a))/86400000);
const fmtD=iso=>{const d=_utc(iso);return String(d.getUTCDate()).padStart(2,'0')+MON[d.getUTCMonth()]+String(d.getUTCFullYear()).slice(2)};
const wdk=iso=>WDK[_utc(iso).getUTCDay()];
const dstr=iso=>fmtD(iso)+" "+wdk(iso);
const kdstr=iso=>{const d=_utc(iso);return d.getUTCFullYear()+'.'+String(d.getUTCMonth()+1).padStart(2,'0')+'.'+String(d.getUTCDate()).padStart(2,'0')+' '+WDK[d.getUTCDay()];};
const kdshort=iso=>{const d=_utc(iso);return String(d.getUTCMonth()+1).padStart(2,'0')+'.'+String(d.getUTCDate()).padStart(2,'0')+' '+WDK[d.getUTCDay()];};
/* 직원 요청자 페이지: 영문·호텔식 표기 */
const HOTEL_EN={"마이카오락 비치 리조트":"My Khaolak Beach Resort","로빈슨 클럽 카오락":"Robinson Khao Lak","카오락 에메랄드 비치 리조트":"Khaolak Emerald Beach Resort","JW 메리어트 카오락":"JW Marriott Khao Lak Resort","카오락 메리어트 비치 리조트":"Khao Lak Marriott Beach Resort","카타타니 푸켓 비치 리조트":"Katathani Phuket Beach Resort","더 쇼어 앳 카타타니":"The Shore at Katathani","로얄 클리프 비치 호텔":"Royal Cliff Beach Hotel","아바니 파타야":"Avani Pattaya Resort"};
const RT_EN={"디럭스":"Deluxe","슈페리어":"Superior","풀액세스":"Pool Access","풀빌라":"Pool Villa","주니어 스위트":"Junior Suite","스위트":"Suite","씨뷰":"Sea View","비치프론트":"Beachfront","오션뷰":"Ocean View","디럭스 풀액세스":"Deluxe Pool Access","프리미어 디럭스":"Premier Deluxe","이그제큐티브":"Executive","풀 스위트":"Pool Suite","오션프론트 풀빌라":"Oceanfront Pool Villa"};
const RG_EN={"카오락":"Khao Lak","푸켓":"Phuket","파타야":"Pattaya","크라비":"Krabi"};
let FORCE_KO=false; /* 전체 이미지(고객용) 렌더 시 한국어 강제 */
const isEN=()=>!FORCE_KO&&typeof ui!=='undefined'&&(ui.role==='sreq'||ui.role==='schk');
const dHotel=n=>isEN()?(HOTEL_EN[n]||n):n;
const dRoom=n=>isEN()?(RT_EN[n]||n):n;
const dRegion=n=>isEN()?(RG_EN[n]||n):n;
const fdate=iso=>isEN()?fmtD(iso):kdstr(iso);
const fdshort=iso=>isEN()?fmtD(iso):kdshort(iso);
/* 입력 폼 전용 최단 표기 — 한국어 "26.08.31"(연도 2자리·요일 없음).
   폰 한 줄에 첵인·첵아웃·박수·객실수를 모두 넣기 위한 형식이다.
   측정: 360px 화면에서 여유 31px (기존 "2026.08.23 일" 형식은 40px 부족). */
const kdnum=iso=>{const d=_utc(iso);return String(d.getUTCFullYear()).slice(2)+'.'+String(d.getUTCMonth()+1).padStart(2,'0')+'.'+String(d.getUTCDate()).padStart(2,'0');};
const fdform=iso=>isEN()?fmtD(iso):kdnum(iso);
const esc=v=>String(v||'').replace(/"/g,'&quot;');
const escT=v=>String(v||'').replace(/&/g,'&amp;').replace(/</g,'&lt;');
const opt=(v,t,sel)=>'<option value="'+esc(v)+'"'+(sel?' selected':'')+'>'+t+'</option>';
/* ===== 호텔 API: 목록 · 지역 · 룸타입 =====
   실제 응답(2026-08-23 확인) 한 건:
     {idx:136, area:"PK", name:"Splash Beach Resort Maikhao",
      name_kr:"스플래시 비치 리조트 푸켓", main_hotel_yn:"Y",
      telnumber:"076 372 000", active:"Y", …}
   주의 세 가지:
     ① area 는 이름이 아니라 코드다 (PK, PT …) → AREA_NAME 으로 옮긴다
     ② 한글명(name_kr)과 영문명(name)이 둘 다 온다 → 한글을 기준 이름, 영문은 HOTEL_EN 에 넣는다
     ③ 목록에는 룸타입이 없다 → 상세 API에서 따로 받아온다                          */
/* 지역 코드 → 풀네임.
   API는 area 를 코드(PK, PT …)로만 준다. 확인된 것: PK=푸켓, PT=파타야 (실응답).
   나머지는 추정이므로, 표에 없으면 호텔 한글명에서 지역어를 찾아내 보완한다. */
const AREA_NAME={PK:'푸켓',PT:'파타야',KL:'카오락',KB:'크라비',BK:'방콕',BKK:'방콕',
  SM:'사무이',KS:'사무이',CM:'치앙마이',HH:'후아힌',PP:'피피',CR:'치앙라이',HY:'핫야이'};
const AREA_WORDS=['카오락','푸켓','파타야','크라비','방콕','사무이','치앙마이','후아힌','피피','치앙라이','핫야이'];
/* 코드가 표에 없으면 호텔 한글명에 섞인 지역어로 유추한다
   (예: "스플래시 비치 리조트 푸켓" → 푸켓). 그래도 없으면 코드를 그대로 둔다. */
function areaLabel(code,nameKr){
  if(AREA_NAME[code])return AREA_NAME[code];
  const up=String(code||'').toUpperCase();
  if(AREA_NAME[up])return AREA_NAME[up];
  const hit=AREA_WORDS.find(w=>String(nameKr||'').includes(w));
  return hit||code||'';
}
let HOTEL_SRC='local';                 /* 'api' 로 바뀌면 서버 목록을 쓰는 중 */
const HOTEL_IDX={};                    /* 호텔명 → API idx */
const ROOMS_CACHE={};                  /* 호텔명 → 룸타입 배열 (상세 API) */
const _roomsPending={};
function _pick(o,...keys){for(const k of keys){const v=o&&o[k];
  if(v!=null&&String(v).trim()!=='')return String(v).trim();}return '';}
function normHotel(h){
  const kr=_pick(h,'name_kr'), en=_pick(h,'name','name_full');
  const code=_pick(h,'area','area_code');
  const rooms=Array.isArray(h.room_types)?h.room_types.map(r=>
    typeof r==='string'?r:_pick(r,'name','room_type_name','room_nm','title')).filter(Boolean):[];
  return {
    idx:_pick(h,'idx','id','hotel_idx'),
    name:kr||en,                                   /* 앱의 기준 이름은 한글 */
    nameEn:en,
    region:_pick(h,'area_name','region_name')||areaLabel(code,kr),
    phone:_pick(h,'telnumber','tel','phone','reservation_number'),
    rooms:rooms,
    main:_pick(h,'main_hotel_yn','main_yn')==='Y'
  };
}
async function loadHotelsFromAPI(){
  if(!SRV.on)return;                                   /* 서버 없이 열면 기본 목록 */
  try{
    const r=await fetch('api/hotels?active=Y',{cache:'no-store'});
    if(!r.ok)return;                                   /* 503 not_configured 등 → 폴백 유지 */
    const j=await r.json();
    const raw=j.hotels||j.data||[];
    const list=raw.map(normHotel).filter(h=>h.name);
    if(!list.length)return;
    HOTELS=list;HOTEL_SRC='api';
    DB.phones=DB.phones||{};
    list.forEach(h=>{
      if(h.idx)HOTEL_IDX[h.name]=h.idx;
      if(h.rooms.length)ROOMS_CACHE[h.name]=h.rooms;
      if(h.nameEn&&h.nameEn!==h.name){HOTEL_EN[h.name]=h.nameEn;
        HOTEL_KO[h.nameEn]=h.name;}   /* 영문 표기 + 역매핑 등록 (영문으로 입력해도 인식) */
      /* 호텔 전화번호를 주소록에 심는다 — 브라우저마다 따로 저장되던 문제가 사라진다 */
      if(h.phone){DB.phones[h.name]=DB.phones[h.name]||[];
        if(!DB.phones[h.name].includes(h.phone))DB.phones[h.name].unshift(h.phone);}
    });
    const regs=[...new Set(list.map(h=>h.region).filter(Boolean))];
    if(regs.length)REGIONS=['전체',...regs];
    renderApp();
  }catch(e){}                                          /* 네트워크 오류 → 폴백 유지 */
}
/* 룸타입은 상세 API에만 있다 (목록 응답에는 없음 — 2026-08-23 실물 확인).
   실제 항목 한 건:
     {idx:10160, hotel_idx:136, name:"Deluxe Twin No Balcony", name_full:"…",
      sort:0, active:"Y", view:"Y", del:"N", name_kr:null, log:"…", …}
   주의: 사용 중지(active≠Y)·삭제(del=Y)·숨김(view=N) 항목이 섞여 오므로 걸러낸다.
        호텔과 달리 name_kr 이 null 이라 name 을 쓴다. sort 순서를 지킨다.
   처음 필요할 때 한 번만 가져와 캐시에 넣고 다시 그린다. */
function pickRoomName(x){
  if(typeof x==='string')return x.trim();
  return _pick(x,'name_kr','name','name_full','room_type_name','room_nm','title');
}
function usableRoom(x){
  if(typeof x==='string')return true;
  const yn=(k,d)=>{const v=_pick(x,k);return v===''?d:v.toUpperCase();};
  return yn('active','Y')==='Y' && yn('del','N')!=='Y' && yn('view','Y')!=='N';
}
function fetchRooms(name){
  const idx=HOTEL_IDX[name];
  if(!idx||ROOMS_CACHE[name]||_roomsPending[name]||!SRV.on)return;
  _roomsPending[name]=true;
  fetch('api/hotels/'+encodeURIComponent(idx),{cache:'no-store'})
    .then(r=>r.ok?r.json():null)
    .then(j=>{
      const d=(j&&(j.hotel||j.data))||{};
      const rt=d.room_types||d.rooms||[];
      const rooms=(Array.isArray(rt)?rt:[])
        .filter(usableRoom)
        .map((x,i)=>({n:pickRoomName(x),s:Number((x&&x.sort)||0),i:i}))
        .filter(x=>x.n)
        .sort((a,b)=>(a.s-b.s)||(a.i-b.i))          /* sort 값 우선, 같으면 원래 순서 */
        .map(x=>x.n)
        .filter((n,i,arr)=>arr.indexOf(n)===i);      /* 중복 제거 */
      if(rooms.length){ROOMS_CACHE[name]=rooms;renderApp();}
    }).catch(()=>{}).finally(()=>{delete _roomsPending[name];});
}
/* 호텔을 고르면 그 호텔의 지역이 자동으로 선택되고, 룸타입을 미리 받아둔다.
   입력값이 영문 표기여도 HOTEL_KO 로 한글 기준명으로 되돌린다. */
function applyHotelPick(target,val){
  const ko=HOTEL_KO[val]||val;
  target.hotel=ko;
  const h=HOTELS.find(x=>x.name===ko);
  if(h&&h.region)target.region=h.region;
  if(ko)fetchRooms(ko);
  return ko;
}
/* 지역을 바꾸면 그 전에 고른 호텔·룸타입은 더 이상 맞지 않으므로 비운다. */
function clearHotelPick(target,region){
  target.region=region;
  target.hotel='';
  target.roomType='';
  return target;
}
/* ── 호텔 이름 빨리 찾기 ────────────────────────────────────────
   직접 칠 때 한글·영문 어느 쪽으로 쳐도, 띄어쓰기·대소문자 상관없이 걸러서
   입력칸 바로 아래 목록으로 보여준다. datalist 는 브라우저마다 동작이 달라
   (특히 모바일) 직접 만든다. */
const HFIND_MAX=8;
const _hnorm=s=>String(s||'').toLowerCase().replace(/[\s\-_.()]/g,'');
function hotelSearch(q,region){
  const nq=_hnorm(q);
  const inRegion=(region&&region!=='전체')?HOTELS.filter(h=>h.region===region):HOTELS;
  if(!nq)return inRegion.slice(0,HFIND_MAX);
  const scan=base=>{
    const hit=[];
    base.forEach(h=>{
      const keys=[h.name,h.nameEn].filter(Boolean).map(_hnorm);
      let best=-1;
      keys.forEach(k=>{const p=k.indexOf(nq);if(p>=0&&(best<0||p<best))best=p;});
      if(best>=0)hit.push({h:h,p:best});
    });
    hit.sort((a,b)=>(a.p-b.p)||String(a.h.name).localeCompare(String(b.h.name)));
    return hit.slice(0,HFIND_MAX).map(x=>x.h);
  };
  const r=scan(inRegion);
  /* 고른 지역 안에 없으면 전체에서 다시 찾아준다 (고르면 지역이 따라온다) */
  return r.length?r:(inRegion===HOTELS?r:scan(HOTELS));
}
/* input 에 빨리 찾기 목록을 붙인다. getRegion() 이 현재 고른 지역을 돌려주고,
   onPick(호텔한글명) 이 실제 반영을 맡는다. */
function attachHotelFinder(input,getRegion,onPick){
  if(!input||input._hfBound)return;
  input._hfBound=true;
  input.setAttribute('autocomplete','off');
  input.removeAttribute('list');                 /* 기본 datalist 와 겹치지 않게 */
  const wrap=input.parentNode;if(!wrap)return;
  if(getComputedStyle(wrap).position==='static')wrap.style.position='relative';
  const box=document.createElement('div');
  box.className='hfind';box.style.display='none';
  wrap.appendChild(box);
  let items=[],cur=-1;
  const close=()=>{if(box.isConnected)box.style.display='none';cur=-1;};
  const draw=()=>{
    if(!box.isConnected||!input.isConnected)return;   /* 다시 그려져 사라진 뒤엔 손대지 않는다 */
    items=hotelSearch(input.value,getRegion?getRegion():'');
    if(!items.length){close();return;}
    box.innerHTML=items.map((h,i)=>
      '<div class="hfitem'+(i===cur?' on':'')+'" data-i="'+i+'">'
      +'<span class="hfn">'+esc(dHotel(h.name))+'</span>'
      +(h.region?'<span class="hfr">'+esc(h.region)+'</span>':'')
      +'</div>').join('');
    box.style.display='block';
    /* 좁은 화면에서 목록이 오른쪽으로 삐져나가면 왼쪽으로 당긴다 */
    box.style.left='0px';
    const r=box.getBoundingClientRect(),over=r.right-(window.innerWidth-10);
    if(over>0)box.style.left=(-over)+'px';
    const on=box.querySelector('.hfitem.on');if(on&&on.scrollIntoView)on.scrollIntoView({block:'nearest'});
  };
  /* 고르면 목록을 먼저 걷어내고 포커스를 뺀 다음 반영한다.
     (다시 그리는 도중에 blur 가 겹치면 브라우저가 innerHTML 오류를 낸다) */
  const pick=i=>{const h=items[i];if(!h)return;
    input.value=dHotel(h.name);close();
    try{input.blur();}catch(e){}
    setTimeout(()=>onPick(h.name),0);};
  box.addEventListener('mousedown',e=>{           /* blur 보다 먼저 잡아야 한다 */
    const it=e.target.closest('.hfitem');if(!it)return;
    e.preventDefault();pick(Number(it.dataset.i));});
  input.addEventListener('input',draw);
  input.addEventListener('focus',draw);
  input.addEventListener('blur',()=>setTimeout(close,180));
  input.addEventListener('keydown',e=>{
    if(box.style.display==='none'){if(e.key==='ArrowDown'){e.preventDefault();draw();}return;}
    if(e.key==='ArrowDown'){e.preventDefault();cur=Math.min(items.length-1,cur+1);draw();}
    else if(e.key==='ArrowUp'){e.preventDefault();cur=Math.max(0,cur-1);draw();}
    else if(e.key==='Enter'&&cur>=0){e.preventDefault();pick(cur);}
    else if(e.key==='Escape'){close();}
  });
}
/* 룸타입 자동완성 목록 (호텔이 정해져 있으면 그 호텔 것) */
const roomDL=(id,hotel)=>'<datalist id="'+id+'">'
  +roomsFor(hotel||'').map(r=>'<option value="'+esc(dRoom(r))+'">').join('')+'</datalist>';
const hotelsIn=r=>r==="전체"?HOTELS:HOTELS.filter(h=>h.region===r);
const roomsFor=name=>{
  if(ROOMS_CACHE[name]&&ROOMS_CACHE[name].length)return ROOMS_CACHE[name];
  const h=HOTELS.find(x=>x.name===name);
  if(h&&h.rooms&&h.rooms.length)return h.rooms;
  if(name)fetchRooms(name);          /* 상세 API에서 받아와 다음 렌더에 반영 */
  return GENERIC;};
const won=n=>Math.round(n||0).toLocaleString('ko-KR');
const manwonF=m=>(Math.round((m||0)*10)/10).toLocaleString('ko-KR')+'만원';
const lineTHB=x=>(Number(x.amt)||0)*(Number(x.qty)||1);
const optLabel=o=>o.name?(dOpt(o.name)+(Number(o.qty)>1?(isEN()?(' ×'+o.qty):(' '+o.qty+'회')):'')):'';
const statusLabel=code=>({av:'AV',rq:'RQ',so:'S/O'})[code]||'–';
const todayISO=()=>{const d=new Date();return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0');};
function parseDateStr(s){
  const em=String(s).trim().match(/^(\d{1,2})\s*([A-Za-z]{3})\s*(\d{2}|\d{4})/);
  if(em){const mi=MON.findIndex(x=>x.toLowerCase()===em[2].toLowerCase());
    if(mi>=0){let y=+em[3];if(y<100)y+=2000;const dd2=+em[1];
      const iso=y+'-'+String(mi+1).padStart(2,'0')+'-'+String(dd2).padStart(2,'0');
      const dt=_utc(iso);if(dt.getUTCDate()===dd2)return iso;}}
  const p=String(s).trim().split(/[^0-9]+/).filter(Boolean);
  let y,m,dd;
  if(p.length>=3){y=+p[0];m=+p[1];dd=+p[2];}
  else if(p.length===1&&p[0].length===8){y=+p[0].slice(0,4);m=+p[0].slice(4,6);dd=+p[0].slice(6,8);}
  else return null;
  if(y<2000||y>2100||m<1||m>12||dd<1||dd>31)return null;
  const iso=y+'-'+String(m).padStart(2,'0')+'-'+String(dd).padStart(2,'0');
  const dt=_utc(iso);if(dt.getUTCDate()!==dd||dt.getUTCMonth()+1!==m)return null;
  return iso;}
const dotDate=t=>{const d=new Date(t);return d.getFullYear()+'.'+String(d.getMonth()+1).padStart(2,'0')+'.'+String(d.getDate()).padStart(2,'0');};
const dotDateTime=t=>{const d=new Date(t);const hm=String(d.getHours()).padStart(2,'0')+':'+String(d.getMinutes()).padStart(2,'0');
  if(isEN())return String(d.getDate()).padStart(2,'0')+MON[d.getMonth()]+String(d.getFullYear()).slice(2)+' '+hm;
  return dotDate(t)+' '+hm;};
const kdotDateTime=t=>{const d=new Date(t);return dotDate(t)+' '+String(d.getHours()).padStart(2,'0')+':'+String(d.getMinutes()).padStart(2,'0');};
document.getElementById('optdl').innerHTML=OPTLIST.map(o=>'<option>'+o+'</option>').join('');
document.addEventListener('focusin',e=>{if(e.target&&e.target.matches&&e.target.matches('input[type=number]'))e.target.select();});

/* 요청/드래프트 공용 날짜 계산 */
function rDates(o,row,i){let checkIn,nights;
  if(o.mode==="parallel"){checkIn=o.startDate;nights=Math.max(1,Number(o.sharedNights)||1);}
  else{let off=0;for(let k=0;k<i;k++)off+=Math.max(1,Number(o.rows[k].nights)||1);checkIn=addDays(o.startDate,off);nights=Math.max(1,Number(row.nights)||1);}
  return {checkIn,checkOut:addDays(checkIn,nights),nights,dates:Array.from({length:nights},(_,k)=>addDays(checkIn,k))};}
const totalN=o=>o.mode==="parallel"?Math.max(1,Number(o.sharedNights)||1):o.rows.reduce((a,r)=>a+Math.max(1,Number(r.nights)||1),0);
const finalOut=o=>addDays(o.startDate,totalN(o));

/* ================= 저장소 ================= */
const LSKEY='nirvana_roomcheck_v2';
let _mem=null;
function loadDB(){try{const t=localStorage.getItem(LSKEY);if(t)return JSON.parse(t);}catch(e){}return _mem||{seq:0,requests:[],checker:''};}
function saveDB(){try{localStorage.setItem(LSKEY,JSON.stringify(DB));}catch(e){_mem=DB;}if(typeof srvSchedule==='function')srvSchedule();}
let DB=loadDB();if(DB&&Array.isArray(DB.requests))DB.requests=DB.requests.filter(r=>r&&Array.isArray(r.rows));
const byId=id=>DB.requests.find(r=>r.id===id);
const sorted=()=>[...DB.requests].filter(r=>r&&Array.isArray(r.rows)&&r.rows.length).sort((a,b)=>b.createdAt-a.createdAt);
const WEEK_MS=7*86400000,MONTH_MS=30*86400000;
const activeList=()=>sorted().filter(r=>!r.archivedAt&&!r.contractedAt);
const pastList=()=>sorted().filter(r=>r.archivedAt&&!r.contractedAt);
const contractList=()=>sorted().filter(r=>r.contractedAt);
const HALFYEAR_MS=180*86400000,TWOWEEK_MS=14*86400000;
function isFullbookReq(r){return r.status==='answered'&&r.rows.length>0&&r.rows.every((row,i)=>availOf(r,row,i).k==='no');}
function sweep(){const now=Date.now();let ch=false;
  DB.vault=DB.vault||[];DB.fullbook=DB.fullbook||{};
  Object.keys(DB.fullbook).forEach(k=>{if(now-DB.fullbook[k]>HALFYEAR_MS){delete DB.fullbook[k];ch=true;}});
  DB.requests=DB.requests.filter(r=>{
    if(r.archivedAt&&!r.contractedAt&&now-r.archivedAt>MONTH_MS){
      if(isFullbookReq(r)&&r.answeredAt&&now-r.answeredAt<HALFYEAR_MS)return true;
      DB.vault.push(r);ch=true;return false;}
    return true;});
  DB.requests.forEach(r=>{
    if(!r.archivedAt&&!r.contractedAt){
      const base=r.quoteSent?(r.quoteSentAt||r.answeredAt||r.createdAt):r.createdAt;
      if(now-base>WEEK_MS){r.archivedAt=now;ch=true;}}
    if(r.status==='answered'&&r.answerComplete===undefined){r.answerComplete=allDone(r);ch=true;}
    if(r.status==='answered'&&r.answerComplete&&!r.checkerHidden&&r.answeredAt){
      const limit=isFullbookReq(r)?HALFYEAR_MS:TWOWEEK_MS;
      if(now-r.answeredAt>limit){r.checkerHidden=true;ch=true;}}});
  if(ch)saveDB();}
function recordFullbook(req){DB.fullbook=DB.fullbook||{};
  req.rows.forEach((row,i)=>{if(!row.hotel)return;
    rDates(req,row,i).dates.forEach(iso=>{const c=(req.ws||{})[row.id+'|'+iso];
      if(c&&c.status==='so')DB.fullbook[row.hotel+'|'+iso]=Date.now();});});}
function applyFullbook(req){let n=0;DB.fullbook=DB.fullbook||{};
  req.rows.forEach((row,i)=>{if(!row.hotel)return;
    rDates(req,row,i).dates.forEach(iso=>{const k=row.id+'|'+iso;
      if(DB.fullbook[row.hotel+'|'+iso]&&!((req.ws||{})[k]&&req.ws[k].status)){
        req.ws[k]=req.ws[k]||{};req.ws[k].status='so';n++;}});});
  return n;}
function downloadBackup(){
  const data={exportedAt:new Date().toISOString(),requests:DB.requests,vault:DB.vault||[],fullbook:DB.fullbook||{},phones:DB.phones||{}};
  const d=new Date(),fn='룸체크백업_'+d.getFullYear()+String(d.getMonth()+1).padStart(2,'0')+String(d.getDate()).padStart(2,'0')+'.json';
  const a=document.createElement('a');
  a.href=URL.createObjectURL(new Blob([JSON.stringify(data,null,1)],{type:'application/json'}));
  a.download=fn;a.click();toast(T('t_backup'));}
function upsert(req){const i=DB.requests.findIndex(r=>r.id===req.id);if(i>=0)DB.requests[i]=req;else DB.requests.push(req);saveDB();}

/* ================= 공유 URL ================= */
function encodeReq(req){
  const valid=new Set();req.rows.forEach((r,i)=>rDates(req,r,i).dates.forEach(iso=>valid.add(r.id+'|'+iso)));
  const ws={};Object.keys(req.ws||{}).forEach(k=>{const c=req.ws[k];if(valid.has(k)&&c&&(c.status||c.price))ws[k]=c;});
  return btoa(unescape(encodeURIComponent(JSON.stringify({v:2,req:{...req,ws}}))));}
const reqURL=req=>location.href.split('#')[0]+'#q='+encodeReq(req);
function loadHash(){try{const m=(location.hash||'').match(/^#q=(.*)$/);if(!m)return null;
  const o=JSON.parse(decodeURIComponent(escape(atob(m[1]))));return (o&&o.v===2&&o.req)?o.req:null;}catch(e){return null;}}
function copyText(t,msg){(navigator.clipboard?navigator.clipboard.writeText(t):Promise.reject())
  .then(()=>toast(msg)).catch(()=>{const ta=document.createElement('textarea');ta.value=t;document.body.appendChild(ta);ta.select();
    try{document.execCommand('copy');toast(msg);}catch(e){toast('복사 실패 — 길게 눌러 복사하세요');}document.body.removeChild(ta);});}

/* ================= UI 상태 ================= */
let ui={role:(typeof PAGE!=='undefined'?PAGE:'agent'),sel:null,ssel:null,notesOpen:false,open:new Set(),optOpen:new Set(),hnOpen:new Set(),checkReqOpen:new Set(),checkExpand:new Set(),chkListOpen:new Set(),formChkOpen:new Set(),recOpen:new Set(),moreOpen:false,qIdx:0,qStep:new Set([1]),tabStaff:'all',qOpen:false,pastOpen:false,conOpen:false,qbOpen:null,phAdd:new Set()};
/* ================= 언어 (i18n.js의 LPACK 사용) ================= */
function lang(){if(FORCE_KO)return 'ko';DB.langs=DB.langs||{};const a=LANG_ALLOWED[ui.role]||['ko'];let l=DB.langs[ui.role]||a[0];if(!a.includes(l))l=a[0];return l;}
function T(k){const p=LPACK[lang()]||LPACK.ko;const s=p[k]!==undefined?p[k]:LPACK.ko[k];return s===undefined?k:s;}
function TF(k,vals){let s=T(k);Object.keys(vals||{}).forEach(x=>{s=s.split('{'+x+'}').join(vals[x]);});return s;}
const dOpt=n=>isEN()?(OPT_EN[n]||n):n;
const HOTEL_KO={},RT_KO={};Object.keys(HOTEL_EN).forEach(k=>HOTEL_KO[HOTEL_EN[k]]=k);Object.keys(RT_EN).forEach(k=>RT_KO[RT_EN[k]]=k);
const RG_DISP=n=>n==='전체'?(isEN()?'All':'전체'):dRegion(n);
function renderHdrRight(){
  const box=document.getElementById('hdrRight');if(!box)return;
  const a=LANG_ALLOWED[ui.role]||['ko'];
  const chips=a.length<2?'':a.map(l=>'<button class="chip'+(l===lang()?' on':'')+'" data-lang="'+l+'">'+LANG_NAMES[l]+'</button>').join('');
  const bell=SRV.on?'<button class="chip bellbtn" id="bellBtn">🔔'+(visUnread()?'<span class="bellbadge">'+(visUnread()>9?'9+':visUnread())+'</span>':'')+'</button>':'';
  let items='';
  if(SRV.on){
    items+='<div class="mitem mname">👤 '+esc(SRV.me.name)+'</div>'
      +'<a class="mitem" href="profile.html">'+T('myinfo')+'</a>'+((SRV.me.role==='sreq'||SRV.me.role==='schk'||(SRV.me.role==='admin'&&!SRV.me.super))?'<a class="mitem" href="myoffdays.html">🛌 '+T('m_offday')+'</a>':'')+(SRV.me.role==='admin'?'<a class="mitem" href="admin.html">🏠 관리자</a><a class="mitem" href="request.html">📝 요청자</a><a class="mitem" href="check.html">✓ 확인자</a><a class="mitem" href="agent.html">🤝 에이전트</a>':'')
      +((ui.role==='sreq'||ui.role==='schk')?'<button class="mitem'+(SRV.me.tg?' on':'')+'" id="tgBtn">'+(SRV.me.tg?T('tg_connected'):T('tg_connect'))+'</button>':'');
  }
  if(chips)items+='<div class="mitem mlang"><span style="margin-right:6px;font-size:15px">🌐</span>'+chips+'</div>';
  if(SRV.on)items+='<button class="mitem mout" id="logoutBtn">'+T('logout')+'</button>';
  const chipKey={agent:'chip_agent',sreq:'chip_sreq',schk:'chip_schk'}[ui.role]||'chip_agent';
  const nameChip='<span class="pagechip pc-'+ui.role+'" style="cursor:default">'+esc(meNick()||T(chipKey))+'</span>';
  box.innerHTML='<div class="hdrchips">'+nameChip+bell
    +(items?'<button class="chip'+(ui.menuOpen?' on':'')+'" id="menuBtn">☰</button>':'')+'</div>'
    +(items&&ui.menuOpen?'<div class="menupanel">'+items+'</div>':'');
}
function langSwitchHTML(){
  renderHdrRight();
  return ui.notifOpen?notifPanelHTML():'';
}
function visNotifs(){var items=NOTIF.items||[];if(ui.role==='agent'){var me=[meName(),meNick()].filter(Boolean).map(function(x){return String(x).trim();});items=items.filter(function(n){var a=n.p&&n.p.agent;return a?me.indexOf(String(a).trim())>=0:false;});}return items;}
function visUnread(){return visNotifs().filter(function(n){return n.new;}).length;}
function notifPanelHTML(){
  const items=(visNotifs()).map(n=>{
    const key={new_request:'nt_new_request',answered:'nt_answered',partial:'nt_partial',quote_requested:'nt_quote_requested',quote_sent:'nt_quote_sent'}[n.type]||n.type;
    const sub=[n.p&&n.p.hotels?escT(n.p.hotels):'',n.p&&n.p.agent?escT(n.p.agent):''].filter(Boolean).join(' · ');
    return '<div class="ntitem'+(n.new?' ntnew':'')+'"><div class="ntline1">'+T(key)+' <b>'+esc(n.no||'')+'</b></div>'
      +(sub?'<div class="ntline2">'+sub+'</div>':'')
      +'<div class="ntline3">'+dotDateTime(n.at)+'</div></div>';
  }).join('');
  return '<div class="ntpanel">'+'<div class="nthead">'+T('notif_title')+'</div>'
    +(items||'<div class="ntitem"><div class="ntline2">'+T('notif_empty')+'</div></div>')+'</div>';
}
function bindLang(){
  document.querySelectorAll('[data-lang]').forEach(b=>b.onclick=()=>{DB.langs=DB.langs||{};DB.langs[ui.role]=b.dataset.lang;saveDB();applyChrome();
    if(SRV.on)fetch('api/me',{method:'PATCH',headers:{'Content-Type':'application/json'},body:JSON.stringify({lang:b.dataset.lang})}).catch(()=>{});
    renderApp();});
  const bb=document.getElementById('bellBtn');if(bb)bb.onclick=()=>{ui.notifOpen=!ui.notifOpen;
    if(ui.notifOpen&&NOTIF.unread){fetch('api/notif-read',{method:'POST'}).catch(()=>{});NOTIF.unread=0;(NOTIF.items||[]).forEach(n=>n.new=false);}
    renderApp();};
  const mb=document.getElementById('menuBtn');if(mb)mb.onclick=(e)=>{e.stopPropagation();ui.menuOpen=!ui.menuOpen;renderHdrRight();bindLang();};
  if(!window.__menuDoc){window.__menuDoc=true;document.addEventListener('click',function(e){if(ui.menuOpen&&!(e.target.closest&&(e.target.closest('.menupanel')||e.target.closest('#menuBtn')))){ui.menuOpen=false;renderHdrRight();bindLang();}});}
  const lb=document.getElementById('logoutBtn');if(lb)lb.onclick=()=>{fetch('api/logout',{method:'POST'}).finally(()=>location.href='login.html');};
  const tb=document.getElementById('tgBtn');if(tb)tb.onclick=async()=>{
    try{const r=await fetch('api/tg-link');const j=await r.json();
      if(j.url)window.open(j.url,'_blank');else toast('봇 설정이 아직 완료되지 않았습니다');}catch(e){}};
}
/* ================= 서버 동기화 ================= */
let AGENTS=[];
let SRV={on:false,rev:-1,me:null,nicks:{},shadow:{},shadowP:'',shadowF:'',timer:null,pushing:false};
let NOTIF={unread:0,items:[]};
const meName=()=>((SRV.on&&SRV.me&&SRV.me.name)||'');
const nickOf=n=>(n&&SRV.nicks&&SRV.nicks[n])||n||''; /* 서버 로그인 사용자 이름 (에이전시 부계정 포함) */
const meNick=()=>{if(!SRV.on||!SRV.me)return '';const a=SRV.me.agency;return SRV.me.nickname||(a&&a.nickname)||SRV.me.name||'';}; /* 표시용: 닉네임 우선, 없으면 이름 */
async function srvInit(){
  try{
    const r=await fetch('api/me',{cache:'no-store'});
    if(!r.ok)throw 0;
    const j=await r.json();
    if(!j||typeof j!=='object'||!('user' in j))throw 0;
    if(!j.user){location.href='login.html?to='+encodeURIComponent(ui.role);return false;}
    const pageOf={agent:'agent.html',sreq:'request.html',schk:'check.html',admin:'admin.html'};
    if(j.user.role!==ui.role&&j.user.role!=='admin'){location.href=pageOf[j.user.role]||'index.html';return false;}
    SRV.on=true;SRV.me=j.user;
    try{const _ar=await fetch('api/agents',{cache:'no-store'});if(_ar.ok)AGENTS=(await _ar.json()).agents||[];}catch(e){}
    loadHotelsFromAPI();   /* 호텔·지역·룸타입을 서버 목록으로 교체 (실패 시 기본 목록 유지) */
    DB.langs=DB.langs||{};
    if(j.user.lang&&(LANG_ALLOWED[ui.role]||[]).includes(j.user.lang))DB.langs[ui.role]=j.user.lang;
    await srvPull();
    setInterval(srvPull,12000);
  }catch(e){SRV.on=false;} /* 서버 없음 → 로컬 모드 */
  return true;
}
function srvApplyState(j){
  if('requests' in j){
    DB.requests=(j.requests||[]).map(function(r){if(r&&Array.isArray(r.ws)){var o={};for(var k in r.ws)o[k]=r.ws[k];r.ws=o;}return r;});
    DB.phones=j.phones||{};DB.fullbook=j.fullbook||{};DB.seq=j.seq||0;DB.seqA=j.seqA||0;DB.seqD=j.seqD||0;
    SRV.shadow={};DB.requests.forEach(r=>SRV.shadow[r.id]=JSON.stringify(r));
    SRV.shadowP=JSON.stringify(DB.phones);SRV.shadowF=JSON.stringify(DB.fullbook);
    try{localStorage.setItem(LSKEY,JSON.stringify(DB));}catch(e){_mem=DB;}
  }
  if(j.notifs)NOTIF=j.notifs;
  SRV.rev=j.rev;
}
async function srvPull(){
  if(!SRV.on)return;
  await srvFlush();
  try{
    const r=await fetch('api/state?rev='+SRV.rev,{cache:'no-store'});
    if(!r.ok)return;
    const j=await r.json();
    const hadData='requests' in j;
    const editing=document.activeElement&&['INPUT','TEXTAREA','SELECT'].includes(document.activeElement.tagName);
    if(hadData&&editing)return;
    if(hadData){const dirty=(DB.requests||[]).some(x=>SRV.shadow[x.id]!==JSON.stringify(x));if(dirty){srvSchedule();return;}}
    const before=JSON.stringify(NOTIF);
    srvApplyState(j);
    if(hadData||before!==JSON.stringify(NOTIF))renderApp();
  }catch(e){}
}
function srvSchedule(){if(!SRV.on)return;clearTimeout(SRV.timer);SRV.timer=setTimeout(srvFlush,400);}
async function srvFlush(){
  if(!SRV.on)return;
  if(SRV.pushing){clearTimeout(SRV.timer);SRV.timer=setTimeout(srvFlush,500);return;}
  {var _seen={};DB.requests=(DB.requests||[]).filter(function(r){if(!r||r.id==null)return false;var e=_seen[r.id];if(e){e.ws=e.ws||{};var rw=r.ws||{};for(var k in rw){if(!e.ws[k]||(rw[k]&&rw[k].status&&!e.ws[k].status))e.ws[k]=rw[k];}return false;}_seen[r.id]=r;return true;});}
  const changed=[],ids=new Set();
  DB.requests.forEach(r=>{ids.add(String(r.id));const js=JSON.stringify(r);if(SRV.shadow[r.id]!==js)changed.push(r);});
  const dels=Object.keys(SRV.shadow).filter(id=>!ids.has(id)).map(Number);
  const pj=JSON.stringify(DB.phones||{}),fj=JSON.stringify(DB.fullbook||{});
  const body={};
  if(changed.length)body.requests=changed;
  if(pj!==SRV.shadowP)body.phones=DB.phones||{};
  if(fj!==SRV.shadowF)body.fullbook=DB.fullbook||{};
  if(!body.requests&&!body.phones&&!body.fullbook&&!dels.length)return;
  SRV.pushing=true;
  try{
    if(body.requests||body.phones||body.fullbook){
      const r=await fetch('api/sync',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});
      const j=await r.json();
      if(j&&j.ok){
        changed.forEach(x=>SRV.shadow[x.id]=JSON.stringify(x));
        SRV.shadowP=pj;SRV.shadowF=fj;SRV.rev=j.rev;
        (j.fixes||[]).forEach(f=>{const q=byId(f.id);if(q){q.no=f.no;SRV.shadow[q.id]=JSON.stringify(q);}});
        if((j.fixes||[]).length){try{localStorage.setItem(LSKEY,JSON.stringify(DB));}catch(e){}renderApp();}
      }
    }
    if(dels.length){
      await fetch('api/delete',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({ids:dels})});
      dels.forEach(id=>delete SRV.shadow[id]);
    }
  }catch(e){clearTimeout(SRV.timer);SRV.timer=setTimeout(srvFlush,3000);}
  finally{SRV.pushing=false;}
}
function applyChrome(){
  const chip={agent:'chip_agent',sreq:'chip_sreq',schk:'chip_schk'}[ui.role];
  const lede={agent:'lede_agent',sreq:'lede_sreq',schk:'lede_schk'}[ui.role];
  const l=document.querySelector('header .lede');if(l)l.textContent=T(lede);
  const sub={agent:'sub_agent',sreq:'sub_sreq',schk:'sub_schk'}[ui.role];const sb=document.querySelector('.brandsub');if(sb&&sub)sb.textContent=T(sub);
  document.title='너바나 · '+T(chip);
}
function phoneHTML(req,row){
  if(!(ui.role==='schk'||ui.role==='sreq'))return '';
  DB.phones=DB.phones||{};
  const nums=(row.hotel&&DB.phones[row.hotel])||[];
  const sel=row.phone&&nums.includes(row.phone)?row.phone:(row.phone||nums[0]||'');
  /* 별도 "전화" 버튼 대신 번호 앞의 📞 아이콘 자체를 통화 링크로 쓴다 */
  let os=nums.map(n=>opt(n,esc(n),n===sel)).join('');
  if(sel&&!nums.includes(sel))os='<option value="'+esc(sel)+'" selected>'+esc(sel)+'</option>'+os;
  os+='<option value="__add">'+T('ph_add_opt')+'</option>';
  let h=sel?'<a class="phcall" href="tel:'+sel.replace(/[^+0-9]/g,'')+'" title="'+esc(T('ph_call'))+'">📞</a>':'';
  h+='<select class="phSel" data-prid="'+row.id+'" style="width:auto;flex:0 1 auto;padding:7px 5px;font-size:12px;font-family:var(--mono)">'
    +((nums.length||sel)?'':'<option value="" selected>'+T('ph_none')+'</option>')+os+'</select>';
  if(ui.phAdd.has(row.id))h+='<input class="phNew" data-prid="'+row.id+'" placeholder="'+esc(T('ph_new'))+'" style="width:150px;flex:0 0 auto;padding:7px 8px;font-size:12px;font-family:var(--mono)">';
  if(ui.role==='schk'||ui.role==='sreq')
    h+='<input class="phWho" data-prid="'+row.id+'" value="'+esc(row.confirmedBy||'')+'" placeholder="'+esc(T('ph_who'))+'" style="width:104px;flex:0 0 auto;padding:7px 8px;font-size:12px">';
  return h;
}
/* 추가 호텔용 전화/담당자 UI — 호텔1의 phoneHTML과 동일한 구성 */
function chkPhoneHTML(req,chk,chkId){
  if(!(ui.role==='schk'||ui.role==='sreq'))return '';
  DB.phones=DB.phones||{};
  const nums=(chk.hotel&&DB.phones[chk.hotel])||[];
  const sel=chk.phone&&nums.includes(chk.phone)?chk.phone:(chk.phone||nums[0]||'');
  /* 호텔1과 동일: 별도 "전화" 버튼 없이 📞 아이콘이 통화 링크 */
  let os=nums.map(n=>opt(n,esc(n),n===sel)).join('');
  if(sel&&!nums.includes(sel))os='<option value="'+esc(sel)+'" selected>'+esc(sel)+'</option>'+os;
  os+='<option value="__add">'+T('ph_add_opt')+'</option>';
  let h=sel?'<a class="phcall" href="tel:'+sel.replace(/[^+0-9]/g,'')+'" title="'+esc(T('ph_call'))+'">📞</a>':'';
  h+='<select class="chkPhSel" data-chkid="'+chkId+'" style="width:auto;flex:0 1 auto;padding:7px 5px;font-size:12px;font-family:var(--mono)">'
    +((nums.length||sel)?'':'<option value="" selected>'+T('ph_none')+'</option>')+os+'</select>';
  if(ui.phAdd.has(chkId))h+='<input class="chkPhNew" data-chkid="'+chkId+'" placeholder="'+esc(T('ph_new'))+'" style="width:150px;flex:0 0 auto;padding:7px 8px;font-size:12px;font-family:var(--mono)">';
  if(ui.role==='schk'||ui.role==='sreq')
    h+='<input class="chkPhWho" data-chkid="'+chkId+'" value="'+esc(chk.manager||'')+'" placeholder="'+esc(T('ph_who'))+'" style="width:104px;flex:0 0 auto;padding:7px 8px;font-size:12px">';
  return h;
}
function draftFromReq(r){const base=Date.now();
  return {mode:r.mode,startDate:r.startDate,sharedNights:r.sharedNights||1,sharedRooms:(r.mode==='parallel'&&r.rows[0]?r.rows[0].rooms:1),
    agent:r.agent||'',agentManager:r.agentManager||'',registrant:r.registrant||'심은선',manager:'',notes:r.notes||'',quoteAsk:false,
    _quote:(Array.isArray(r.quotes)&&r.quotes[0])?JSON.parse(JSON.stringify(r.quotes[0])):(r.quote?JSON.parse(JSON.stringify(r.quote)):null),
    _wsn:r.rows.map((row,i)=>rDates(r,row,i).dates.map(iso=>{const c=(r.ws||{})[row.id+'|'+iso]||{};return {price:c.price||''};})),
    rows:r.rows.map((row,i)=>({id:base+i,region:row.region||'전체',hotel:row.hotel||'',roomType:row.roomType||'',rooms:row.rooms||1,nights:row.nights||1,note:row.note||'',
      options:(row.options||[]).map((o,j)=>({id:base+100+i*10+j,name:o.name,qty:o.qty||1,amt:o.amt||0,show:o.show!==false,memo:o.memo||''})),checkRequests:(row.checkRequests||[])}))};}
function newDraft(prev){return {mode:'multi',startDate:todayISO(),sharedNights:1,sharedRooms:1,
  agent:prev?prev.agent:(DB.agentName||''),agentManager:prev?prev.agentManager:'',registrant:prev?prev.registrant:'심은선',manager:'',notes:'',quoteAsk:false,
  rows:[{id:Date.now(),region:'전체',hotel:'',roomType:'',rooms:1,nights:1,note:'',options:[],checkRequests:[]}]};}
let draft=newDraft();

/* ================= 상태/뱃지 ================= */
function reqStateCls(req){
  if(ui.role==='agent'&&req.direct&&!req.forwardedAt)return 'ls-wait';
  if(req.contractedAt)return 'ls-contract';
  if(req.status==='requested'&&req.direct&&!req.quoteSent)return 'ls-direct';
  if(req.quoteSent)return 'ls-quote';
  if(req.status==='requested')return req.quoteRequested?'ls-qreq':'ls-wait';
  if(req.quoteRequested)return 'ls-qreq';
  return 'ls-done';}
function reqBadge(req,forStaff){
  if(ui.role==='agent'&&req.direct&&!req.forwardedAt)return '<span class="badge b-direct">전송 대기</span>';
  if(req.contractedAt)return '<span class="badge b-contract">'+T('b_contract')+'</span>';
  if(req.status==='answered'&&isFullbookReq(req))return '<span class="badge" style="background:var(--soBg);color:var(--so)">'+T('b_fullbook')+'</span>';
  if(req.status==='requested'&&req.quoteSent)return '<span class="badge b-quote">'+(forStaff?T('b_quote_staff'):T('b_quote'))+'</span>';
  if(req.status==='requested'&&req.direct)return '<span class="badge b-direct">'+T('b_direct')+'</span>';
  if(req.status==='requested'){const prog=forStaff&&totalCount(req)>1&&doneCount(req)>0?' '+doneCount(req)+'/'+totalCount(req):'';
    return req.quoteRequested
    ? '<span class="badge b-wait">'+(forStaff?T('b_wait_staff'):T('b_wait'))+prog+'</span><span class="badge b-qreq">'+(forStaff?T('b_qreq_staff'):T('b_qreq'))+'</span>'
    : '<span class="badge b-wait">'+(forStaff?T('b_wait_staff'):T('b_wait'))+prog+'</span>';}
  const part=req.status==='answered'&&totalCount(req)>1&&!allDone(req);
  const resend=forStaff&&req.status==='answered'&&!req.answerComplete&&allDone(req);
  const ansB=part?'<span class="badge b-wait">'+T('b_partial')+' '+doneCount(req)+'/'+totalCount(req)+'</span>'
    :(resend?'<span class="badge b-qreq">'+T('b_resend')+'</span>':'<span class="badge b-done">'+T('b_done')+'</span>');
  if(req.quoteSent)return ansB+'<span class="badge b-quote">'+(forStaff?T('b_quote_staff'):T('b_quote'))+'</span>';
  if(req.quoteRequested)return ansB+'<span class="badge b-qreq">'+(forStaff?T('b_qreq_staff'):T('b_qreq'))+'</span>';
  return ansB;}
function availOf(req,row,i){
  const sts=rDates(req,row,i).dates.map(iso=>((req.ws||{})[row.id+'|'+iso]||{}).status||'');
  if(sts.every(s=>s==='av'))return{k:'ok',t:T('av_ok')};
  if(sts.every(s=>s==='so'))return{k:'no',t:T('av_no')};
  if(sts.some(s=>s==='so'))return{k:'part',t:T('av_part')};
  if(sts.some(s=>!s))return{k:'un',t:T('av_un')};
  if(sts.some(s=>s==='rq'))return{k:'rq',t:T('av_rq')};
  return{k:'un',t:T('av_un')};}
function rowDone(req,row,i){const ds=rDates(req,row,i).dates;return ds.length>0&&ds.every(iso=>(((req.ws||{})[row.id+'|'+iso]||{}).status));}
/* 추가 호텔도 호텔1과 동일한 기준(모든 날짜에 상태값 존재)으로 완료 판정 */
function chkDone(req,row,i,ci){const ds=rDates(req,row,i).dates;const cid=row.id+'_chk_'+ci;
  return ds.length>0&&ds.every(iso=>(((req.ws||{})[cid+'|'+iso]||{}).status));}
/* ===== 확인자 추천 =====
   추천은 요청자가 요청한 것이 아니므로 진행률에서 빠져야 한다. checkRequests와 한 배열에
   섞으면 totalCount가 함께 세어 "2/2 완료"가 "2/3 답변대기"로 되돌아간다 — 확인자가
   친절을 베풀수록 자기 일이 안 끝난 것처럼 보인다. 그래서 row.recommends라는 별도
   배열에 둔다. totalCount가 이 배열을 아예 볼 수 없으니 구조적으로 오염되지 않는다.
   targetId = 이 추천이 대신하려는 대상(호텔 행 id 또는 추가호텔 chkId). */
/* ฿ 원가(호텔 실요금)는 내부 값이다 — 에이전트에게는 견적 금액(₩)만 보여야 한다.
   요청자·확인자만 원가를 볼 수 있다. */
const costVisible=()=>ui.role==='sreq'||ui.role==='schk';
function recsFor(row,targetId){return (row.recommends||[]).filter(r=>String(r.targetId)===String(targetId));}
const recKey=rec=>'rec_'+rec.id;
/* 등록된 호텔 전체 개수 = 호텔1..N + 각 호텔의 추가 호텔 (추천은 제외) */
function totalCount(req){return req.rows.reduce((a,r)=>a+1+((r.checkRequests||[]).length),0);}
function doneCount(req){return req.rows.reduce((a,r,i)=>
  a+(rowDone(req,r,i)?1:0)+((r.checkRequests||[]).filter((c,ci)=>chkDone(req,r,i,ci)).length),0);}
function allDone(req){return doneCount(req)===totalCount(req);}
function agentLine(req){const p=[];if(req.agent)p.push(T('agent_w')+' '+nickOf(req.agent));if(req.manager)p.push(T('mgr_w')+' '+nickOf(req.manager));return p.join(' · ')||T('no_mgr');}
const AVKO={ok:'av_ok',no:'av_no',part:'av_part',un:'av_un',rq:'av_rq'};
const avKo=av=>LPACK.ko[AVKO[av.k]]||av.t;
const reqNo=req=>(req.direct?'D-':'A-')+String((req.no||0).toString(36)).toUpperCase().padStart(5,'0');

/* ================= 렌더 루트 ================= */
function renderApp(){
  const app=document.getElementById('app');
  const dl=document.getElementById('optdl');if(dl)dl.innerHTML=OPTLIST.map(o=>'<option>'+esc(dOpt(o))+'</option>').join('');
  if(ui.role==='agent'){app.innerHTML=langSwitchHTML()+formHTML()+agentListHTML();bindForm();bindAgentList();}
  else if(ui.role==='sreq'){app.innerHTML=langSwitchHTML()+formHTML()+staffListHTML();bindForm();bindStaff();}
  else if(ui.role==='schk'){app.innerHTML=langSwitchHTML()+staffListHTML();bindStaff();}
  else{app.innerHTML=langSwitchHTML()+staffListHTML();bindStaff();}
  bindLang();
}
function checkerHTML(){
  return '<section class="card"><div class="label">'+T('checker_label')+'</div>'
    +'<input id="checker" value="'+esc(DB.checker||'')+'" placeholder="'+esc(T('checker_ph'))+'"></section>';
}

/* ================= ① 요청자(에이전트) 폼 ================= */
function agentSelOpts(cur){var opts='<option value="">'+escT(T('ph_sel_input'))+'</option>';var names=AGENTS.map(function(a){return a.name;});AGENTS.forEach(function(a){var lbl=(a.nickname&&a.nickname!==a.name)?(a.nickname+' ('+a.name+')'):a.name;opts+='<option value="'+esc(a.name)+'"'+(a.name===cur?' selected':'')+'>'+escT(lbl)+'</option>';});if(cur&&names.indexOf(cur)<0)opts+='<option value="'+esc(cur)+'" selected>'+escT(cur)+'</option>';return opts;}
function formHTML(){
  const d=draft;
  const dateArea = d.mode==='parallel'
    ? '<div class="dategrid">'
      +'<div class="datewrap" style="grid-area:1/1"><span class="dlab">'+T('checkin')+'</span><input class="dateinput" readonly data-target="global" data-kind="in" value="'+fdate(d.startDate)+'"><button class="calico calOpen" data-target="global" data-kind="in" title="'+esc(T('cal_open'))+'">📅</button></div>'
      +'<div class="datewrap" style="grid-area:2/1"><span class="dlab">'+T('checkout')+'</span><input class="dateinput" readonly data-target="global" data-kind="out" value="'+fdate(finalOut(d))+'"><button class="calico calOpen" data-target="global" data-kind="out" title="'+esc(T('cal_open'))+'">📅</button></div>'
      +'<div class="dg-tall" style="grid-area:1/2/3/3"><div class="label">'+T('nights_label')+'</div><input type="number" id="pN" min="1" value="'+d.sharedNights+'"></div>'
      +'<div class="dg-tall" style="grid-area:1/3/3/4"><div class="label">'+T('rooms_label')+'</div><input type="number" id="pR" min="1" value="'+(d.sharedRooms||1)+'"></div>'
      +'</div>'
    : '<div class="line datel3">'
      +'<div><div class="label">'+T('checkin')+'</div><div class="autobox">'+fdate(d.startDate)+'</div></div>'
      +'<div><div class="label">'+T('final_checkout')+'</div><div class="autobox">'+fdate(finalOut(d))+'</div></div>'
      +'<div><div class="label">'+T('total_nights')+'</div><div class="autobox">'+totalN(d)+T('n_sfx')+'</div></div></div>';
  const blocks=d.rows.map((row,i)=>{
    const dd=rDates(d,row,i);
    const rlist=REGIONS.map(r=>opt(r,RG_DISP(r),r===row.region)).join('');
    const hdl=hotelsIn(row.region).map(h=>'<option value="'+esc(dHotel(h.name))+'">').join('');
    const rdl=roomsFor(row.hotel).map(r=>'<option value="'+esc(dRoom(r))+'">').join('');
    const dateRow = d.mode==='multi'
      /* B안: 날짜 범위를 칩 하나로 합치고, 박수·객실수는 독립 입력칸으로 오른쪽에 붙인다.
         라벨 1개와 달력 버튼 1개가 줄어 약 70px을 벌어 한 줄에 들어간다. */
      ? '<div class="brow">'
        +'<div class="brange"><div class="label">'+T('date_range')+'</div>'
          +'<div class="bchip calOpen" data-target="'+row.id+'" data-kind="in" title="'+esc(T('cal_open'))+'">'
            +'<span class="bdv">'+fdform(dd.checkIn)+'</span><span class="barw">→</span>'
            +'<span class="bdv">'+fdform(dd.checkOut)+'</span>'
            +'<span class="bcal">📅</span></div></div>'
        +'<div class="bqty"><div class="label">'+T('nights_label')+'</div>'
          +'<input type="number" class="inNights" min="1" value="'+row.nights+'"></div>'
        +'<div class="bqty"><div class="label">'+T('rooms_label')+'</div>'
          +'<input type="number" class="inRooms" min="1" value="'+row.rooms+'"></div></div>'
      : '<div style="margin-top:10px"><div class="label">'+T('date_common')+'</div><div class="datebox"><span class="dv">'+fdate(dd.checkIn)+'</span><span class="arrow">→</span><span class="dv">'+fdate(dd.checkOut)+'</span><span class="nightsb">'+dd.nights+T('n_sfx')+'</span><span class="nightsb">'+(d.sharedRooms||1)+T('r_sfx')+'</span></div></div>';
    /* 요청 리스트와 동일한 그룹 박스: 호텔 + 그 추가 호텔을 하나로 묶는다 */
    const nAdd=(row.checkRequests||[]).length+((ui.checkInputs&&ui.checkInputs[row.id])?ui.checkInputs[row.id].length:0);
    /* 추가 호텔이 있으면 기본으로 펼치고, 없으면 접는다.
       formChkOpen에 담긴 행은 사용자가 그 기본값을 뒤집은 것이다. */
    const addOpen=ui.formChkOpen.has(row.id)?!(nAdd>0):(nAdd>0);
    return '<div class="hgroup hg'+(i%3)+'" data-id="'+row.id+'">'
      +'<div class="hgrouphd"><span class="hgnum">'+(i+1)+'</span>'+T('hotel_n')+' '+(i+1)
      +'<span class="hgcnt">'+T('chk_more')+' '+nAdd+'</span></div>'
      +'<div class="gcard">'
      +'<div class="flex between aic"><span class="gclab">'+T('base_hotel')+'</span><button class="del btnDel" title="'+esc(T('del_hotel'))+'">−</button></div>'
      +'<div class="line lhotel" style="margin-top:8px">'
        +'<div><div class="label">'+T('region')+'</div><select class="selRegion">'+rlist+'</select></div>'
        +'<div><div class="label">'+T('hotel_sel')+'</div><input class="inHotel" list="hdl'+row.id+'" value="'+esc(dHotel(row.hotel))+'" placeholder="'+esc(T('ph_hotel'))+'"><datalist id="hdl'+row.id+'">'+hdl+'</datalist></div>'
        +'<div><div class="label">'+T('room_sel')+'</div><input class="inRoom" list="rdl'+row.id+'" value="'+esc(dRoom(row.roomType))+'" placeholder="'+esc(T('ph_room'))+'"><datalist id="rdl'+row.id+'">'+rdl+'</datalist></div></div>'
      +dateRow
      +'<div style="margin-top:10px"><div class="label">'+T('opt_label')+'</div>'
        +(row.options||[]).map(o=>{const custom=o._custom||(!!o.name&&!OPTLIST.includes(o.name));
          return '<div data-optid="'+o.id+'" style="margin-bottom:6px"><div class="flex aic" style="gap:6px">'
            +'<select class="optSel" style="flex:1"><option value="">'+T('opt_select')+'</option>'
            +OPTLIST.map(n=>opt(n,dOpt(n),!custom&&o.name===n)).join('')
            +'<option value="__c"'+(custom?' selected':'')+'>'+T('opt_custom')+'</option></select>'
            +'<input type="number" class="inOptQty" min="1" style="width:64px;flex:0 0 auto;text-align:center" value="'+(o.qty||1)+'" title="'+esc(T('qty_title'))+'"><button class="del optDel">−</button></div>'
            +(custom?'<input class="inOptName" style="margin-top:6px" value="'+esc(o.name)+'" placeholder="'+esc(T('ph_opt_custom'))+'">':'')
            +'</div>';}).join('')
        +'<button class="addbtn sm addOpt">'+T('add_opt')+'</button></div>'
      +'<div style="margin-top:8px"><button class="linkbtn hnTog">'+((ui.hnOpen.has(row.id)||row.note)?'▾':'▸')+' '+T('hotel_note')+'</button>'
        +((ui.hnOpen.has(row.id)||row.note)?'<textarea class="hnText" placeholder="'+esc(T('ph_hotel_note'))+'">'+escT(row.note||'')+'</textarea>':'')+'</div>'
      +'</div>' /* .gcard 닫기 */
      /* 추가 호텔 — 요청 리스트와 동일한 펼침 버튼 안에 넣는다 */
      +'<button class="chkListTog'+(addOpen?' open':'')+'" data-formchk="'+row.id+'">'
        +'<span class="chev'+(addOpen?' open':'')+'">▶</span>'
        +'<span>'+T('chk_more')+' ('+nAdd+')</span>'
        +'<span class="chkAddBtn addReqBtn" data-row="'+row.id+'">'+T('chk_add')+'</span></button>'
      +(addOpen?'<div class="chklist">'
          +'<div class="check-inputs-container" id="checkInputs'+row.id+'">'
            +((ui.checkInputs&&ui.checkInputs[row.id])?ui.checkInputs[row.id].map((inp,idx)=>'<div class="check-input-block subcard" data-tempid="'+inp.tempId+'">'
              +'<div class="flex between aic" style="margin-bottom:8px">'
                +'<span class="hgnum sub">'+(i+1)+'-'+((row.checkRequests||[]).length+idx+1)+'</span>'
                +'<button class="del" onclick="removeCheckInputRow('+row.id+',\''+inp.tempId+'\')">−</button>'
              +'</div>'
              +'<div class="line lhotel">'
                +'<div><div class="label">'+T('region')+'</div><select class="checkRegion" data-row="'+row.id+'" data-tempid="'+inp.tempId+'">'
                  +'<option value="">'+T('opt_select')+'</option>'
                  +REGIONS.map(r=>'<option value="'+esc(r)+'"'+(inp.region===r?' selected':'')+'>'+escT(dRegion(r))+'</option>').join('')
                +'</select></div>'
                +'<div><div class="label">'+T('hotel_sel')+'</div><input type="text" class="checkHotel" data-row="'+row.id+'" data-tempid="'+inp.tempId+'" list="chdl'+inp.tempId+'" placeholder="'+esc(T('ph_hotel'))+'" value="'+esc(inp.hotel)+'">'
                  +'<datalist id="chdl'+inp.tempId+'">'+hotelsIn(inp.region||'전체').map(h=>'<option value="'+esc(dHotel(h.name))+'">').join('')+'</datalist></div>'
                +'<div><div class="label">'+T('room_sel')+'</div><input type="text" class="checkRoom" data-row="'+row.id+'" data-tempid="'+inp.tempId+'" list="crdl'+inp.tempId+'" placeholder="'+esc(T('ph_room'))+'" value="'+esc(inp.roomType)+'">'
                  +roomDL('crdl'+inp.tempId,inp.hotel)+'</div>'
              +'</div>'
            +'</div>').join(''):''
          )+'</div>'
          +(row.checkRequests&&row.checkRequests.length
            ? row.checkRequests.map((req,j)=>{
                const reqDateArr=Array.from({length:diffD(req.checkInDate,req.checkOutDate)},(_,k)=>addDays(req.checkInDate,k));
                const isOpen=ui.checkReqOpen.has(req.id);
                return '<div class="subcard" data-id="'+req.id+'">'
                  +'<div class="flex between aic checkReqTog" data-row="'+row.id+'" data-reqid="'+req.id+'" style="cursor:pointer">'
                    +'<span class="hgnum sub">'+(i+1)+'-'+(j+1)+'</span>'
                    +'<span class="small" style="margin-left:7px;flex:1;min-width:0">'+escT(dRegion(req.region||'전체'))+(req.savedAt?' · '+kdotDateTime(req.savedAt):'')+'</span>'
                    +'<button class="del" onclick="event.stopPropagation();removeCheckRequest('+row.id+','+req.id+')">−</button>'
                  +'</div>'
                  +'<div class="line lhotel" style="margin-top:8px">'
                    +'<div><div class="label">'+T('region')+'</div><span style="font-weight:500">'+escT(dRegion(req.region||'전체'))+'</span></div>'
                    +'<div><div class="label">'+T('hotel_sel')+'</div><span style="font-weight:500">'+escT(dHotel(req.hotel))+'</span></div>'
                    +'<div><div class="label">'+T('room_sel')+'</div><span style="font-weight:500">'+escT(dRoom(req.roomType))+'</span></div>'
                  +'</div>'
                  +'<div class="line l2" style="margin-top:8px">'
                    +'<div><div class="label">'+T('chk_status')+'</div><select class="checkStatus" data-row="'+row.id+'" data-reqid="'+req.id+'">'
                      +'<option value="av"'+(req.status==='av'?' selected':'')+'>AV</option>'
                      +'<option value="rq"'+(req.status==='rq'?' selected':'')+'>RQ</option>'
                      +'<option value="so"'+(req.status==='so'?' selected':'')+'>S/O</option>'
                    +'</select></div>'
                    +'<div><div class="label">'+T('chk_price')+'</div>'
                      +'<input type="number" class="checkPrice" data-row="'+row.id+'" data-reqid="'+req.id+'" value="'+(req.price||'')+'" placeholder="'+esc(T('ws_price_ph'))+'"></div>'
                  +'</div>'
                  +'<div style="margin-top:8px"><div class="datebox"><span class="dv">'+fdate(req.checkInDate)+'</span><span class="arrow">→</span><span class="dv">'+fdate(req.checkOutDate)+'</span><span class="nightsb">'+diffD(req.checkInDate,req.checkOutDate)+T('n_sfx')+'</span></div></div>'
                  +(isOpen?
                    '<div style="margin-top:8px;padding:8px;background:#fff;border-radius:4px">'
                      +'<div style="font-size:12px;color:#666;margin-bottom:8px;font-weight:600">일일 현황</div>'
                      +'<div>'+
                        reqDateArr.map((iso,di)=>'<div style="display:flex;align-items:center;gap:8px;padding:6px 0;font-size:12px">'
                          +'<span style="flex:0 0 100px">'+fdate(iso)+'</span>'
                          +'<span class="status-badge" style="padding:3px 8px;border-radius:3px;font-size:11px;background:'+
                            (req.status==='confirmed'?'#10b981':req.status==='rejected'?'#ef4444':'#f59e0b')+
                            ';color:#fff;flex:0 0 auto">'
                            +(req.status==='confirmed'?'✅ 확정':req.status==='rejected'?'❌ 거절':'⏳ 대기')+
                          '</span>'
                          +'<span style="flex:1"></span>'
                          +'<span style="font-weight:600">'+won(req.price||0)+'</span>'
                        +'</div>').join('')+
                      '</div>'
                      +(req.priceNotes?'<div style="margin-top:8px;padding:8px;background:#fafafa;border-radius:4px;border:1px solid #f0f0f0;font-size:12px;color:#666;line-height:1.5">'+escT(req.priceNotes)+'</div>':'')
                    +'</div>'
                    :'')
                  +'</div>';
              }).join('')
            : '')
        +'</div>':'')
      +'</div>';
  }).join('');
  return '<section class="card">'
    +'<div class="label">'+T('mode_label')+'</div>'
    +'<div class="seg" id="mode"><button data-v="parallel"'+(d.mode==='parallel'?' class="on"':'')+'>'+T('mode_parallel')+'</button><button data-v="multi"'+(d.mode==='multi'?' class="on"':'')+'>'+T('mode_multi')+'</button></div>'
    +(ui.role==='sreq'
      ? '<div class="line l3">'
        +'<div><div class="label">'+T('agent_select')+'</div><select id="agent">'+agentSelOpts(d.agent)+'</select></div>'
        +'<div><div class="label">'+T('agent_mgr')+'</div><input id="agentMgr" list="dlAm" value="'+esc(d.agentManager||'')+'" placeholder="'+esc(T('ph_sel_input'))+'"><datalist id="dlAm">'+((DB.hist&&DB.hist.am)||[]).map(n=>'<option value="'+esc(n)+'">').join('')+'</datalist></div>'
        +'<div><div class="label">'+T('mgr_nirvana')+'</div><input id="regName" list="dlSt" value="'+esc(d.registrant||'심은선')+'" placeholder="'+esc(T('ph_input'))+'"><datalist id="dlSt">'+((DB.hist&&DB.hist.st)||[]).map(n=>'<option value="'+esc(n)+'">').join('')+'</datalist></div></div>'
      : '')
    +dateArea
    +'<div id="rows" style="margin-top:16px">'+blocks+'</div>'
    +'<button id="addRow" class="addbtn">'+T('add_hotel')+'</button>'
    +'<div class="memo"><div class="memohead" id="notesHead"><span class="chev'+(ui.notesOpen?' open':'')+'">▶</span> '+T('notes')+'</div>'
    +'<div class="memobody" id="notesBody" style="display:'+(ui.notesOpen?'block':'none')+'"><textarea id="notes" placeholder="'+esc(T('ph_notes'))+'">'+escT(d.notes)+'</textarea></div></div>'
    +(ui.role==='sreq'
      ? '<div style="display:flex;gap:8px;margin-top:14px">'
        +'<button id="run" class="cta" style="margin-top:0;flex:1;font-size:13.5px;padding:13px 6px;word-break:keep-all;line-height:1.35">'+T('btn_send_staff')+'</button>'
        +'<button id="runDirect" class="cta" style="margin-top:0;flex:1;font-size:13.5px;padding:13px 6px;background:#6C5CE7;word-break:keep-all;line-height:1.35">'+T('btn_direct')+'</button></div>'
      : '<div class="label" style="margin-top:16px">'+T('req_kind')+'</div>'
        +'<div style="display:flex;gap:8px;align-items:stretch;margin-top:6px">'
        +'<select id="qkind" style="flex:0 0 auto;width:auto;padding:0 12px">'
        +'<option value="0"'+((d.quoteKind||0)==0?' selected':'')+'>룸체크</option>'
        +'<option value="1"'+((d.quoteKind||0)==1?' selected':'')+'>견적 요청</option>'
        +'<option value="2"'+((d.quoteKind||0)==2?' selected':'')+'>룸체크+견적요청</option>'
        +'</select>'
        +'<button id="run" class="cta" style="flex:1;margin-top:0">요청 등록</button>'
        +'</div>')
    +'</section>';
}
/* Phase 2: 누적 입력 방식 - 새로운 입력 행 추가 */
window.addCheckInputRow=function(rowId){
  if(!ui.checkInputs)ui.checkInputs={};
  if(!ui.checkInputs[rowId])ui.checkInputs[rowId]=[];
  const tempId=Date.now()+'_'+(Math.random()*1e6|0);
  ui.checkInputs[rowId].push({
    tempId:tempId,
    region:'',
    hotel:'',
    roomType:'',
    phone:'',
    manager:'',
    status:'',
    price:0,
    detailNote:''
  });
  renderApp();
};

/* Phase 2: 임시 입력 행 삭제 */
window.removeCheckInputRow=function(rowId,tempId){
  if(!ui.checkInputs||!ui.checkInputs[rowId])return;
  ui.checkInputs[rowId]=ui.checkInputs[rowId].filter(r=>r.tempId!==tempId);
  renderApp();
};

/* Phase 2: 모든 입력을 최종 저장 */
window.saveCheckRequestsFromInputs=function(rowId){
  const rowIndex=draft.rows.findIndex(r=>r.id===rowId);
  if(rowIndex<0)return;
  const row=draft.rows[rowIndex];
  if(!ui.checkInputs||!ui.checkInputs[rowId]||ui.checkInputs[rowId].length===0){
    alert('추가할 호텔을 입력하세요');return;
  }
  const invalidInputs=ui.checkInputs[rowId].filter(inp=>!inp.hotel.trim());
  if(invalidInputs.length>0){alert('모든 호텔명을 입력하세요');return;}
  const dd=rDates(draft,row,rowIndex);
  row.checkRequests=row.checkRequests||[];
  ui.checkInputs[rowId].forEach(inp=>{
    row.checkRequests.push({
      id:Date.now()+'_'+(Math.random()*1e6|0),
      region:inp.region||row.region,
      hotel:inp.hotel.trim(),
      roomType:inp.roomType.trim()||'(미지정)',
      checkInDate:dd.checkIn,
      checkOutDate:dd.checkOut,
      phone:inp.phone?inp.phone.trim():'',
      manager:inp.manager?inp.manager.trim():'',
      bookingStatus:inp.status||'pending',
      status:'pending',
      requestedBy:ui.role,
      notes:'',
      price:Number(inp.price)||0,
      priceNotes:inp.detailNote?inp.detailNote.trim():''
    });
  });
  const addedCount=ui.checkInputs[rowId]?.length||0;
  delete ui.checkInputs[rowId];
  saveDB();
  renderApp();
  toast('✅ '+(addedCount||'호텔')+(addedCount>1?'개 호텔':'')+'이 추가되었습니다');
};
/* 확인자 추천 추가/삭제 — draft가 아니라 DB에 저장된 req를 직접 다룬다.
   확인자에게는 draft가 없으므로 saveCheckRequestsFromInputs()의 경로를 쓸 수 없다. */
window.addRecommend=function(reqId,rowId,targetId){
  const req=byId(Number(reqId));if(!req)return;
  const row=req.rows.find(r=>String(r.id)===String(rowId));if(!row)return;
  row.recommends=row.recommends||[];
  row.recommends.push({id:Date.now()+'_'+(Math.random()*1e6|0),targetId:String(targetId),
    region:row.region||'전체',hotel:'',roomType:'',phone:'',manager:'',
    by:ui.role,createdAt:Date.now()});
  saveDB();renderApp();
};
window.removeRecommend=function(reqId,rowId,recId){
  const req=byId(Number(reqId));if(!req)return;
  const row=req.rows.find(r=>String(r.id)===String(rowId));if(!row||!row.recommends)return;
  row.recommends=row.recommends.filter(r=>String(r.id)!==String(recId));
  saveDB();renderApp();
};
window.removeCheckRequest=function(rowId,reqId){
  const row=draft.rows.find(r=>r.id===rowId);
  if(!row||!row.checkRequests)return;
  if(!confirm('이 요청을 삭제하시겠습니까?'))return;
  row.checkRequests=row.checkRequests.filter(r=>r.id!==reqId);
  saveDB();
  renderApp();
  toast('✅ 요청이 삭제되었습니다');
};

window.toggleCheckRequest=function(rowId,reqId){
  if(!ui.checkReqOpen)ui.checkReqOpen=new Set();
  ui.checkReqOpen.has(reqId)?ui.checkReqOpen.delete(reqId):ui.checkReqOpen.add(reqId);
  renderApp();
};

/* Phase 2: 호텔/룸타입 목록 업데이트 */
window.updateCheckListsForRow=function(rowId){
  const hotelInput=document.querySelector('.checkHotel[data-row="'+rowId+'"]');
  const roomInput=document.querySelector('.checkRoom[data-row="'+rowId+'"]');
  if(!hotelInput||!roomInput)return;

  /* 호텔 목록 업데이트 */
  const hotelVal=(hotelInput.value||'').trim().toLowerCase();
  const hotels=new Set();
  draft.rows.forEach(r=>{if(r.hotel)hotels.add(r.hotel);});
  CHECK_HOTELS.forEach(h=>hotels.add(h));
  const filteredHotels=Array.from(hotels).filter(h=>!hotelVal||h.toLowerCase().includes(hotelVal)).sort();
  const hotelList=document.getElementById('checkHL'+rowId);
  if(hotelList)hotelList.innerHTML=filteredHotels.map(h=>'<option value="'+esc(h)+'">').join('');

  /* 룸타입 목록 업데이트 */
  const roomVal=(roomInput.value||'').trim().toLowerCase();
  const rooms=new Set();
  draft.rows.forEach(r=>{if(r.roomType)rooms.add(r.roomType);});
  CHECK_ROOMS.forEach(r=>rooms.add(r));
  const filteredRooms=Array.from(rooms).filter(r=>!roomVal||r.toLowerCase().includes(roomVal)).sort();
  const roomList=document.getElementById('checkRL'+rowId);
  if(roomList)roomList.innerHTML=filteredRooms.map(r=>'<option value="'+esc(r)+'">').join('');
};

/* Phase 2: 상태 관리 함수 */
window.updateCheckRequestStatus=function(rowId,reqId,newStatus,price,priceNotes){
  const row=draft.rows.find(r=>r.id===rowId);
  if(!row||!row.checkRequests)return;
  const req=row.checkRequests.find(r=>r.id===reqId);
  if(!req)return;
  req.status=newStatus;
  if(price!==undefined)req.price=Number(price)||0;
  if(priceNotes!==undefined)req.priceNotes=(priceNotes||'').trim();
  req.confirmedAt=Date.now();
  req.confirmedBy=ui.nickname||ui.name||'미정';
  saveDB();
  renderApp();
  const msg=newStatus==='confirmed'?'✅ 확인 완료':'❌ 거절됨';
  toast(msg);
};
window.toggleCheckEdit=function(reqId){
  if(!ui.checkEditOpen)ui.checkEditOpen=new Set();
  ui.checkEditOpen.has(reqId)?ui.checkEditOpen.delete(reqId):ui.checkEditOpen.add(reqId);
  renderApp();
};

/* 확인자용 추가 호텔 함수들 */
window.agentAddCheckInputRow=function(reqId){
  if(!ui.agentCheckInputs)ui.agentCheckInputs={};
  if(!ui.agentCheckInputs[reqId])ui.agentCheckInputs[reqId]=[];
  const tempId=Date.now()+'_'+(Math.random()*1e6|0);
  ui.agentCheckInputs[reqId].push({
    tempId:tempId,
    region:'',
    hotel:'',
    roomType:'',
    phone:'',
    manager:'',
    status:'',
    price:0,
    detailNote:''
  });
  renderApp();
};

window.agentRemoveCheckInputRow=function(reqId,tempId){
  if(!ui.agentCheckInputs||!ui.agentCheckInputs[reqId])return;
  ui.agentCheckInputs[reqId]=ui.agentCheckInputs[reqId].filter(r=>r.tempId!==tempId);
  renderApp();
};

window.saveAgentCheckInputs=function(reqId){
  const req=byId(reqId);
  if(!req)return;
  if(!ui.agentCheckInputs||!ui.agentCheckInputs[reqId]||ui.agentCheckInputs[reqId].length===0){
    toast('추가할 호텔을 입력하세요');return;
  }
  const invalidInputs=ui.agentCheckInputs[reqId].filter(inp=>!inp.hotel.trim());
  if(invalidInputs.length>0){alert('모든 호텔명을 입력하세요');return;}

  req.checkerAddedHotels=req.checkerAddedHotels||[];
  ui.agentCheckInputs[reqId].forEach(inp=>{
    req.checkerAddedHotels.push({
      id:Date.now()+'_'+(Math.random()*1e6|0),
      region:inp.region||'전체',
      hotel:inp.hotel.trim(),
      roomType:inp.roomType.trim()||'(미지정)',
      phone:inp.phone?inp.phone.trim():'',
      manager:inp.manager?inp.manager.trim():'',
      bookingStatus:inp.status||'pending',
      checkInDate:req.startDate,
      checkOutDate:req.rows[0]?rDates(req,req.rows[0],0).checkOut:addDays(req.startDate,1),
      price:Number(inp.price)||0,
      priceNotes:inp.detailNote?inp.detailNote.trim():'',
      addedBy:ui.nickname||ui.name||'미정',
      addedAt:Date.now()
    });
  });
  const addedCount=ui.agentCheckInputs[reqId]?.length||0;
  delete ui.agentCheckInputs[reqId];
  saveDB();
  renderApp();
  toast('✅ '+(addedCount||'호텔')+(addedCount>1?'개 호텔':'')+'이 추가되었습니다');
};
function bindForm(){
  const d=draft;
  document.querySelectorAll('#mode button').forEach(b=>b.onclick=()=>{d.mode=b.dataset.v;renderApp();});
  const ag=document.getElementById('agent');if(ag)ag.onchange=e=>{d.agent=e.target.value;};
  const am=document.getElementById('agentMgr');if(am)am.oninput=e=>{d.agentManager=e.target.value;};
  const rg=document.getElementById('regName');if(rg)rg.oninput=e=>{d.registrant=e.target.value;};
  const nt=document.getElementById('notes');if(nt)nt.oninput=e=>{d.notes=e.target.value;};
  const nh=document.getElementById('notesHead');if(nh)nh.onclick=()=>{ui.notesOpen=!ui.notesOpen;renderApp();};
  var _qk=document.getElementById('qkind');if(_qk)_qk.onchange=function(e){d.quoteKind=Number(e.target.value)||0;};
  const pN=document.getElementById('pN');if(pN)pN.onchange=e=>{d.sharedNights=Math.max(1,Number(e.target.value)||1);renderApp();};
  const pR=document.getElementById('pR');if(pR)pR.onchange=e=>{d.sharedRooms=Math.max(1,Number(e.target.value)||1);renderApp();};
  const openFromEl=el=>{
    const t=el.dataset.target,mode=el.dataset.kind==='out'?'out':'range';
    if(t==='global')openCal({type:'global'},d.startDate,finalOut(d),mode);
    else{const row=d.rows.find(r=>r.id===Number(t)),i=d.rows.indexOf(row),dd=rDates(d,row,i);openCal({type:'row',rowId:row.id},dd.checkIn,dd.checkOut,mode);}
  };
  document.querySelectorAll('.calOpen').forEach(b=>b.onclick=()=>openFromEl(b));
  /* 날짜는 수기 입력 불가 — 클릭하면 달력 (첵인=범위 선택, 첵아웃=첵아웃만) */
  document.querySelectorAll('.dateinput').forEach(inp=>{inp.onclick=()=>openFromEl(inp);});
  /* 그룹 박스화(.hblock → .hgroup) 이후에도 붙도록 둘 다 잡는다 */
  document.querySelectorAll('#rows .hgroup[data-id], #rows .hblock[data-id]').forEach(el=>{
    const id=Number(el.dataset.id),row=d.rows.find(r=>r.id===id),i=d.rows.indexOf(row);
    /* 지역을 바꾸면 앞서 고른 호텔·룸타입은 비운다 */
    const sr=el.querySelector('.selRegion');if(sr)sr.onchange=e=>{clearHotelPick(row,e.target.value);renderApp();};
    const hi=el.querySelector('.inHotel');if(hi){
      hi.oninput=e=>{row.hotel=HOTEL_KO[e.target.value]||e.target.value;};
      hi.onchange=e=>{applyHotelPick(row,e.target.value);renderApp();};
      attachHotelFinder(hi,()=>row.region,name=>{applyHotelPick(row,name);saveDB();renderApp();});
    }
    const ri=el.querySelector('.inRoom');if(ri){
      ri.oninput=e=>{row.roomType=RT_KO[e.target.value]||e.target.value;};
      ri.onchange=e=>{row.roomType=RT_KO[e.target.value]||e.target.value;renderApp();};
    }
    const n=el.querySelector('.inNights');if(n)n.onchange=e=>{row.nights=Math.max(1,Number(e.target.value)||1);renderApp();};
    const rm=el.querySelector('.inRooms');if(rm)rm.onchange=e=>{row.rooms=Math.max(1,Number(e.target.value)||1);};
    el.querySelectorAll('[data-optid]').forEach(o=>{const oid=Number(o.dataset.optid),op=(row.options||[]).find(x=>x.id===oid);
      const os=o.querySelector('.optSel');if(os)os.onchange=e=>{const v=e.target.value;
        if(v==='__c'){op._custom=true;if(OPTLIST.includes(op.name))op.name='';}
        else{op._custom=false;op.name=v;}
        renderApp();};
      const ci=o.querySelector('.inOptName');if(ci)ci.oninput=e=>{op.name=e.target.value;};
      const iq=o.querySelector('.inOptQty');if(iq)iq.onchange=e=>{op.qty=Math.max(1,Number(e.target.value)||1);};
      const od=o.querySelector('.optDel');if(od)od.onclick=()=>{if(confirm(T('confirm_delete'))){row.options=row.options.filter(x=>x.id!==oid);saveDB();renderApp();}};});
    const ao=el.querySelector('.addOpt');if(ao)ao.onclick=()=>{row.options=row.options||[];row.options.push({id:Date.now(),name:'',qty:1,amt:0,show:true,memo:''});renderApp();};
    const ht=el.querySelector('.hnTog');if(ht)ht.onclick=()=>{ui.hnOpen.has(id)?ui.hnOpen.delete(id):ui.hnOpen.add(id);renderApp();};
    const hx=el.querySelector('.hnText');if(hx)hx.oninput=e=>{row.note=e.target.value;};
    const bd=el.querySelector('.btnDel');if(bd)bd.onclick=()=>{if(d.rows.length>1&&confirm(T('confirm_delete_hotel'))){d.rows=d.rows.filter(r=>r.id!==id);saveDB();renderApp();}};
  });
  const ar=document.getElementById('addRow');if(ar)ar.onclick=()=>{d.rows.push({id:Date.now(),region:'전체',hotel:'',roomType:'',rooms:1,nights:1,note:'',options:[],subOptions:[],checkRequests:[]});renderApp();};

  /* 추가 호텔 입력 폼 이벤트 바인딩 */
  document.querySelectorAll('.check-input-block').forEach(block=>{
    const tempId=block.dataset.tempid;
    const crEl=block.querySelector('.checkRegion');if(!crEl)return;
    const rowId=Number(crEl.dataset.row);
    const row=d.rows.find(r=>r.id===rowId);
    if(!row||!ui.checkInputs||!ui.checkInputs[rowId])return;
    const inp=ui.checkInputs[rowId].find(i=>i.tempId===tempId);
    if(!inp)return;

    crEl.onchange=e=>{clearHotelPick(inp,e.target.value);};   /* 지역 바뀌면 호텔·룸타입 비움 */
    const chEl=block.querySelector('.checkHotel');
    if(chEl){
      chEl.oninput=e=>{inp.hotel=e.target.value;};
      attachHotelFinder(chEl,()=>inp.region,name=>{
        applyHotelPick(inp,name);updateCheckListsForRow(rowId);renderApp();});
    }
    const croomEl=block.querySelector('.checkRoom');if(croomEl)croomEl.oninput=e=>{inp.roomType=e.target.value;};
    const cpEl=block.querySelector('.checkPrice');if(cpEl)cpEl.oninput=e=>{inp.price=Number(e.target.value)||0;};
  });

  /* Phase 3-E: 추가 요청 버튼 - 원스텝으로 새로운 호텔 필드 추가 */
  document.querySelectorAll('.addReqBtn').forEach(btn=>{
    btn.onclick=e=>{
      e.preventDefault();e.stopPropagation(); /* 펼침 버튼 토글까지 함께 실행되지 않게 */
      const rowId=Number(btn.dataset.row);
      ui.formChkOpen.delete(rowId);           /* 기본값(추가분 있음 → 펼침)으로 되돌려 항상 보이게 */
      addCheckInputRow(rowId);
    };
  });
  /* 입력 폼: 추가 호텔 섹션 펼침/접힘 */
  document.querySelectorAll('button.chkListTog[data-formchk]').forEach(b=>{
    b.onclick=e=>{
      if(e.target.closest('.chkAddBtn'))return;   /* ＋추가는 위 핸들러가 처리 */
      const rid=Number(b.dataset.formchk);
      ui.formChkOpen.has(rid)?ui.formChkOpen.delete(rid):ui.formChkOpen.add(rid);
      renderApp();};
  });

  /* 저장된 호텔 섹션 펼침/접힘 */
  document.querySelectorAll('.checkReqTog').forEach(tog=>{
    tog.onclick=e=>{
      e.stopPropagation();
      const reqId=tog.dataset.reqid;
      if(!ui.checkReqOpen)ui.checkReqOpen=new Set();
      ui.checkReqOpen.has(reqId)?ui.checkReqOpen.delete(reqId):ui.checkReqOpen.add(reqId);
      renderApp();
    };
  });

  /* Phase 4-F: 추가 호텔 상태 실시간 변경 (호텔1과 동일) */
  document.querySelectorAll('.checkStatus').forEach(sel=>{
    sel.onchange=e=>{
      const rowId=Number(sel.dataset.row);
      const reqId=sel.dataset.reqid;
      const row=draft.rows.find(r=>r.id===rowId);
      if(!row||!row.checkRequests)return;
      const req=row.checkRequests.find(r=>r.id===reqId);
      if(req){
        req.status=sel.value;
        saveDB();
        renderApp();
        toast('✅ 상태가 변경되었습니다');
      }
    };
  });

  /* Phase 4: 추가 호텔 전화번호·담당자는 요청 입력 폼에서 제거됨(룸체크 워크시트에서 입력) */

  /* Phase 4-F: 추가 호텔 금액 저장 (호텔1과 동일, 숫자 입력) */
  document.querySelectorAll('input.checkPrice[data-reqid]').forEach(inp=>{
    inp.onchange=e=>{
      const rowId=Number(inp.dataset.row);
      const reqId=inp.dataset.reqid;
      const row=draft.rows.find(r=>r.id===rowId);
      if(!row||!row.checkRequests)return;
      const req=row.checkRequests.find(r=>r.id===reqId);
      if(req){
        const numVal=Math.round(Number(inp.value)||0);
        req.price=numVal;
        saveDB();
        renderApp();
        toast('✅ 금액이 저장되었습니다');
      }
    };
  });
  function doSubmit(direct){
    if(!d.rows.some(r=>r.hotel.trim())){toast(T('t_need_hotel1'));return;}
    if(d.mode==='parallel')d.rows.forEach(r=>{r.rooms=Math.max(1,Number(d.sharedRooms)||1);});
    DB.agentName=d.agent;
    var _sk=direct?'seqD':'seqA';DB[_sk]=(DB[_sk]||0)+1;
    DB.hist=DB.hist||{ag:[],am:[],st:[]};
    const pushHist=(arr,v)=>{v=(v||'').trim();if(v&&!arr.includes(v)){arr.unshift(v);if(arr.length>20)arr.pop();}};
    pushHist(DB.hist.ag,d.agent);pushHist(DB.hist.am,d.agentManager);pushHist(DB.hist.st,d.registrant);
    const req={id:Date.now(),no:DB[_sk],createdAt:Date.now(),status:'requested',direct:!!direct,
      quoteRequested:direct?false:((d.quoteKind||0)>0),quoteOnly:(d.quoteKind===1),quoteSent:false,answeredAt:null,
      registrant:(d.registrant||'심은선').trim()||'심은선',agentManager:(d.agentManager||'').trim(),
      mode:d.mode,startDate:d.startDate,sharedNights:d.sharedNights,agent:d.agent,manager:d.manager,notes:d.notes,
      rows:JSON.parse(JSON.stringify(d.rows)),ws:{},
      quotes:[mkQuote(1,d._quote?JSON.parse(JSON.stringify(d._quote)):null)]};
    if(d._wsn)req.rows.forEach((row,i)=>{const arr=d._wsn[i];if(!arr||!arr.length)return;
      rDates(req,row,i).dates.forEach((iso,k)=>{const v=arr[k]||arr[arr.length-1];
        if(v&&v.price){req.ws[row.id+'|'+iso]={price:v.price};}});});
    upsert(req);draft=newDraft(d);ui.open.clear();
    if(ui.role==='agent')ui.sel=req.id;else ui.ssel=req.id;
    renderApp();
    toast((direct?T('t_direct_reg'):T('t_registered'))+reqNo(req));
  }
  const run=document.getElementById('run');if(run)run.onclick=()=>{saveAllCheckInputs();doSubmit(false);};
  const rd=document.getElementById('runDirect');if(rd)rd.onclick=()=>{saveAllCheckInputs();doSubmit(true);};

  /* Phase 3-E: 중복 코드 제거 (789-805줄의 addReqBtn 핸들러로 통합됨) */
  /* 추가 호텔 개별 토글 버튼 */
  document.querySelectorAll('.checkReqTog').forEach(btn=>{
    btn.onclick=e=>{
      e.preventDefault();
      const rowId=Number(btn.dataset.row);
      const reqId=btn.dataset.reqid;
      if(!ui.checkReqOpen)ui.checkReqOpen=new Set();
      ui.checkReqOpen.has(reqId)?ui.checkReqOpen.delete(reqId):ui.checkReqOpen.add(reqId);
      renderApp();
    };
  });

  /* Phase 2: 임시 입력 행 데이터 바인딩 */
  document.querySelectorAll('.checkHotel').forEach(inp=>{
    inp.addEventListener('input',e=>{
      const rowId=Number(inp.dataset.row);
      const tempId=inp.dataset.tempid;
      if(tempId&&ui.checkInputs&&ui.checkInputs[rowId]){
        const inp_row=ui.checkInputs[rowId].find(r=>r.tempId===tempId);
        if(inp_row)inp_row.hotel=e.target.value;
      }
      updateCheckListsForRow(rowId);
    });
    /* 입력을 마치면 지역이 따라오고 그 호텔의 룸타입을 받아온다 */
    inp.addEventListener('change',e=>{
      const rowId=Number(inp.dataset.row),tempId=inp.dataset.tempid;
      if(!(tempId&&ui.checkInputs&&ui.checkInputs[rowId]))return;
      const inp_row=ui.checkInputs[rowId].find(r=>r.tempId===tempId);
      if(!inp_row)return;
      applyHotelPick(inp_row,e.target.value);
      renderApp();
    });
  });
  document.querySelectorAll('.checkRoom').forEach(inp=>{
    inp.addEventListener('input',e=>{
      const rowId=Number(inp.dataset.row);
      const tempId=inp.dataset.tempid;
      if(tempId&&ui.checkInputs&&ui.checkInputs[rowId]){
        const inp_row=ui.checkInputs[rowId].find(r=>r.tempId===tempId);
        if(inp_row)inp_row.roomType=e.target.value;
      }
      updateCheckListsForRow(rowId);
    });
  });
  document.querySelectorAll('.checkRegion').forEach(sel=>{
    sel.addEventListener('change',e=>{
      const rowId=Number(sel.dataset.row);
      const tempId=sel.dataset.tempid;
      if(tempId&&ui.checkInputs&&ui.checkInputs[rowId]){
        const inp_row=ui.checkInputs[rowId].find(r=>r.tempId===tempId);
        /* 지역이 바뀌면 그 전 호텔·룸타입은 맞지 않으므로 비우고 다시 그린다 */
        if(inp_row){clearHotelPick(inp_row,e.target.value);updateCheckListsForRow(rowId);renderApp();}
      }
    });
  });

  /* Phase 2: 추가 호텔 상태 변경 */
  document.querySelectorAll('.checkReqStatus').forEach(sel=>{
    sel.addEventListener('change',e=>{
      const rowId=Number(sel.dataset.row);
      const reqId=Number(sel.dataset.reqid);
      const row=draft.rows.find(r=>r.id===rowId);
      if(row&&row.checkRequests){
        const req=row.checkRequests.find(r=>r.id===reqId);
        if(req)req.status=e.target.value;
        saveDB();renderApp();
      }
    });
  });

  /* Phase 2: 추가 호텔 가격 변경 */
  document.querySelectorAll('.checkReqPrice').forEach(inp=>{
    inp.addEventListener('input',e=>{
      const rowId=Number(inp.dataset.row);
      const reqId=Number(inp.dataset.reqid);
      const row=draft.rows.find(r=>r.id===rowId);
      if(row&&row.checkRequests){
        const req=row.checkRequests.find(r=>r.id===reqId);
        if(req)req.price=e.target.value?Number(e.target.value):0;
      }
    });
  });
}

/* doSubmit 전에 모든 임시 입력 저장 */
function saveAllCheckInputs(){
  const d=draft;
  if(!d||!d.rows)return;
  d.rows.forEach(row=>{
    if(ui.checkInputs&&ui.checkInputs[row.id]&&ui.checkInputs[row.id].length>0){
      saveCheckRequestsFromInputs(row.id);
    }
  });
}

/* ================= 요청 요약 (공용) ================= */
function reqSummaryHTML(req){
  return req.rows.map((row,i)=>{const dd=rDates(req,row,i);
      const opts=(row.options||[]).filter(o=>o.name).map(o=>'<span class="optchip">'+escT(optLabel(o))+'</span>').join('');
      const subs=(row.subOptions||[]).map((sub,si)=>'<div class="rq-sub" style="margin-top:4px;padding:4px 0;border-top:1px solid #ddd;font-size:12px"><span style="font-weight:700;color:var(--brand)">📌 '+(si+2)+'순위</span> '+escT(dHotel(sub.hotel)||'미정')+' ('+escT(dRoom(sub.roomType)||'-')+')</div>').join('');
      return '<div class="rq-item rq-plain">'
        +'<div class="rq-datebar">'+fdate(dd.checkIn)+' → '+fdate(dd.checkOut)+' <span class="nightsb">'+dd.nights+T('n_sfx')+'</span><span class="rq-idx">'+T('hotel_n')+' '+(i+1)+'</span></div>'
        +'<div class="rq-body">'
        +(row.region&&row.region!=='전체'?'<div class="rq-region">'+escT(dRegion(row.region))+'</div>':'')
        +'<div class="rq-line"><span class="rq-hotel">'+escT(dHotel(row.hotel)||T('no_hotel'))+'</span><span class="rq-type">'+escT(dRoom(row.roomType)||'-')+' <span class="sm">· '+row.rooms+T('r_sfx')+'</span></span></div>'
        +(row.note?'<div class="rq-note">📝 '+escT(row.note)+'</div>':'')
        +(opts?'<div>'+opts+'</div>':'')+(subs?'<div>'+subs+'</div>':'')+'</div></div>';
    }).join('')
    +(req.notes?'<div class="reqbox">📝 '+escT(req.notes)+'</div>':'')
    +'<div class="small" style="margin-top:6px">'+escT(agentLine(req))+' · '+T('reqdate_w')+' '+dotDateTime(req.createdAt)+'</div>';
}
function listHead(req,forStaff){
  const names=req.rows.map(function(r,i){var nm=escT(dHotel(r.hotel)||T('no_input'));if(req.status==='answered'&&!(ui.role==='agent'&&req.direct&&!req.forwardedAt)){var av=availOf(req,r,i);var col=av.k==='ok'?'var(--av)':(av.k==='no'?'var(--so)':((av.k==='rq'||av.k==='part')?'var(--rq)':''));if(col)nm='<span style="color:'+col+';font-weight:700">'+nm+'</span>';}return nm;}).join(req.mode==='multi'&&req.rows.length>1?' → ':' · ');
  const lastOut=req.mode==='parallel'?addDays(req.startDate,totalN(req)):finalOut(req);
  const extra=ui.role==='sreq'?' · '+escT(nickOf(req.agent)||'-')+(req.agentManager?' / '+escT(req.agentManager):''):'';
  const dtag=(ui.role!=='agent'&&req.direct&&!(req.status==='requested'&&!req.quoteSent))?'<span class="badge b-direct">'+T('b_direct_s')+'</span>':'';
  return '<div class="t1"><span class="mono small">'+reqNo(req)+' · '+escT(nickOf(req.registrant)||'심은선')+' · '+dotDateTime(req.createdAt)+'</span><span style="display:flex;gap:4px;flex:0 0 auto">'+dtag+reqBadge(req,forStaff)+'</span></div>'
    +'<div class="t2">'+names+'</div>'
    +'<div class="t3">'+fdate(req.startDate)+' → '+fdate(lastOut)+' · '+totalN(req)+T('n_sfx')+extra+'</div>';
}

/* ================= ② 에이전트 리스트 & 결과 ================= */
function agentItemHTML(req){
    const open=ui.sel===req.id;
    let detail='';
    if(open){
      const gated=req.direct&&!req.forwardedAt;
      const answered=req.status==='answered'&&!gated;
      detail='<div class="lstdetail"><div class="sechead'+(answered?'':' gray')+'" style="margin-top:2px">'+(answered?'룸체크 결과':'요청 내용')+'</div>'+resultCardHTML(req,!answered);

      /* Phase 2-D: 추가 호텔 확인 섹션 (확인자/에이전트용) */
      if(req.rows&&req.rows.some(r=>r.checkRequests&&r.checkRequests.length)){
        detail+='<div class="sechead" style="margin-top:12px">📋 '+T('chk_sec_req')+'</div>';
        req.rows.forEach(row=>{
          if(row.checkRequests&&row.checkRequests.length){
            row.checkRequests.forEach(chk=>{
              const status=chk.status==='pending'?'⏳ 확인대기':chk.status==='confirmed'?'✅ 확인완료':'❌ 거절';
              const isEdit=ui.checkEditOpen&&ui.checkEditOpen.has(chk.id);
              detail+='<div style="background:var(--paper);padding:12px;border-radius:8px;margin:8px 0">'
                +'<div style="display:flex;justify-content:space-between;align-items:flex-start;gap:8px">'
                  +'<div style="flex:1">'
                    +'<div style="display:flex;align-items:center;gap:8px;margin-bottom:4px">'
                      +'<strong>'+escT(chk.hotel)+'</strong>'
                      +'<span style="font-size:11px;color:var(--muted)">'+escT(chk.roomType)+'</span>'
                    +'</div>'
                    +'<div style="font-size:12px;color:var(--muted);margin-bottom:6px">'+fdate(chk.checkInDate)+' ~ '+fdate(chk.checkOutDate)+(chk.region&&chk.region!=='전체'?' · '+escT(chk.region):'')+' '+escT(chk.notes||'')+'</div>';

              /* 확인자(schk)일 때만 금액 표시/입력 */
              if(ui.role==='schk'){
                if(!isEdit){
                  detail+='<div style="font-size:12px;padding:6px 0">'
                    +(chk.price?'💰 '+chk.price.toLocaleString()+'원':'<span style="color:#999">금액 미입력</span>')
                    +(chk.priceNotes?' · '+escT(chk.priceNotes):'')
                  +'</div>';
                }else{
                  detail+='<div style="display:grid;gap:8px;margin:8px 0">'
                    +'<div><input type="number" class="chkPrice" data-check="'+chk.id+'" value="'+(chk.price||0)+'" placeholder="금액 입력" style="width:100%;padding:6px 8px;border:1px solid var(--line);border-radius:4px"></div>'
                    +'<div><input type="text" class="chkPriceNote" data-check="'+chk.id+'" value="'+(chk.priceNotes||'')+'" placeholder="금액 설명 (선택)" style="width:100%;padding:6px 8px;border:1px solid var(--line);border-radius:4px"></div>'
                  +'</div>';
                }
              }

              detail+='</div>'
                +'<span class="status-badge status-'+chk.status+'" style="font-size:12px">'+status+'</span>'
              +'</div>';

              if(ui.role==='schk'&&chk.status==='pending'){
                detail+='<div style="display:flex;gap:6px;margin-top:8px">'
                  +'<button class="chip" style="flex:1;font-size:12px;padding:6px;'+(isEdit?'background:#e8f5e9;color:#2e7d32':'background:#4CAF50;color:#fff')+';cursor:pointer" id="btn-confirm-'+chk.id+'">✅ '+(isEdit?'완료':'확인 완료')+'</button>'
                  +'<button class="chip" style="flex:1;font-size:12px;padding:6px;background:#f5f5f5;color:#666;cursor:pointer" id="btn-price-'+chk.id+'" title="금액 입력">💰</button>'
                  +'<button class="chip" style="flex:1;font-size:12px;padding:6px;background:#f5f5f5;color:#666;cursor:pointer" id="btn-reject-'+chk.id+'">❌ 거절</button>'
                +'</div>';
              }else if(chk.confirmedBy){
                detail+='<div style="font-size:11px;color:var(--muted);margin-top:8px">✓ 확인자: '+escT(chk.confirmedBy)+' ('+new Date(chk.confirmedAt).toLocaleDateString()+')</div>';
              }
              detail+='</div>';
            });
          }
        });
      }

      /* 확인자(schk)가 추가 호텔을 입력할 수 있는 섹션 */
      if(ui.role==='schk'&&!answered){
        detail+='<div class="sechead" style="margin-top:12px">📋 추가 호텔 입력 (확인자 입력)</div>';
        if(!req.checkerAddedHotels)req.checkerAddedHotels=[];
        /* 확인자가 입력 중인 추가 호텔 폼 */
        if(!ui.agentCheckInputs)ui.agentCheckInputs={};
        if(!ui.agentCheckInputs[req.id])ui.agentCheckInputs[req.id]=[];

        detail+='<div style="margin-bottom:8px">'
          +'<button class="addbtn sm" id="agentAddCheckBtn-'+req.id+'" onclick="window.agentAddCheckInputRow('+req.id+')">+ 호텔 추가</button>'
        +'</div>';

        /* 입력 폼들 표시 */
        detail+='<div id="agentCheckInputs-'+req.id+'" style="display:flex;flex-direction:column;gap:12px;margin-bottom:10px">';
        (ui.agentCheckInputs[req.id]||[]).forEach(inp=>{
          detail+='<div class="hblock" data-tempid="'+inp.tempId+'" style="background:#fff;border:1px solid var(--line)">'
            +'<div class="flex between aic" style="margin-bottom:8px">'
              +'<span style="font-weight:600;color:#333">추가 호텔 (확인자)</span>'
              +'<button class="del" onclick="window.agentRemoveCheckInputRow('+req.id+',\''+inp.tempId+'\')">−</button>'
            +'</div>'
            +'<div class="line lhotel" style="margin-bottom:10px">'
              +'<div><div class="label">지역</div><select class="agentCheckRegion" data-req="'+req.id+'" data-tempid="'+inp.tempId+'" style="width:100%;padding:6px 8px;border:1px solid var(--line);border-radius:4px">'
                +'<option value="">선택</option>'
                +REGIONS.map(r=>'<option value="'+esc(r)+'"'+(inp.region===r?' selected':'')+'>'+esc(r)+'</option>').join('')
              +'</select></div>'
              +'<div><div class="label">호텔명</div><input type="text" class="agentCheckHotel" data-req="'+req.id+'" data-tempid="'+inp.tempId+'" placeholder="호텔명 입력" value="'+esc(inp.hotel)+'" style="width:100%;padding:6px 8px;border:1px solid var(--line);border-radius:4px"></div>'
              +'<div><div class="label">룸타입</div><input type="text" class="agentCheckRoom" data-req="'+req.id+'" data-tempid="'+inp.tempId+'" placeholder="룸타입 입력" value="'+esc(inp.roomType)+'" style="width:100%;padding:6px 8px;border:1px solid var(--line);border-radius:4px"></div>'
            +'</div>'
            +'<div class="line lhotel" style="margin-bottom:10px">'
              +'<div><div class="label">전화번호</div><input type="tel" class="agentCheckPhone" data-req="'+req.id+'" data-tempid="'+inp.tempId+'" placeholder="전화번호 입력" value="'+esc(inp.phone||'')+'" style="width:100%;padding:6px 8px;border:1px solid var(--line);border-radius:4px"></div>'
              +'<div><div class="label">호텔 담당자</div><input type="text" class="agentCheckManager" data-req="'+req.id+'" data-tempid="'+inp.tempId+'" placeholder="담당자명/연락처" value="'+esc(inp.manager||'')+'" style="width:100%;padding:6px 8px;border:1px solid var(--line);border-radius:4px"></div>'
              +'<div><div class="label">가능여부</div><select class="agentCheckStatus" data-req="'+req.id+'" data-tempid="'+inp.tempId+'" style="width:100%;padding:6px 8px;border:1px solid var(--line);border-radius:4px">'
                +'<option value="">미정</option>'
                +'<option value="available"'+(inp.status==='available'?' selected':'')+'>가능</option>'
                +'<option value="limited"'+(inp.status==='limited'?' selected':'')+'>제한</option>'
                +'<option value="unavailable"'+(inp.status==='unavailable'?' selected':'')+'>불가</option>'
              +'</select></div>'
            +'</div>'
            +'<div style="margin-bottom:10px">'
              +'<div class="label">금액 (1박)</div>'
              +'<input type="number" class="agentCheckPrice" data-req="'+req.id+'" data-tempid="'+inp.tempId+'" placeholder="금액 입력" value="'+(inp.price||0)+'" style="width:100%;padding:6px 8px;border:1px solid var(--line);border-radius:4px;font-size:13px" min="0">'
            +'</div>'
            +'<div style="margin-top:10px">'
              +'<button class="linkbtn agentCheckDetailTog" data-tempid="'+inp.tempId+'" style="color:#2B5FA3;font-weight:600">'+((ui.agentCheckDetailOpen&&ui.agentCheckDetailOpen.has(inp.tempId))?'▾':'▸')+' 상세 정보</button>'
              +((ui.agentCheckDetailOpen&&ui.agentCheckDetailOpen.has(inp.tempId))?'<textarea class="agentCheckDetailNote" data-req="'+req.id+'" data-tempid="'+inp.tempId+'" placeholder="날짜별 가격, 가능 여부 등 상세 정보 입력" style="width:100%;margin-top:6px;padding:8px;border:1px solid var(--line);border-radius:4px;font-size:12px;min-height:60px">'+escT(inp.detailNote||'')+'</textarea>':'')
            +'</div>'
          +'</div>';
        });
        detail+='</div>';
      }

      if(answered)detail+='<div class="legend" style="margin-top:8px">'
        +'<span class="small"><b style="color:var(--av)">AV</b> 가능</span>'
        +'<span class="small"><b style="color:var(--rq)">RQ</b> 오늘만 가능</span>'
        +'<span class="small"><b style="color:var(--so)">S/O</b> 마감</span></div>';
      if(!answered){
        if(gated&&req.status==='answered'){detail+='<p class="small" style="margin:10px 0 4px;color:var(--rq)">룸체크가 완료되었습니다. 요청자 확인 후 전송하면 결과가 표시됩니다.</p>';}
        else detail+='<p class="small" style="margin:10px 0 4px">'+(req.quoteRequested&&!req.quoteSent
          ?'직원이 호텔 확인 중입니다. 💬 간단 견적도 함께 요청되어, 답변 시 견적서가 포함됩니다.'
          :'직원이 호텔 확인 중입니다. 답변이 오면 이 카드가 룸체크 결과로 바뀝니다.')+'</p>';
      }
      if(req.quoteSent&&!gated){
        detail+='<div class="sechead">간단 견적서</div>'+quoteCardHTML(req)
          +'<div class="qbtns"><button class="qcopy" data-qtext="'+req.id+'">📋 견적 복사</button><button class="qimg" data-qimg="'+req.id+'">🖼 이미지 저장</button></div>';
      }else if(answered&&ui.role!=='sreq'){
        detail+= req.quoteRequested
          ? '<p class="small" style="margin-top:10px">💬 간단 견적을 요청했습니다. 직원이 견적을 보내면 여기에 표시됩니다.</p>'
          : '<div class="qbtns"><button class="qblue" data-askquote="'+req.id+'">💬 견적 요청</button></div>';
      }
      if(ui.role==='sreq'){
        detail+='<div style="border-top:1px solid var(--line);margin-top:12px;padding-top:2px">'
          +'<button class="linkbtn" data-mkquote="'+req.id+'">'+(ui.qbOpen===req.id?'▾ 견적서 만들기 접기':'🧾 견적서 만들기')+'</button>'
          +(ui.qbOpen===req.id? quoteBuilderHTML(req)+'<div class="qbtns"><button class="qcopy" id="qbSend">'+(req.quoteSent?'견적 다시 발송':'견적 발송')+'</button></div>':'')
          +'</div>';
      }
      detail+='<div class="qbtns"><button class="qgray" data-recheck="'+req.id+'">🔁 다시 룸체크</button>'
        +(req.contractedAt
          ?'<button class="qgray" data-contract="'+req.id+'">계약 완료 취소</button>'
          :'<button class="qcopy" data-contract="'+req.id+'">✅ 계약 완료</button>')+'</div>'
      detail+='</div>';
    }
    return '<div class="lstitem '+reqStateCls(req)+(req.archivedAt&&!req.contractedAt?' ls-pastitem':'')+'" data-rid="'+req.id+'"><div class="lsthead" data-sel="'+req.id+'">'+listHead(req,false)+'</div>'+detail+'</div>';
}
function sectionsHTML(itemFn,sub){
  if(ui.role==='schk'){
    const pending=r=>r.status==='requested'||(r.status==='answered'&&!r.answerComplete);
    const reqs=sorted().filter(r=>pending(r));
    const done=sorted().filter(r=>r.status==='answered'&&r.answerComplete&&!r.checkerHidden&&!isFullbookReq(r));
    const full=sorted().filter(r=>r.status==='answered'&&r.answerComplete&&!r.checkerHidden&&isFullbookReq(r));
    const tab=['act','done','full'].includes(ui.listTab)?ui.listTab:'act';
    const cur=tab==='done'?done:(tab==='full'?full:reqs);
    const caption=tab==='done'?T('cap_done'):(tab==='full'?T('cap_full'):T('cap_req'));
    const empty=tab==='done'?T('emp_done'):(tab==='full'?T('emp_full'):T('emp_req'));
    const rules='<div class="reqbox" style="font-size:12px;line-height:1.8;margin:8px 0 4px">'+T('rules_chk')+'</div>';
    return '<section class="card">'
      +'<div class="flex between aic" style="margin-bottom:8px"><h3 style="margin:0;font-size:16.5px;font-weight:800">'+T('list_title')+'</h3>'
        +'<button class="chip'+(ui.ruleOpen?' on':'')+'" id="ruleTog">'+T('rules_btn')+'</button></div>'
      +(ui.ruleOpen?rules:'')
      +'<div class="seg" id="listTab">'
        +'<button data-t="act"'+(tab==='act'?' class="on"':'')+'>'+T('tab_req')+' ('+reqs.length+')</button>'
        +'<button data-t="done"'+(tab==='done'?' class="on"':'')+'>'+T('tab_done')+' ('+done.length+')</button>'
        +'<button data-t="full"'+(tab==='full'?' class="on"':'')+'>'+T('tab_full')+' ('+full.length+')</button></div>'
      +'<p class="small" style="margin:7px 2px 0">'+caption+'</p>'
      +(cur.length?cur.map(itemFn).join(''):'<p class="small" style="margin:10px 0 2px">'+empty+'</p>')
      +(tab==='done'?'<button class="addbtn sm" id="backupBtn" style="margin-top:12px">'+T('backup_btn')+'</button>':'')
      +'</section>';
  }
  const vis=r=>{if(ui.role!=='agent')return true;var me=[meName(),meNick()].filter(Boolean).map(function(x){return String(x).trim();});return me.indexOf(String(r.agent||'').trim())>=0;};
  const act=activeList().filter(vis),past=pastList().filter(vis),con=contractList().filter(vis);
  const tab=ui.listTab||'act';
  const cur=tab==='past'?past:(tab==='con'?con:act);
  const caption=tab==='past'?T('cap_past'):(tab==='con'?T('cap_con'):(sub||T('cap_act')));
  const empty=tab==='past'?T('emp_past'):(tab==='con'?T('emp_con'):T('emp_act'));
  const rules='<div class="reqbox" style="font-size:12px;line-height:1.8;margin:8px 0 4px">'+T('rules_req')+'</div>';
  return '<section class="card">'
    +'<div class="flex between aic" style="margin-bottom:8px"><h3 style="margin:0;font-size:16.5px;font-weight:800">'+T('list_title')+'</h3>'
      +(ui.role==='sreq'?'<button class="chip'+(ui.ruleOpen?' on':'')+'" id="ruleTog">'+T('rules_btn')+'</button>':'')+'</div>'
    +(ui.role==='sreq'&&ui.ruleOpen?rules:'')
    +'<div class="seg" id="listTab">'
      +'<button data-t="act"'+(tab==='act'?' class="on"':'')+'>'+T('tab_act')+' ('+act.length+')</button>'
      +'<button data-t="past"'+(tab==='past'?' class="on"':'')+'>'+T('tab_past')+' ('+past.length+')</button>'
      +'<button data-t="con"'+(tab==='con'?' class="on"':'')+'>'+T('tab_con')+' ('+con.length+')</button></div>'
    +'<p class="small" style="margin:7px 2px 0">'+caption+'</p>'
    +(cur.length?cur.map(itemFn).join(''):'<p class="small" style="margin:10px 0 2px">'+empty+'</p>')
    +'</section>';
}
function agentListHTML(){
  return sectionsHTML(agentItemHTML,T('sub_agent'));
}
function resultCardHTML(req,asReq){
  const answered=!asReq&&req.status==='answered';
  const legs=req.rows.map((row,i)=>{const dd=rDates(req,row,i);
    const av=answered?availOf(req,row,i):{k:'un',t:'확인 중'};
    const opts=(row.options||[]).filter(o=>o.name).map(o=>'<span class="optchip">'+escT(optLabel(o))+'</span>').join('');
    let dl='';
    if(answered&&(av.k==='part'||av.k==='rq'||av.k==='un')){
      dl='<div class="daychips">'+dd.dates.map(iso=>{const c=(req.ws||{})[row.id+'|'+iso]||{};
        const dc=c.status==='av'?'dc-av':c.status==='so'?'dc-so':c.status==='rq'?'dc-rq':'dc-un';
        return '<span class="daychip '+dc+'">'+fdshort(iso)+' '+statusLabel(c.status)+'</span>';}).join('')+'</div>';
    }
    /* 확인자 추천 — 대상 호텔 카드 "안쪽"에 붙여 대안이라는 맥락을 살린다.
       에이전트가 고객에게 그대로 읽어줄 문장이 되도록 마감 여부에 따라 문구가 바뀐다.
       추천에는 삭제 버튼을 두지 않는다(확인자가 확인한 결과를 에이전트가 지우면 안 된다). */
    const recHTML=(targetId,targetSO)=>{
      const recs=recsFor(row,targetId);if(!recs.length)return '';
      return recs.map(rec=>{
        const k=recKey(rec);
        const rs=dd.dates.map(iso=>((req.ws||{})[k+'|'+iso]||{}).status||'');
        const rp=dd.dates.map(iso=>((req.ws||{})[k+'|'+iso]||{}).price||'').filter(Boolean);
        const ok=rs.length>0&&rs.every(s=>s==='av');
        const no=rs.length>0&&rs.every(s=>s==='so');
        const lab=ok?T('av_ok'):(no?T('av_no'):(rs.some(s=>!s)?T('av_un'):T('av_rq')));
        const cls=ok?'ok':(no?'no':'rq');
        return '<div class="agtrec">'
          +'<div class="agtreccap">'+(targetSO?T('rec_cap_so'):T('rec_cap'))+'</div>'
          +'<div class="rq-line"><span class="rq-hotel">'+escT(dHotel(rec.hotel)||'-')+'</span>'
          +'<span class="rq-type">'+escT(dRegion(rec.region||'전체'))+' · '+escT(dRoom(rec.roomType)||'-')+'</span></div>'
          +'<div class="agtrecav av-'+cls+'">'+lab+((rp.length&&costVisible())?' · ฿'+won(rp[0])+' / '+T('n_sfx'):'')+'</div>'
          +'</div>';}).join('');
    };
    const mainSO=answered&&av.k==='no';
    /* Phase 2: 추가 호텔들 표시 - 간단한 한 줄 형식 */
    let checkReqsHTML='';
    if(row.checkRequests&&row.checkRequests.length>0){
      checkReqsHTML='<div style="margin-top:12px"><div class="agtsec">'+T('chk_sec_req')+'</div>';
      row.checkRequests.forEach((req_ch,ci)=>{
        const cid=row.id+'_chk_'+ci;
        const cs=dd.dates.map(iso=>((req.ws||{})[cid+'|'+iso]||{}).status||'');
        checkReqsHTML+='<div class="agtchk">'
          +'<div class="rq-line"><span class="rq-hotel">'+escT(dHotel(req_ch.hotel||'-'))+'</span>'
            +'<span class="rq-type">'+escT(dRegion(req_ch.region||'전체'))+' · '+escT(dRoom(req_ch.roomType||'-'))+'</span></div>'
          +'</div>'
          +recHTML(cid,cs.length>0&&cs.every(s=>s==='so'));
      });
      checkReqsHTML+='</div>';
    }
    return '<div class="rq-item">'
      +'<div class="rq-datebar">'+fdate(dd.checkIn)+' → '+fdate(dd.checkOut)+' <span class="nightsb">'+dd.nights+'박</span><span class="rq-idx">호텔 '+(i+1)+'</span></div>'
      +'<div class="rq-body">'
      +(row.region&&row.region!=='전체'?'<div class="rq-region">'+escT(dRegion(row.region))+'</div>':'')
      +'<div class="qc-rowline" style="align-items:center;margin-top:0"><span class="rq-line"><span class="rq-hotel">'+escT(dHotel(row.hotel)||'-')+'</span><span class="rq-type">'+escT(dRoom(row.roomType)||'-')+' <span class="sm">· '+row.rooms+'실</span></span></span>'
      +'<span class="avbig av-'+av.k+'" style="margin-top:0">'+av.t+'</span></div>'
      +(row.note?'<div class="rq-note">📝 '+escT(row.note)+'</div>':'')
      +(opts?'<div>'+opts+'</div>':'')+dl
      +recHTML(row.id,mainSO)
      +checkReqsHTML+'</div></div>';}).join('');
  return '<div class="quotecard '+(answered?'rescard':'reqcard')+'" id="rescard'+req.id+'"><div class="qc-title">The Nirvana · 룸체크 '+(answered?'결과':'요청')+'</div>'
    +'<div class="qc-sub" style="text-align:left;margin-top:3px">'+escT(reqNo(req))
      +(answered
        ?' · 담당 '+escT(req.manager||'-')+' · 확인일 '+dotDateTime(req.answeredAt||req.createdAt)
        :' · 담당 '+escT(nickOf(req.registrant)||'심은선')+' 요청'+(req.agent?' · 에이전트 '+escT(nickOf(req.agent)):'')+' · 요청일 '+dotDateTime(req.createdAt))+'</div>'
    +legs
    +(req.notes?'<div class="reqbox">📝 '+escT(req.notes)+'</div>':'')+'</div>';
}
function resultText(req){
  let t='The Nirvana · 룸체크 결과\n'+reqNo(req)+' · '+agentLine(req)+'\n';
  req.rows.forEach((row,i)=>{const dd=rDates(req,row,i);const av=availOf(req,row,i);
    t+='\n'+(i+1)+') '+fdate(dd.checkIn)+' → '+fdate(dd.checkOut)+' ('+dd.nights+'박)\n'+(row.hotel||'-')+'\n'
      +(row.roomType||'-')+' · '+row.rooms+'실\n→ '+av.t+'\n';
    if(av.k==='part'||av.k==='rq'||av.k==='un')dd.dates.forEach(iso=>{const c=(req.ws||{})[row.id+'|'+iso]||{};t+='   '+fdshort(iso)+' '+statusLabel(c.status)+'\n';});});
  return t;
}
function bindCommonList(){
  document.querySelectorAll('#listTab button').forEach(b=>b.onclick=()=>{ui.listTab=b.dataset.t;ui.sel=null;ui.ssel=null;renderApp();});
  const rt=document.getElementById('ruleTog');if(rt)rt.onclick=()=>{ui.ruleOpen=!ui.ruleOpen;renderApp();};
  document.querySelectorAll('[data-contract]').forEach(b=>b.onclick=()=>{const r=byId(Number(b.dataset.contract));if(!r)return;
    if(r.contractedAt){r.contractedAt=null;toast(T('t_contract_x'));}
    else{r.contractedAt=Date.now();toast(T('t_contract')+reqNo(r));}
    saveDB();renderApp();});
  document.querySelectorAll('[data-topast]').forEach(b=>b.onclick=()=>{const r=byId(Number(b.dataset.topast));if(!r)return;
    r.archivedAt=Date.now();ui.sel=null;ui.ssel=null;saveDB();renderApp();toast(T('t_topast')+reqNo(r));});
  document.querySelectorAll('[data-recheck]').forEach(b=>b.onclick=()=>{const r=byId(Number(b.dataset.recheck));if(!r)return;
    /* 이 동작은 row.checkRequests를 비워 입력 폼으로 되돌린다. 되돌릴 방법이 없고,
       이제 "답변 보내기" 바로 옆에 있어 오누름이 쉬우므로 한 번 묻는다. */
    if(!confirm(T('recheck_confirm')))return;
    draft=draftFromReq(r);
    /* Phase 3-E: checkRequests를 ui.checkInputs로 변환하여 입력 폼에서 편집 가능하게 */
    ui.checkInputs={};
    draft.rows.forEach((row,i)=>{
      if(row.checkRequests&&row.checkRequests.length){
        ui.checkInputs[row.id]=row.checkRequests.map(chk=>({
          tempId:chk.id+'_loaded',
          region:chk.region||'전체',
          hotel:chk.hotel||'',
          roomType:chk.roomType||'',
          phone:chk.phone||'',
          manager:chk.manager||'',
          price:chk.price||'',
          rooms:chk.rooms||1,
          status:chk.status||'',
          savedAt:chk.savedAt
        }));
        ui.open.add(row.id);
        row.checkRequests=[]; /* 기존 데이터는 비우고 ui.checkInputs에서만 편집 */
      }
    });
    ui.sel=null;ui.ssel=null;ui.qbOpen=null;renderApp();
    window.scrollTo({top:0,behavior:'smooth'});
    toast(T('t_recheck'));});
}
function bindAgentList(){
  bindCommonList();
  document.querySelectorAll('[data-mkquote]').forEach(b=>b.onclick=()=>{const id=Number(b.dataset.mkquote);ui.qbOpen=ui.qbOpen===id?null:id;renderApp();});
  if(ui.role==='sreq'&&ui.qbOpen&&document.getElementById('qRate')){
    const r=byId(ui.qbOpen);
    if(r){bindQuoteBuilder(r);
      const s=document.getElementById('qbSend');
      if(s)s.onclick=()=>{r.quoteSent=true;r.quoteRequested=false;r.quoteSentAt=Date.now();r.quoteBy=r.registrant||'심은선';saveDB();renderApp();toast(T('t_quote_sent')+reqNo(r));};}
  }
  document.querySelectorAll('[data-sel]').forEach(el=>el.onclick=()=>{const id=Number(el.dataset.sel);ui.sel=ui.sel===id?null:id;renderApp();});
  document.querySelectorAll('[data-askquote]').forEach(b=>b.onclick=()=>{const r=byId(Number(b.dataset.askquote));if(r){r.quoteRequested=true;saveDB();renderApp();toast(T('t_askq'));}});
  document.querySelectorAll('[data-qtext]').forEach(b=>b.onclick=()=>{const r=byId(Number(b.dataset.qtext));if(r)copyText(quoteText(r),T('t_qcopied'));});
  document.querySelectorAll('[data-qimg]').forEach(b=>b.onclick=()=>{saveImg('qcard'+b.dataset.qimg,'견적.png');});

  /* 확인자용 추가 호텔 입력 폼 이벤트 바인딩 */
  document.querySelectorAll('.agentCheckDetailTog').forEach(btn=>{
    btn.onclick=e=>{
      e.preventDefault();
      const tempId=btn.dataset.tempid;
      if(!ui.agentCheckDetailOpen)ui.agentCheckDetailOpen=new Set();
      ui.agentCheckDetailOpen.has(tempId)?ui.agentCheckDetailOpen.delete(tempId):ui.agentCheckDetailOpen.add(tempId);
      renderApp();
    };
  });

  document.querySelectorAll('.agentCheckRegion,.agentCheckHotel,.agentCheckRoom,.agentCheckPhone,.agentCheckManager,.agentCheckStatus,.agentCheckPrice,.agentCheckDetailNote').forEach(inp=>{
    const reqId=Number(inp.dataset.req);
    const tempId=inp.dataset.tempid;
    if(!ui.agentCheckInputs||!ui.agentCheckInputs[reqId])return;
    const inpData=ui.agentCheckInputs[reqId].find(i=>i.tempId===tempId);
    if(!inpData)return;

    if(inp.classList.contains('agentCheckRegion'))inp.onchange=e=>{inpData.region=e.target.value;};
    if(inp.classList.contains('agentCheckHotel'))inp.oninput=e=>{inpData.hotel=e.target.value;};
    if(inp.classList.contains('agentCheckRoom'))inp.oninput=e=>{inpData.roomType=e.target.value;};
    if(inp.classList.contains('agentCheckPhone'))inp.oninput=e=>{inpData.phone=e.target.value;};
    if(inp.classList.contains('agentCheckManager'))inp.oninput=e=>{inpData.manager=e.target.value;};
    if(inp.classList.contains('agentCheckStatus'))inp.onchange=e=>{inpData.status=e.target.value;};
    if(inp.classList.contains('agentCheckPrice'))inp.oninput=e=>{inpData.price=Number(e.target.value)||0;};
    if(inp.classList.contains('agentCheckDetailNote'))inp.oninput=e=>{inpData.detailNote=e.target.value;};
  });
}
function saveImg(id,name){const node=document.getElementById(id);
  if(!node)return;
  if(typeof html2canvas==='undefined'){toast(T('t_img_need_net'));return;}
  html2canvas(node,{scale:2,backgroundColor:'#ffffff'}).then(cv=>{const a=document.createElement('a');a.download=name;a.href=cv.toDataURL('image/png');a.click();toast(T('t_img_saved'));});}
/* 견적 산출 내역 — "이 금액이 어떻게 나왔는지"를 한 표로 펼친다.
   전체 이미지에 함께 실려, 받는 사람이 근거를 되짚을 수 있다. */
function quoteBreakdownHTML(req,q){
  q=q||curQuote(req);
  const c=quoteCalc(req,q);
  const K={base:'q_k_base',add:'q_k_add',rec:'q_k_rec'};
  const legs=req.rows.map((r,i)=>{const dd=rDates(req,r,i),p=pickedFor(req,r,i,q);
    const per=dd.nights>0?Math.round(c.perHotel[i].thb/dd.nights/(p.rooms||1)):0;
    return '<tr><td class="qbd-l">'+T('q_leg').replace('{n}',i+1)
      +'<div class="qbd-d">'+fdshort(dd.checkIn)+'→'+fdshort(dd.checkOut)+'</div></td>'
      +'<td><span class="qbd-k qbd-'+p.kind+'">'+T(K[p.kind])+'</span> '+escT(dHotel(p.name)||'-')
      +'<div class="qbd-d">'+escT(dRoom(p.roomType)||'-')+'</div></td>'
      +'<td class="qbd-n">'+dd.nights+T('n_sfx')+'·'+(p.rooms||1)+T('r_sfx')
      +(per?'<div class="qbd-d">฿'+won(per)+'/'+T('n_sfx')+'</div>':'')+'</td>'
      +'<td class="qbd-a">฿'+won(c.perHotel[i].thb)+'</td></tr>';}).join('');
  const opts=hotelOptsList(req).filter(({o})=>o.name).map(({hotel,o})=>
    '<tr><td colspan="3">'+escT(optLabel(o))+'<div class="qbd-d">'+escT(dHotel(hotel)||'-')+'</div></td>'
    +'<td class="qbd-a">฿'+won(lineTHB(o))+'</td></tr>').join('');
  const adds=(q.addl||[]).filter(x=>x.desc||x.memo).map(x=>
    '<tr><td colspan="3">'+escT(x.desc||x.memo)+'<div class="qbd-d">'+(x.amt||0)+' × '+(x.qty||1)+'</div></td>'
    +'<td class="qbd-a">'+(x.cur==='krw'?'₩':'฿')+won(lineTHB(x))+'</td></tr>').join('');
  return '<div class="qbd"><div class="qbd-t">'+T('qbd_title')+'</div>'
    +'<table class="qbd-tb">'
    +'<tr class="qbd-h"><td>'+T('qbd_leg')+'</td><td>'+T('qbd_hotel')+'</td><td>'+T('qbd_nights')+'</td><td class="qbd-a">'+T('qbd_amt')+'</td></tr>'
    +legs
    +'<tr class="qbd-s"><td colspan="3">'+T('qbd_hsum')+'</td><td class="qbd-a">฿'+won(c.hTHB)+'</td></tr>'
    +(opts?'<tr class="qbd-h"><td colspan="4">'+T('qbd_opt')+'</td></tr>'+opts
      +'<tr class="qbd-s"><td colspan="3">'+T('qbd_opt')+'</td><td class="qbd-a">฿'+won(c.optTHB)+'</td></tr>':'')
    +'<tr class="qbd-s"><td colspan="3">'+T('qbd_sub')+'</td><td class="qbd-a">฿'+won(c.baseTHB)+'</td></tr>'
    +'<tr><td colspan="3">'+T('qbd_krw')+' <span class="qbd-d">× '+won(c.rate)+'</span></td><td class="qbd-a">₩'+won(c.baseTHB*c.rate)+'</td></tr>'
    +(adds?'<tr class="qbd-h"><td colspan="4">'+T('qbd_addl')+'</td></tr>'+adds
      +'<tr class="qbd-s"><td colspan="3">'+T('qbd_addl')+'</td><td class="qbd-a">₩'+won(c.addlKRW)+'</td></tr>':'')
    +'<tr class="qbd-tot"><td colspan="3">'+T('qb_krw_total')+' ('+c.pax+T('ppl')+')</td><td class="qbd-a">₩'+won(c.totalKRW)+'</td></tr>'
    +'<tr><td colspan="3">'+T('qbd_per')+' <span class="qbd-d">₩'+won(c.totalKRW)+' ÷ '+c.pax+'</span></td><td class="qbd-a">'+manwonF(c.per/10000)+'</td></tr>'
    +(q.override!=null?'<tr class="qbd-tot"><td colspan="3">'+T('qbd_adj')+'</td><td class="qbd-a">'+manwonF(c.perMan)+'</td></tr>':'')
    +'</table></div>';
}
function saveFullImg(req){
  if(typeof html2canvas==='undefined'){toast(T('t_img_need_net'));return;}
  FORCE_KO=true;let html='';
  /* 전체 이미지: 룸체크 결과 + 견적서 + 산출 내역을 모두 펼쳐 담는다 */
  try{html=resultCardHTML(req)+quoteCardHTML(req)+quoteBreakdownHTML(req);}finally{FORCE_KO=false;}
  const tmp=document.createElement('div');
  tmp.style.cssText='position:fixed;left:-10000px;top:0;width:370px;background:#fff;padding:8px';
  tmp.innerHTML=html;
  tmp.querySelectorAll('[id]').forEach(n=>n.removeAttribute('id'));
  document.body.appendChild(tmp);
  html2canvas(tmp,{scale:2,backgroundColor:'#ffffff'})
    .then(cv=>{const a=document.createElement('a');a.download='룸체크견적_'+reqNo(req)+'.png';a.href=cv.toDataURL('image/png');a.click();toast(T('t_img_saved'));tmp.remove();})
    .catch(()=>{tmp.remove();});
}

/* ================= ③ 직원 리스트 & 워크시트 ================= */
function staffItemHTML(req){
  const open=ui.ssel===req.id;
  return '<div class="lstitem '+reqStateCls(req)+(req.archivedAt&&!req.contractedAt?' ls-pastitem':'')+'" style="'+(open?'border-color:var(--brand);box-shadow:0 0 0 1.5px var(--brand)':'')+'"><div class="lsthead" data-ssel="'+req.id+'">'+listHead(req,true)+'</div>'
    +(open?'<div class="lstdetail">'+staffWorkInner(req)+'</div>':'')+'</div>';
}
function staffListHTML(){
  return sectionsHTML(staffItemHTML,T('sub_staff'));
}
/* C안: 추천을 "대신하려는 호텔" 바로 아래에 연결선으로 매단다.
   targetSO가 true면 마감 대안, false면 그냥 함께 권하는 것 — 마감이 아니어도 달 수 있다. */
function recBlockHTML(req,row,i,dd,targetId,targetSO){
  const canEdit=(ui.role==='schk'||ui.role==='sreq');
  const recs=recsFor(row,targetId);
  if(!recs.length&&!canEdit)return '';
  if(!recs.length&&!canEdit)return '';
  /* 추가 호텔과 같은 접기 바. recOpen에 담긴 대상은 사용자가 기본값을 뒤집은 것이다.
     기본값은 추천이 있으면 펼침, 없으면 접힘 — chkListTog와 동일한 규칙. */
  const dflt=recs.length>0;
  const recOpen=ui.recOpen.has(String(targetId))?!dflt:dflt;
  let h='<button class="chkListTog recTog'+(recOpen?' open':'')+'" data-rec-tog="'+targetId+'">'
    +'<span class="chev'+(recOpen?' open':'')+'">▶</span>'
    +'<span>'+T('rec_sec')+' ('+recs.length+')</span>'
    +(canEdit?'<span class="chkAddBtn recAdd" data-req="'+req.id+'" data-row="'+row.id+'" data-target="'+targetId+'">'+T('chk_add')+'</span>':'')
    +'</button>';
  if(recOpen&&recs.length){
    h+='<div class="chklist reclist">'
      +'<div class="reccap">'+(targetSO?T('rec_cap_so'):T('rec_cap'))+'</div>'
      +recs.map(rec=>{
        const k=recKey(rec);
        const sts=dd.dates.map(iso=>((req.ws||{})[k+'|'+iso]||{}).status||'');
        const prs=dd.dates.map(iso=>((req.ws||{})[k+'|'+iso]||{}).price||'');
        const uS=[...new Set(sts)],uP=[...new Set(prs)];
        const mS=uS.length>1,mP=uP.length>1;
        return '<div class="subcard recrow">'
          /* 퍼플 칩과 왼쪽 외곽선이 이미 "다른 종류"를 말하므로 별도 설명 라벨은 두지 않는다 */
          +'<div class="cardhd"><span class="hgnum rec">'+T('rec_word')+'</span>'
          +(canEdit?'<button class="del" style="margin-left:auto" onclick="removeRecommend('+req.id+',\''+row.id+'\',\''+rec.id+'\')">−</button>':'')
          +'</div>'
          +(canEdit
            ?'<div class="line lhotel" style="margin-top:0">'
              +'<div><div class="label">'+T('region')+'</div><select class="recRegion" data-rid="'+rec.id+'" data-row="'+row.id+'">'
                +REGIONS.map(rg=>opt(rg,escT(dRegion(rg)),rg===(rec.region||'전체'))).join('')
              +'</select></div>'
              /* 칸이 좁아 "(선택·입력)"까지 넣으면 라벨이 2~3줄로 감긴다 — 짧은 라벨을 쓴다 */
              +'<div><div class="label">'+T('hotel_n')+'</div><input class="recHotel" data-rid="'+rec.id+'" data-row="'+row.id+'" list="rdl_rec'+rec.id+'" value="'+esc(dHotel(rec.hotel))+'" placeholder="'+esc(T('ph_hotel'))+'">'
                +'<datalist id="rdl_rec'+rec.id+'">'+hotelsIn(rec.region||'전체').map(h=>'<option value="'+esc(dHotel(h.name))+'">').join('')+'</datalist></div>'
              +'<div><div class="label">'+T('room_lbl')+'</div><input class="recRoom" data-rid="'+rec.id+'" data-row="'+row.id+'" list="rrdl'+rec.id+'" value="'+esc(dRoom(rec.roomType))+'" placeholder="'+esc(T('ph_room'))+'">'
                +roomDL('rrdl'+rec.id,rec.hotel)+'</div></div>'
            :'<div class="rq-region" style="margin-bottom:5px">'+escT(dRegion(rec.region||'전체'))+'</div>'
              +'<div class="rq-hotel">'+escT(dHotel(rec.hotel)||T('no_input'))+'</div>'
              +'<div class="rq-type">'+escT(dRoom(rec.roomType)||'-')+'</div>')
          +'<div class="strow" style="margin-top:8px">'
          +stSel('stsel',mS?'__none':uS[0],'data-rec="'+k+'"',mS)
          +'<span class="pbox"><span>฿</span><input type="number" class="recPrice" data-rec="'+k+'" placeholder="'+esc(mP?T('ws_mixed'):T('ws_price_ph'))+'" value="'+(mP?'':(uP[0]||''))+'"></span></div>'
          +'</div>';}).join('')
      +'</div>';
  }
  return h;
}
function staffWorkInner(req){
  if(!req)return '';
  const cards=req.rows.map((row,i)=>{
    const dd=rDates(req,row,i);
    const sts=dd.dates.map(iso=>((req.ws||{})[row.id+'|'+iso]||{}).status||'');
    const prs=dd.dates.map(iso=>((req.ws||{})[row.id+'|'+iso]||{}).price||'');
    const uSt=[...new Set(sts)],uPr=[...new Set(prs)];
    const mSt=uSt.length>1,mPr=uPr.length>1;
    const isOpen=ui.open.has(row.id);
    const rdone=rowDone(req,row,i);
    const stChip='<span class="badge '+(rdone?'b-done':'b-wait')+'" style="margin-left:4px">'+(rdone?T('chip_done'):T('chip_wait'))+'</span>';
    const head='<div class="wshead" data-toggle="'+row.id+'" style="display:block;padding:0">'
      +'<div class="rq-datebar"><span class="chev'+(isOpen?' open':'')+'" style="width:13px">▶</span>'+fdate(dd.checkIn)+' → '+fdate(dd.checkOut)+' <span class="nightsb">'+dd.nights+T('n_sfx')+'</span><span class="rq-idx">'+T('hotel_n')+' '+(i+1)+stChip+'</span></div>'
      +'<div class="rq-body">'
      +'<div class="flex aic" style="gap:5px;flex-wrap:wrap;margin-bottom:5px">'
      +(row.region&&row.region!=='전체'?'<span class="rq-region" style="margin-bottom:0">'+escT(dRegion(row.region))+'</span>':'')
      +phoneHTML(req,row)
      +(row.savedAt?'<span class="small" style="color:var(--muted);flex:0 0 auto">'+dotDateTime(row.savedAt)+'</span>':'')+'</div>'
      +'<div class="qc-rowline" style="align-items:center;margin-top:0"><span class="rq-line"><span class="rq-hotel">'+escT(dHotel(row.hotel)||T('no_hotel'))+'</span><span class="rq-type">'+escT(dRoom(row.roomType)||'-')+' <span class="sm">· '+row.rooms+T('r_sfx')+'</span></span></span>'
      +'<span style="display:flex;gap:5px;align-items:center;flex:0 0 auto">'+stSel('stsel',mSt?'__none':uSt[0],'data-all="'+row.id+'"',mSt)
      +'<span class="pbox"><span>฿</span><input type="number" class="pall" data-all="'+row.id+'" placeholder="'+esc(mPr?T('ws_mixed'):T('ws_price_ph'))+'" value="'+(mPr?'':(uPr[0]||''))+'"></span></span></div>'
      +(row.note?'<div class="rq-note" style="margin-top:6px">📝 '+escT(row.note)+'</div>':'')
      +'</div></div>';
    let detail='';
    if(isOpen){
      const hasOpt=(row.options||[]).length>0,optOpen=hasOpt||ui.optOpen.has(row.id);
      detail='<div class="detail"><div class="dhdr">In '+fdate(dd.checkIn)+' / Out '+fdate(dd.checkOut)+' · '+dd.nights+T('n_sfx')+' · '+T('ws_day_edit')+'</div>'
        +dd.dates.map(iso=>{const c=(req.ws||{})[row.id+'|'+iso]||{};
          return '<div class="drow"><span class="ddate">'+fdshort(iso)+'</span>'
            +stSel('stsel',c.status||'','data-key="'+row.id+'|'+iso+'"',false)
            +'<div class="pbox"><span>฿</span><input type="number" class="pone" data-key="'+row.id+'|'+iso+'" placeholder="'+esc(T('ws_price_ph'))+'" value="'+(c.price||'')+'"></div></div>';}).join('')
        +(optOpen
          ? '<div style="margin-top:8px"><div class="label">'+T('ws_opt_label')+'</div>'
            +(row.options||[]).map(o=>'<div class="optitem" style="margin-top:6px" data-wrid="'+row.id+'" data-woid="'+o.id+'"><div class="toprow"><input class="woptName" list="optdl" style="flex:1" value="'+esc(o.name)+'" placeholder="'+esc(T('ws_opt_name'))+'"><button class="del woptDel">−</button></div>'
              +'<div class="optline"><input type="number" class="woptAmt" value="'+(o.amt||'')+'" placeholder="'+esc(T('ws_unit_ph'))+'"><span class="x">฿ ×</span><input type="number" class="woptQty qty" min="1" value="'+(o.qty||1)+'"><span class="linetot">= ฿'+won(lineTHB(o))+'</span></div></div>').join('')
            +'<button class="addbtn sm woptAdd" data-id="'+row.id+'">'+T('add_opt')+'</button></div>'
          : '<button class="linkbtn optTog" data-id="'+row.id+'">'+T('ws_opt_open')+'</button>')
        +'</div>';
    }
    /* Phase 3-D: 추가 호텔 — 호텔1과 동일한 컴팩트 레이아웃, 펼침 버튼 안에 표시 */
    let chkCards='',chkSection='';
    if(row.checkRequests&&row.checkRequests.length){
      row.checkRequests.forEach((chk,ci)=>{
        const chkId=row.id+'_chk_'+ci;
        const chkOpen=ui.checkExpand.has(chkId);
        const chkChip='<span class="badge '+(chk.status==='confirmed'?'b-done':'b-wait')+'" style="margin-left:4px">'+(chk.status==='confirmed'?T('chip_done'):T('chip_wait'))+'</span>';
        const csts=dd.dates.map(iso=>((req.ws||{})[chkId+'|'+iso]||{}).status||'');
        const cprs=dd.dates.map(iso=>((req.ws||{})[chkId+'|'+iso]||{}).price||'');
        const cuSt=[...new Set(csts)],cuPr=[...new Set(cprs)];
        const cmSt=cuSt.length>1,cmPr=cuPr.length>1;

        const chkHead='<div class="wshead" data-chk-toggle="'+chkId+'" style="display:block;padding:0">'
          +'<div class="rq-datebar"><span class="chev'+(chkOpen?' open':'')+'" style="width:13px">▶</span><span class="hgnum sub">'+(i+1)+'-'+(ci+1)+'</span>'+fdate(dd.checkIn)+' → '+fdate(dd.checkOut)+' <span class="nightsb">'+dd.nights+T('n_sfx')+'</span><span class="rq-idx">'+T('chk_more')+' '+(ci+1)+chkChip+'</span></div>'
          +'<div class="rq-body">'
          +'<div class="flex aic" style="gap:5px;flex-wrap:wrap;margin-bottom:5px">'
          +(chk.region&&chk.region!=='전체'?'<span class="rq-region" style="margin-bottom:0">'+escT(dRegion(chk.region))+'</span>':'')
          +chkPhoneHTML(req,chk,chkId)
          +(chk.savedAt?'<span class="small" style="color:var(--muted);flex:0 0 auto">'+dotDateTime(chk.savedAt)+'</span>':'')+'</div>'
          +'<div class="qc-rowline" style="align-items:center;margin-top:0"><span class="rq-line"><span class="rq-hotel">'+escT(dHotel(chk.hotel))+'</span><span class="rq-type">'+escT(dRoom(chk.roomType)||'-')+' <span class="sm">· '+(chk.rooms||row.rooms||1)+T('r_sfx')+'</span></span></span>'
          +'<span style="display:flex;gap:5px;align-items:center;flex:0 0 auto">'+stSel('stsel',cmSt?'__none':cuSt[0],'data-chk="'+chkId+'"',cmSt)
          +'<span class="pbox"><span>฿</span><input type="number" class="chkPrice" data-chk="'+chkId+'" placeholder="'+esc(cmPr?T('ws_mixed'):T('ws_price_ph'))+'" value="'+(cmPr?'':(cuPr[0]||''))+'"></span></span></div>'
          +'</div></div>';
        let chkDetail='';
        if(chkOpen){
          chkDetail='<div class="detail"><div class="dhdr">In '+fdate(dd.checkIn)+' / Out '+fdate(dd.checkOut)+' · '+dd.nights+T('n_sfx')+' · '+T('ws_day_edit')+'</div>'
            +dd.dates.map(iso=>{const c=(req.ws||{})[chkId+'|'+iso]||{};
              return '<div class="drow"><span class="ddate">'+fdshort(iso)+'</span>'
                +stSel('stsel',c.status||'','data-chk-key="'+chkId+'|'+iso+'"',false)
                +'<div class="pbox"><span>฿</span><input type="number" class="chkone" data-chk-key="'+chkId+'|'+iso+'" placeholder="'+esc(T('ws_price_ph'))+'" value="'+(c.price||'')+'"></div></div>';}).join('')
            /* 호텔1과 동일: 옵션 섹션 */
            +'<button class="linkbtn optTog" data-chkid="'+chkId+'" style="margin-top:8px">▸ 호텔 추가 옵션 입력</button>'
            +'</div>';
        }
        chkCards+='<div class="wscard subcard">'+chkHead+chkDetail+'</div>'
          +recBlockHTML(req,row,i,dd,chkId,csts.length>0&&csts.every(s=>s==='so'));
      });
      /* 추가 호텔은 펼침 버튼 안에 접어 둔다 */
      const nChk=row.checkRequests.length;
      const dChk=row.checkRequests.filter((c,ci)=>chkDone(req,row,i,ci)).length;
      const listOpen=ui.chkListOpen.has(row.id);
      chkSection='<button class="chkListTog'+(listOpen?' open':'')+'" data-row="'+row.id+'">'
        +'<span class="chev'+(listOpen?' open':'')+'">▶</span>'
        +'<span>'+T('chk_more')+' ('+nChk+')</span>'
        +'<span class="badge '+(dChk===nChk?'b-done':'b-wait')+'" style="margin-left:auto">'+dChk+'/'+nChk+'</span></button>'
        +(listOpen?'<div class="chklist">'+chkCards+'</div>':'');
      /* 답변 전송은 하단의 "룸체크 답변보내기" 버튼 하나로 통일 */
    }
    /* C안: 호텔 + 그 추가 호텔을 하나의 그룹 박스로 묶는다 */
    const gTot=1+(row.checkRequests||[]).length;
    const gDone=(rdone?1:0)+(row.checkRequests||[]).filter((c,ci)=>chkDone(req,row,i,ci)).length;
    return '<div class="hgroup hg'+(i%3)+'">'
      +'<div class="hgrouphd"><span class="hgnum">'+(i+1)+'</span>'+T('hotel_n')+' '+(i+1)
      +'<span class="hgcnt">'+gDone+'/'+gTot+'</span></div>'
      +'<div class="wscard">'+head+detail+'</div>'
      +recBlockHTML(req,row,i,dd,row.id,sts.length>0&&sts.every(s=>s==='so'))
      +chkSection
      +'</div>';
  }).join('');
  const legend='<div class="legend">'
    +'<span class="small"><b style="color:var(--av)">AV</b> '+T('lg_av')+'</span>'
    +'<span class="small"><b style="color:var(--rq)">RQ</b> '+T('lg_rq')+'</span>'
    +'<span class="small"><b style="color:var(--so)">S/O</b> '+T('lg_so')+'</span></div>';
  return '<div class="flex between aic" style="margin:2px 0 6px"><h3 style="margin:0;font-size:15.5px;font-weight:800">'+T('ws_title')+'</h3><span class="mono small">'+reqNo(req)+'</span></div>'
    +'<div class="metaline" style="color:#1E63C8;font-weight:600">'+T('recv_w')+' '+escT(nickOf(req.registrant)||T('no_input'))+' · '+dotDateTime(req.createdAt)+'</div>'+(req.answeredAt?'<div class="metaline" style="color:var(--av);font-weight:600">'+T('ans_w')+' '+escT(nickOf(req.manager))+' · '+dotDateTime(req.answeredAt)+(req.registrant?' · 요청 '+escT(nickOf(req.registrant)):'')+(req.agentManager?' / '+T('agent_w')+' '+escT(nickOf(req.agentManager)):'')+'</div>':'')+(req.quoteRequested&&!req.quoteSent?'<div class="metaline" style="color:var(--so)">💬 '+T('b_qreq_staff')+'</div>':'')
    +(req.notes?'<div class="reqbox">📝 '+T('extra_req')+': '+escT(req.notes)+'</div>':'')
    +'<div style="margin-top:10px">'+cards+'</div>'+legend
    +'<p class="foot">'+T('ws_foot')+'</p>'
    +(ui.role==='schk'
      ? (req.quoteRequested&&!req.quoteSent?'<p class="small" style="margin:8px 2px 2px">'+T('ws_qreq_note')+'</p>':'')
        +(totalCount(req)>1&&!allDone(req)?'<p class="small" style="margin:8px 2px 2px;color:var(--so)">'+TF('ws_partial_warn',{n:totalCount(req)-doneCount(req)})+'</p>':'')
        +'<div class="qbtns"><button class="qcopy" id="sendA">'+(totalCount(req)>1&&!allDone(req)&&doneCount(req)>0
          ?TF('btn_send_partial',{n:doneCount(req),t:totalCount(req)})
          :(req.status==='requested'?T('btn_send_ans'):T('btn_send_upd')))+'</button></div>'
      : (((req.direct&&req.status==='answered')?'<div class="qbtns"><button class="'+(req.forwardedAt?'qgray':'qcopy')+'" id="fwdAgent">'+(req.forwardedAt?'✅ 에이전트에 전송됨':'📤 에이전트에게 전송')+'</button></div>'+(req.forwardedAt?'<p class="small" style="margin:4px 2px;color:var(--muted)">전송 '+dotDateTime(req.forwardedAt)+'</p>':'<p class="small" style="margin:4px 2px;color:var(--rq)">확인 후 에이전트에게 전송하면 에이전트가 결과를 볼 수 있습니다.</p>'):''))        /* A안: 매번 누르는 "답변 보내기"만 크게. 되돌리기(다시 룸체크)는 그 옆에 두되
           빨간 점선으로 성격을 갈라 놓는다 — 입력을 초기화하는 동작이라 오누름이 위험하다.
           자주 안 쓰는 계약 완료·지난 리스트는 "⋯ 더보기" 안으로 접는다. */
        +'<div class="qbtns" style="margin-top:12px"><button class="qprimary" id="sendA">'+(req.status==='requested'?T('btn_send_ans'):T('btn_send_upd'))+'</button>'
        +'<button class="qdanger" data-recheck="'+req.id+'">'+T('btn_recheck')+'</button></div>'
        +'<div class="qbtns"><button class="qghost" id="qTog">'+(ui.qOpen?T('mkq_close'):T('mkq'))+'</button>'
        +'<button class="qghost" id="sendQ">'+T('btn_sendq')+'</button></div>'
        +(ui.qOpen?quoteBuilderHTML(req):'')
        +'<button class="moreTog'+(ui.moreOpen?' open':'')+'" id="moreTog">'+(ui.moreOpen?'▾ '+T('more_close'):'⋯ '+T('more_open'))+'</button>'
        +(ui.moreOpen?'<div class="moreopen"><div class="qbtns" style="margin-top:0">'
          +(req.contractedAt
            ?'<button class="qquiet" data-contract="'+req.id+'">'+T('btn_contract_x')+'</button>'
            :'<button class="qquiet qok" data-contract="'+req.id+'">'+T('btn_contract')+'</button>')
          +(!req.archivedAt&&!req.contractedAt?'<button class="qquiet" data-topast="'+req.id+'">'+T('btn_topast')+'</button>':'')
          +'</div></div>':''));
}
function stSel(cls,val,attrs,mixed){let o=STOPT.map(([v,t])=>opt(v,t,val===v)).join('');
  if(mixed)o='<option value="__mix" selected>'+T('ws_mixed')+'</option>'+o;
  return '<select class="'+cls+' '+(STCLS[val]||'')+'" '+attrs+'>'+o+'</select>';}
function buildWsFromDOM(req){try{req.ws=req.ws||{};var dbg={na:0,np:0,sv:[],pv:[],wb:Object.keys(req.ws||{}).length};document.querySelectorAll('select.stsel[data-all]').forEach(function(sel){dbg.na++;dbg.sv.push(sel.dataset.all+'#'+sel.value);var v=sel.value;if(!v||v==='__mix')return;var rid=sel.dataset.all;var row=(req.rows||[]).find(function(r){return String(r.id)===String(rid)});if(!row)return;var idx=req.rows.indexOf(row);rDates(req,row,idx).dates.forEach(function(iso){var k=rid+'|'+iso;req.ws[k]=req.ws[k]||{};req.ws[k].status=v;});});document.querySelectorAll('select.stsel[data-key]').forEach(function(sel){var v=sel.value;if(!v||v==='__mix')return;var k=sel.dataset.key;req.ws[k]=req.ws[k]||{};req.ws[k].status=v;});document.querySelectorAll('input.pall').forEach(function(inp){dbg.np++;dbg.pv.push(inp.dataset.all+'#'+inp.value);var v=inp.value;if(v===''||v==null)return;var rid=inp.dataset.all;var row=(req.rows||[]).find(function(r){return String(r.id)===String(rid)});if(!row)return;var idx=req.rows.indexOf(row);rDates(req,row,idx).dates.forEach(function(iso){var k=rid+'|'+iso;req.ws[k]=req.ws[k]||{};req.ws[k].price=v;});});document.querySelectorAll('input.pone').forEach(function(inp){var v=inp.value;if(v===''||v==null)return;var k=inp.dataset.key;req.ws[k]=req.ws[k]||{};req.ws[k].price=v;});
/* 추가 호텔 — 호텔1과 동일하게 일괄값 먼저, 요일별 값이 덮어쓰기 */
var _chkRow=function(cid){var rid=String(cid).split('_chk_')[0];return (req.rows||[]).find(function(r){return String(r.id)===rid});};
var _chkDates=function(cid){var row=_chkRow(cid);if(!row)return null;return rDates(req,row,req.rows.indexOf(row)).dates;};
document.querySelectorAll('select.stsel[data-chk]').forEach(function(sel){var v=sel.value;if(!v||v==='__mix')return;var cid=sel.dataset.chk,ds=_chkDates(cid);if(!ds)return;ds.forEach(function(iso){var k=cid+'|'+iso;req.ws[k]=req.ws[k]||{};req.ws[k].status=v;});});
document.querySelectorAll('input.chkPrice[data-chk]').forEach(function(inp){var v=inp.value;if(v===''||v==null)return;var cid=inp.dataset.chk,ds=_chkDates(cid);if(!ds)return;ds.forEach(function(iso){var k=cid+'|'+iso;req.ws[k]=req.ws[k]||{};req.ws[k].price=v;});});
document.querySelectorAll('select.stsel[data-chk-key]').forEach(function(sel){var v=sel.value;if(!v||v==='__mix')return;var k=sel.dataset.chkKey;req.ws[k]=req.ws[k]||{};req.ws[k].status=v;});
document.querySelectorAll('input.chkone[data-chk-key]').forEach(function(inp){var v=inp.value;if(v===''||v==null)return;var k=inp.dataset.chkKey;req.ws[k]=req.ws[k]||{};req.ws[k].price=v;});
/* 확인자 추천 — 진행률에는 안 들어가지만 상태·요금은 답변에 실려야 한다 */
var _recDates=function(k){for(var i=0;i<req.rows.length;i++){var r=req.rows[i];
  if((r.recommends||[]).some(function(x){return 'rec_'+x.id===k}))return rDates(req,r,i).dates;}return null;};
document.querySelectorAll('select.stsel[data-rec]').forEach(function(sel){var v=sel.value;if(!v||v==='__mix')return;
  var k=sel.dataset.rec,ds=_recDates(k);if(!ds)return;
  ds.forEach(function(iso){var kk=k+'|'+iso;req.ws[kk]=req.ws[kk]||{};req.ws[kk].status=v;});});
document.querySelectorAll('input.recPrice').forEach(function(inp){var v=inp.value;if(v===''||v==null)return;
  var k=inp.dataset.rec,ds=_recDates(k);if(!ds)return;
  ds.forEach(function(iso){var kk=k+'|'+iso;req.ws[kk]=req.ws[kk]||{};req.ws[kk].price=v;});});
dbg.wa=Object.keys(req.ws||{}).length;dbg.dup=(typeof DB!=='undefined'&&DB.requests?DB.requests.filter(function(x){return x&&x.id===req.id}).length:-1);req._bwd=dbg;}catch(e){req._domerr=String(e);}}
function bindStaff(){
  const ck=document.getElementById('checker');if(ck)ck.oninput=e=>{DB.checker=e.target.value;saveDB();};
  bindCommonList();
  document.querySelectorAll('[data-ssel]').forEach(el=>el.onclick=()=>{const id=Number(el.dataset.ssel);
    ui.ssel=ui.ssel===id?null:id;ui.open=new Set();ui.qOpen=false;
    if(ui.ssel&&ui.role==='schk'){const r=byId(ui.ssel);
      if(r&&r.status==='requested'){const n=applyFullbook(r);
        if(n>0){saveDB();setTimeout(()=>toast(TF('t_fb_auto',{n:n})),100);}}}
    renderApp();});
  const bk=document.getElementById('backupBtn');if(bk)bk.onclick=downloadBackup;
  const req=byId(ui.ssel);if(!req)return;if(!req.ws||Array.isArray(req.ws)){var _o={};if(req.ws)for(var _k in req.ws)_o[_k]=req.ws[_k];req.ws=_o;}
  document.querySelectorAll('[data-toggle]').forEach(el=>el.onclick=e=>{
    if(e.target.closest('select,input,textarea,button,a'))return;
    const id=Number(el.dataset.toggle);ui.open.has(id)?ui.open.delete(id):ui.open.add(id);renderApp();});
  const stampRow=rid=>{const r=req.rows.find(x=>x.id===Number(rid));if(r)r.savedAt=Date.now();};
  document.querySelectorAll('select.stsel[data-all]').forEach(sel=>sel.onchange=e=>{
    const id=Number(e.target.dataset.all),v=e.target.value;if(v==='__mix')return;
    const row=req.rows.find(r=>r.id===id),i=req.rows.indexOf(row);
    rDates(req,row,i).dates.forEach(iso=>{const k=id+'|'+iso;req.ws[k]=req.ws[k]||{};req.ws[k].status=v;});stampRow(id);saveDB();renderApp();});
  document.querySelectorAll('input.pall').forEach(inp=>inp.onchange=e=>{
    const id=Number(e.target.dataset.all),v=e.target.value;
    const row=req.rows.find(r=>r.id===id),i=req.rows.indexOf(row);
    rDates(req,row,i).dates.forEach(iso=>{const k=id+'|'+iso;req.ws[k]=req.ws[k]||{};req.ws[k].price=v;});stampRow(id);saveDB();renderApp();});
  document.querySelectorAll('select.stsel[data-key]').forEach(sel=>sel.onchange=e=>{
    const k=e.target.dataset.key;req.ws[k]=req.ws[k]||{};req.ws[k].status=e.target.value;stampRow(k.split('|')[0]);saveDB();renderApp();});
  document.querySelectorAll('input.pone').forEach(inp=>{
    inp.oninput=e=>{const k=e.target.dataset.key;req.ws[k]=req.ws[k]||{};req.ws[k].price=e.target.value;};
    inp.onchange=e=>{stampRow(e.target.dataset.key.split('|')[0]);saveDB();renderApp();};});
  document.querySelectorAll('.phSel').forEach(s=>s.onchange=e=>{const rid=Number(s.dataset.prid),row=req.rows.find(x=>x.id===rid);if(!row)return;
    const v=e.target.value;
    if(v==='__add'){ui.phAdd.add(rid);renderApp();return;}
    if(v){row.phone=v;saveDB();}renderApp();});
  document.querySelectorAll('.phNew').forEach(inp=>inp.onchange=e=>{const rid=Number(inp.dataset.prid),row=req.rows.find(x=>x.id===rid);if(!row)return;
    const v=e.target.value.trim();if(!v){ui.phAdd.delete(rid);renderApp();return;}
    if(!row.hotel){toast(T('t_need_hotel'));return;}
    DB.phones=DB.phones||{};DB.phones[row.hotel]=DB.phones[row.hotel]||[];
    if(!DB.phones[row.hotel].includes(v))DB.phones[row.hotel].push(v);
    row.phone=v;ui.phAdd.delete(rid);saveDB();renderApp();toast(T('t_contact_saved'));});
  document.querySelectorAll('.phWho').forEach(inp=>{inp.oninput=e=>{const rid=Number(inp.dataset.prid),row=req.rows.find(x=>x.id===rid);if(row)row.confirmedBy=e.target.value;};
    inp.onchange=e=>{stampRow(inp.dataset.prid);saveDB();renderApp();};});
  document.querySelectorAll('.optTog').forEach(b=>b.onclick=()=>{ui.optOpen.add(Number(b.dataset.id));renderApp();});
  document.querySelectorAll('.optitem[data-woid]').forEach(rowEl=>{const rid=Number(rowEl.dataset.wrid),oid=Number(rowEl.dataset.woid);
    const r=req.rows.find(x=>x.id===rid),o=r&&(r.options||[]).find(x=>x.id===oid);if(!o)return;
    rowEl.querySelector('.woptName').oninput=e=>{o.name=e.target.value;};
    rowEl.querySelector('.woptAmt').onchange=e=>{o.amt=Number(e.target.value)||0;saveDB();renderApp();};
    rowEl.querySelector('.woptQty').onchange=e=>{o.qty=Math.max(1,Number(e.target.value)||1);saveDB();renderApp();};
    rowEl.querySelector('.woptDel').onclick=()=>{r.options=r.options.filter(x=>x.id!==oid);saveDB();renderApp();};});
  document.querySelectorAll('.woptAdd').forEach(b=>b.onclick=()=>{const r=req.rows.find(x=>x.id===Number(b.dataset.id));
    r.options=r.options||[];r.options.push({id:Date.now(),name:'',qty:1,amt:0,show:true,memo:''});saveDB();renderApp();});
  const qt=document.getElementById('qTog');if(qt)qt.onclick=()=>{ui.qOpen=!ui.qOpen;renderApp();};
  const mt=document.getElementById('moreTog');if(mt)mt.onclick=()=>{ui.moreOpen=!ui.moreOpen;renderApp();};
  if(ui.qOpen)bindQuoteBuilder(req);
  const sa=document.getElementById('sendA');if(sa)sa.onclick=()=>{buildWsFromDOM(req);confirmChecks(req);req.status='answered';req.answeredAt=Date.now();req.manager=DB.checker||'심은선';req.answerComplete=allDone(req);recordFullbook(req);saveDB();renderApp();
    toast(isFullbookReq(req)?T('t_fullbook')+reqNo(req)
      :(!allDone(req)?TF('t_partial',{n:doneCount(req),t:totalCount(req)})+reqNo(req)
      :T('t_answered')+reqNo(req)));};
  const fa=document.getElementById('fwdAgent');if(fa)fa.onclick=()=>{req.forwardedAt=Date.now();saveDB();renderApp();toast('에이전트에 전송 · '+reqNo(req));};
  const sq=document.getElementById('sendQ');if(sq)sq.onclick=()=>{buildWsFromDOM(req);confirmChecks(req);req.status='answered';req.answeredAt=Date.now();req.manager=DB.checker||'심은선';req.answerComplete=allDone(req);req.quoteSent=true;req.quoteRequested=false;req.quoteSentAt=Date.now();req.quoteBy=DB.checker||'심은선';recordFullbook(req);saveDB();renderApp();toast(T('t_qsent')+reqNo(req));};
  /* Phase 2: 추가 호텔 확인 버튼 바인딩 */
  document.querySelectorAll('[id^="btn-confirm-"]').forEach(btn=>{
    btn.onclick=()=>{
      const chkId=Number(btn.id.replace('btn-confirm-',''));
      const priceInput=document.querySelector('.chkPrice[data-check="'+chkId+'"]');
      const noteInput=document.querySelector('.chkPriceNote[data-check="'+chkId+'"]');
      for(let row of req.rows){
        if(!row.checkRequests)continue;
        const chk=row.checkRequests.find(c=>c.id===chkId);
        if(chk){
          const price=priceInput?Number(priceInput.value)||0:0;
          const note=noteInput?noteInput.value:'';
          updateCheckRequestStatus(row.id,chkId,'confirmed',price,note);
          return;
        }
      }
    };
  });
  document.querySelectorAll('[id^="btn-price-"]').forEach(btn=>{
    btn.onclick=()=>{
      const chkId=Number(btn.id.replace('btn-price-',''));
      toggleCheckEdit(chkId);
    };
  });
  document.querySelectorAll('[id^="btn-reject-"]').forEach(btn=>{
    btn.onclick=()=>{
      const chkId=Number(btn.id.replace('btn-reject-',''));
      for(let row of req.rows){
        if(!row.checkRequests)continue;
        const chk=row.checkRequests.find(c=>c.id===chkId);
        if(chk){
          updateCheckRequestStatus(row.id,chkId,'rejected');
          return;
        }
      }
    };
  });
  /* ===== 확인자 추천 ===== */
  const findRec=(rowId,recId)=>{
    const row=req.rows.find(r=>String(r.id)===String(rowId));
    return row&&(row.recommends||[]).find(x=>String(x.id)===String(recId));};
  const recDates=recK=>{
    for(let i=0;i<req.rows.length;i++){
      const row=req.rows[i];
      if((row.recommends||[]).some(x=>recKey(x)===recK))return rDates(req,row,i).dates;}
    return null;};
  document.querySelectorAll('.recAdd').forEach(b=>b.onclick=e=>{
    e.preventDefault();e.stopPropagation();      /* 접기 바 토글까지 함께 실행되지 않게 */
    ui.recOpen.delete(String(b.dataset.target)); /* 기본값(추천 있음 → 펼침)으로 되돌려 새 칸이 보이게 */
    addRecommend(b.dataset.req,b.dataset.row,b.dataset.target);});
  document.querySelectorAll('button.chkListTog[data-rec-tog]').forEach(b=>{
    b.onclick=e=>{
      if(e.target.closest('.recAdd'))return;     /* ＋추천은 위 핸들러가 처리 */
      const t=String(b.dataset.recTog);
      ui.recOpen.has(t)?ui.recOpen.delete(t):ui.recOpen.add(t);renderApp();};});
  document.querySelectorAll('select.recRegion').forEach(sel=>sel.onchange=e=>{
    const rec=findRec(sel.dataset.row,sel.dataset.rid);if(!rec)return;
    clearHotelPick(rec,e.target.value);          /* 지역 바뀌면 호텔·룸타입 비움 */
    saveDB();renderApp();});
  document.querySelectorAll('input.recHotel').forEach(inp=>{
    inp.onchange=e=>{
      const rec=findRec(inp.dataset.row,inp.dataset.rid);if(!rec)return;
      applyHotelPick(rec,e.target.value.trim()); /* 지역 자동 선택 + 룸타입 로드 */
      saveDB();renderApp();};
    const _rec=findRec(inp.dataset.row,inp.dataset.rid);
    if(_rec)attachHotelFinder(inp,()=>_rec.region,name=>{
      applyHotelPick(_rec,name);saveDB();renderApp();});});
  document.querySelectorAll('input.recRoom').forEach(inp=>inp.onchange=e=>{
    const rec=findRec(inp.dataset.row,inp.dataset.rid);if(!rec)return;
    rec.roomType=e.target.value.trim();saveDB();renderApp();});
  document.querySelectorAll('select.stsel[data-rec]').forEach(sel=>sel.onchange=e=>{
    const k=e.target.dataset.rec,v=e.target.value;if(v==='__mix')return;
    const ds=recDates(k);if(!ds)return;req.ws=req.ws||{};
    ds.forEach(iso=>{const kk=k+'|'+iso;req.ws[kk]=req.ws[kk]||{};req.ws[kk].status=v;});
    saveDB();renderApp();});
  document.querySelectorAll('input.recPrice').forEach(inp=>inp.onchange=e=>{
    const k=e.target.dataset.rec,v=e.target.value;
    const ds=recDates(k);if(!ds)return;req.ws=req.ws||{};
    ds.forEach(iso=>{const kk=k+'|'+iso;req.ws[kk]=req.ws[kk]||{};req.ws[kk].price=v;});
    saveDB();renderApp();});
  /* 추가 호텔 목록 전체 펼침/접힘.
     [data-row]로 좁힌다 — 좁히지 않으면 추천 바(.recTog)까지 잡아 그 onclick을 덮어쓴다. */
  document.querySelectorAll('button.chkListTog[data-row]').forEach(b=>b.onclick=e=>{
    e.stopPropagation();
    const rid=Number(b.dataset.row);
    ui.chkListOpen.has(rid)?ui.chkListOpen.delete(rid):ui.chkListOpen.add(rid);renderApp();});
  /* 추가 호텔 개별 카드 펼침/접힘 토글 */
  document.querySelectorAll('[data-chk-toggle]').forEach(el=>el.onclick=e=>{
    if(e.target.closest('select,input,textarea,button,a'))return;
    const id=el.dataset.chkToggle;ui.checkExpand.has(id)?ui.checkExpand.delete(id):ui.checkExpand.add(id);renderApp();});
  /* 추가 호텔 찾기 헬퍼 */
  const findChk=cid=>{for(const row of req.rows){if(!row.checkRequests)continue;
    for(let ci=0;ci<row.checkRequests.length;ci++){if(row.id+'_chk_'+ci===cid)return {row,chk:row.checkRequests[ci],ci};}}return null;};
  /* Phase 4-F: 추가 호텔 상태 선택 (전체 날짜 일괄 — 호텔1의 stsel[data-all]과 동일) */
  document.querySelectorAll('select.stsel[data-chk]').forEach(sel=>sel.onchange=e=>{
    const chkId=e.target.dataset.chk,v=e.target.value;if(v==='__mix')return;
    const f=findChk(chkId);if(!f)return;
    f.chk.status=v;req.ws=req.ws||{};
    const dd=rDates(req,f.row,req.rows.indexOf(f.row));
    dd.dates.forEach(iso=>{const k=chkId+'|'+iso;req.ws[k]=req.ws[k]||{};req.ws[k].status=v;});
    f.chk.savedAt=Date.now();saveDB();renderApp();});

  /* Phase 4-F: 확인자 추가 호텔 금액 입력 (호텔1과 동일) */
  document.querySelectorAll('input.chkPrice[data-chk]').forEach(inp=>inp.onchange=e=>{
    const chkId=e.target.dataset.chk,v=e.target.value;
    const f=findChk(chkId);if(!f)return;
    const numVal=Math.round(Number(v)||0);
    f.chk.price=numVal;req.ws=req.ws||{};
    const dd=rDates(req,f.row,req.rows.indexOf(f.row));
    dd.dates.forEach(iso=>{const k=chkId+'|'+iso;req.ws[k]=req.ws[k]||{};req.ws[k].price=numVal;});
    f.chk.savedAt=Date.now();saveDB();renderApp();});
  /* 추가 호텔 요일별 상태 선택자 (호텔1의 stsel[data-key]와 동일) */
  document.querySelectorAll('select.stsel[data-chk-key]').forEach(sel=>sel.onchange=e=>{
    const k=e.target.dataset.chkKey,v=e.target.value;req.ws=req.ws||{};req.ws[k]=req.ws[k]||{};req.ws[k].status=v;
    const f=findChk(k.split('|')[0]);if(f)f.chk.savedAt=Date.now();
    saveDB();renderApp();});
  /* 추가 호텔 요일별 금액 입력 */
  document.querySelectorAll('input.chkone[data-chk-key]').forEach(inp=>{
    inp.oninput=e=>{const k=e.target.dataset.chkKey;req.ws=req.ws||{};req.ws[k]=req.ws[k]||{};req.ws[k].price=e.target.value;};
    inp.onchange=e=>{const f=findChk(e.target.dataset.chkKey.split('|')[0]);if(f)f.chk.savedAt=Date.now();saveDB();renderApp();};});
  /* 추가 호텔 전화번호 선택 */
  document.querySelectorAll('.chkPhSel').forEach(s=>s.onchange=e=>{
    const cid=s.dataset.chkid,f=findChk(cid);if(!f)return;
    const v=e.target.value;
    if(v==='__add'){ui.phAdd.add(cid);renderApp();return;}
    if(v){f.chk.phone=v;saveDB();}renderApp();});
  /* 추가 호텔 새 전화번호 입력 */
  document.querySelectorAll('.chkPhNew').forEach(inp=>inp.onchange=e=>{
    const cid=inp.dataset.chkid,f=findChk(cid);if(!f)return;
    const v=e.target.value.trim();if(!v){ui.phAdd.delete(cid);renderApp();return;}
    if(!f.chk.hotel){toast(T('t_need_hotel'));return;}
    DB.phones=DB.phones||{};DB.phones[f.chk.hotel]=DB.phones[f.chk.hotel]||[];
    if(!DB.phones[f.chk.hotel].includes(v))DB.phones[f.chk.hotel].push(v);
    f.chk.phone=v;ui.phAdd.delete(cid);saveDB();renderApp();toast(T('t_contact_saved'));});
  /* 추가 호텔 담당자(확인자) 입력 */
  document.querySelectorAll('.chkPhWho').forEach(inp=>{
    inp.oninput=e=>{const f=findChk(inp.dataset.chkid);if(f)f.chk.manager=e.target.value;};
    inp.onchange=e=>{const f=findChk(inp.dataset.chkid);if(f)f.chk.savedAt=Date.now();saveDB();renderApp();};});
  /* Phase 3-C: 추가 호텔 답변은 하단 "룸체크 답변보내기"(sendA) 하나로 통일 */
}
/* 답변 전송 시 완료된 추가 호텔을 확정 처리 — 호텔1의 rowDone과 동일 기준 */
function confirmChecks(req){
  req.rows.forEach((row,i)=>(row.checkRequests||[]).forEach((chk,ci)=>{
    if(!chkDone(req,row,i,ci))return;
    chk.status='confirmed';chk.confirmedAt=Date.now();chk.confirmedBy=DB.checker||'심은선';
  }));
}

/* ================= ④ 간단 견적 ================= */
function hotelTHB(req,row,i){let t=0;rDates(req,row,i).dates.forEach(iso=>{const c=(req.ws||{})[row.id+'|'+iso]||{};t+=(Number(c.price)||0)*Number(row.rooms);});return t;}
/* ===== 견적 여러 장 =====
   기존에는 req.quote 객체 하나뿐이라 두 번째 견적이 첫 번째를 덮어썼다.
   quotes[] 배열로 바꾸고, 예전에 저장된 견적은 quotes[0]으로 옮겨 담아 잃지 않는다.
   옛 견적의 환율은 그대로 두어 과거 금액이 바뀌지 않게 한다. */
const QRATE=45; /* 환율 기본값 */
function mkQuote(n,src){return Object.assign(
  {id:Date.now()+'_'+(Math.random()*1e6|0),name:T('q_nth').replace('{n}',n||1),
   rate:QRATE,pax:2,addl:[],override:null,remark:'',picks:{}},src||{});}
function migQuotes(r){
  if(!Array.isArray(r.quotes)){
    r.quotes=[mkQuote(1,r.quote?JSON.parse(JSON.stringify(r.quote)):null)];
    delete r.quote;
  }
  if(!r.quotes.length)r.quotes=[mkQuote(1)];
  r.quotes.forEach(q=>{q.picks=q.picks||{};q.addl=q.addl||[];});
  return r.quotes;
}
function curQuote(req){const qs=migQuotes(req);
  return qs[Math.min(Math.max(0,ui.qIdx|0),qs.length-1)];}
/* 한 구간(호텔 N 자리)에 들어갈 수 있는 후보 — 기본·추가·추천을 한 목록으로 */
function legCandidates(req,row,i){
  const out=[{key:String(row.id),kind:'base',name:row.hotel,roomType:row.roomType,rooms:row.rooms}];
  (row.checkRequests||[]).forEach((c,ci)=>out.push({key:row.id+'_chk_'+ci,kind:'add',
    name:c.hotel,roomType:c.roomType,rooms:c.rooms||row.rooms}));
  (row.recommends||[]).forEach(r=>out.push({key:'rec_'+r.id,kind:'rec',
    name:r.hotel,roomType:r.roomType,rooms:row.rooms}));
  return out;
}
function keyTHB(req,row,i,key,rooms){let t=0;
  rDates(req,row,i).dates.forEach(iso=>{const c=(req.ws||{})[key+'|'+iso]||{};
    t+=(Number(c.price)||0)*Number(rooms||1);});return t;}
/* 견적서 이름 — 저장하지 않고 고른 호텔과 투숙 기간에서 만든다.
   호텔을 바꾸면 이름도 따라 바뀌므로 탭만 봐도 어느 조합인지 알 수 있다. */
function quoteName(req,q){
  const hs=req.rows.map((r,i)=>{const p=pickedFor(req,r,i,q);
    return String(dHotel(p.name)||'').trim();}).filter(Boolean);
  const names=hs.length?hs.join(' + '):T('no_input');
  if(!req.rows.length)return names;
  const inD=rDates(req,req.rows[0],0).checkIn;
  const outD=req.mode==='parallel'?addDays(req.startDate,totalN(req)):finalOut(req);
  return names+' · '+fdshort(inD)+'~'+fdshort(outD);
}
function pickedFor(req,row,i,q){
  const cands=legCandidates(req,row,i);
  const k=(q.picks||{})[row.id];
  return cands.find(x=>x.key===k)||cands[0];
}
function hotelOptsList(req){const l=[];req.rows.forEach(r=>(r.options||[]).forEach(o=>l.push({rid:r.id,hotel:r.hotel,o})));return l;}
function quoteCalc(req,q){
  q=q||curQuote(req);
  const rate=Number(q.rate)||0,pax=Math.max(1,Number(q.pax)||1);
  /* 구간마다 고른 호텔 하나씩만 합산한다 — 같은 구간을 두 번 세면 숙박비가 두 배가 된다 */
  const perHotel=req.rows.map((r,i)=>{const p=pickedFor(req,r,i,q);
    return {row:r,key:p.key,kind:p.kind,name:p.name||'-',roomType:p.roomType,
      thb:keyTHB(req,r,i,p.key,p.rooms),showRate:!!r.showRate};});
  const hTHB=perHotel.reduce((a,x)=>a+x.thb,0);
  const optTHB=hotelOptsList(req).reduce((a,{o})=>a+lineTHB(o),0);
  const baseTHB=hTHB+optTHB;
  const addlKRW=q.addl.reduce((a,x)=>a+(x.cur==='krw'?lineTHB(x):lineTHB(x)*rate),0);
  const totalKRW=baseTHB*rate+addlKRW,per=totalKRW/pax;
  const perMan=q.override!=null?Number(q.override):per/10000;
  return {rate,pax,perHotel,hTHB,optTHB,baseTHB,addlKRW,totalKRW,per,perMan,totalMan:perMan*pax};}
function quoteText(req){
  const q=curQuote(req),c=quoteCalc(req,q);
  const optLine=o=>o.memo?o.memo:o.name;
  let t='The Nirvana · 여행 견적\n'
    +'요청 : '+(req.agent||'-')+(req.agentManager?'-'+req.agentManager:'')+'\n'+kdotDateTime(req.createdAt)+'\n'
    +'발행 : '+(req.quoteBy||DB.checker||req.registrant||'심은선')+'\n'+kdotDateTime(req.quoteSentAt||Date.now())+'\n';
  req.rows.forEach((row,i)=>{const dd=rDates(req,row,i);
    const sh=(row.options||[]).filter(o=>o.show&&o.name);
    t+='\n'+(i+1)+') '+kdstr(dd.checkIn)+' → '+kdstr(dd.checkOut)+' ('+dd.nights+'박)\n';
    if(row.region&&row.region!=='전체')t+=dRegion(row.region)+'\n';
    t+=(dHotel(row.hotel)||'-')+(req.status==='answered'?' → '+avKo(availOf(req,row,i)):'')+'\n'+(dRoom(row.roomType)||'-')+' · '+row.rooms+'실\n';
    sh.forEach(o=>{t+=optLine(o)+'\n';});
    /* 호텔 원가 노출은 요청자·확인자에게만. 에이전트에게는 견적 확정 금액만 나간다 */
    if(row.showRate&&costVisible())t+='   호텔 요금 ₩'+won(c.perHotel[i].thb*c.rate)+'\n';});
  q.addl.filter(x=>x.show&&(x.memo||x.desc)).forEach(x=>{t+='· '+(x.memo||x.desc)+'\n';});
  if(q.remark)t+='\n※ '+q.remark+'\n';
  t+='\n견적금액 · 1인 '+manwonF(c.perMan)+'\n'+c.pax+'인 기준 '+manwonF(c.totalMan);
  return t;}
function quoteCardHTML(req){
  const q=curQuote(req),c=quoteCalc(req,q);
  const answered=req.status==='answered';
  const legs=req.rows.map((row,i)=>{const dd=rDates(req,row,i);
    const sh=(row.options||[]).filter(o=>o.show&&o.name);
    const optLines=sh.map(o=>'<div style="margin-top:2px"><span class="qc-opt">'+escT(o.memo?o.memo:o.name)+'</span></div>').join('');
    const av=answered?availOf(req,row,i):null;
    return '<div class="qc-leg"><div class="qc-dbar"><span class="qc-dnum">'+(i+1)+'</span><span class="qc-dt">'+kdstr(dd.checkIn)+' <b class="qc-arw">→</b> '+kdstr(dd.checkOut)+'</span><span class="qc-dn">'+dd.nights+'박</span></div>'
      +(row.region!=='전체'&&row.region?'<div class="qc-region">'+escT(dRegion(row.region))+'</div>':'')
      +'<div class="qc-rowline" style="align-items:center;margin-top:1px"><span class="qc-h" style="margin-top:0">'+escT(dHotel(row.hotel)||'-')+'</span>'
      +(av?'<span class="avbig av-'+av.k+'" style="margin-top:0;font-size:11.5px;padding:4px 9px">'+avKo(av)+'</span>':'')+'</div>'
      +'<div class="qc-rt">'+escT(dRoom(row.roomType)||'-')+' <span class="sm">· '+row.rooms+'실</span></div>'
      +optLines
      +((row.showRate&&costVisible())?'<div class="qc-price">호텔 요금 ₩'+won(c.perHotel[i].thb*c.rate)+'</div>':'')
      +'</div>';}).join('');
  const incLines=q.addl.filter(x=>x.show&&(x.memo||x.desc)).map(x=>'<div style="margin-top:2px"><span class="qc-addl-txt">'+escT(x.memo||x.desc)+'</span></div>').join('');
  const qBy=req.quoteBy||DB.checker||req.registrant||'심은선';
  const qAt=req.quoteSentAt||Date.now();
  return '<div class="quotecard" id="qcard'+req.id+'"><div class="qc-title" style="font-size:17px;letter-spacing:.6px">The Nirvana · 여행 견적</div>'
    +'<div class="qc-sub" style="text-align:left;margin-top:8px;color:var(--sub);font-weight:700">요청 : '+escT((req.agent||'-')+(req.agentManager?'-'+req.agentManager:''))+'</div>'
    +'<div class="qc-sub" style="text-align:left;margin-top:1px">'+kdotDateTime(req.createdAt)+'</div>'
    +'<div class="qc-sub" style="text-align:left;margin-top:5px;color:var(--sub);font-weight:700">발행 : '+escT(qBy)+'</div>'
    +'<div class="qc-sub" style="text-align:left;margin-top:1px">'+kdotDateTime(qAt)+'</div>'
    +legs+(incLines?'<div class="qc-leg qc-addl">'+incLines+'</div>':'')
    +(q.remark?'<div class="qc-remark">※ '+escT(q.remark).replace(/\n/g,'<br>')+'</div>':'')
    +'<hr class="qc-sep"><div class="qc-final"><span class="lbl">견적금액 · 1인</span><span class="amt">'+manwonF(c.perMan)+'</span></div>'
    +'<div class="qc-sub">'+c.pax+'인 기준 '+manwonF(c.totalMan)+'</div></div>';
}
function quoteBuilderHTML(req){
  const q=curQuote(req),c=quoteCalc(req,q);
  const hotelRows=c.perHotel.map(h=>'<div class="brow"><span style="flex:1">'+escT(dHotel(h.name))+'</span><span class="mono">฿'+won(h.thb)+'</span></div>').join('');
  const hopts=hotelOptsList(req);
  const hoptRows=hopts.length?hopts.map(({rid,hotel,o})=>'<div class="optitem" data-hrid="'+rid+'" data-hoid="'+o.id+'">'
    +'<div class="toprow"><div style="flex:1;min-width:0"><div style="font-weight:700;font-size:13.5px">'+escT(o.name||'-')+'</div><div class="small">'+escT(dHotel(hotel)||'-')+'</div></div>'
    +'<button class="chip hoptShow'+(o.show?' on':'')+'">'+(o.show?T('qb_show'):T('qb_hide'))+'</button></div>'
    +'<div class="optline"><input type="number" class="hoptAmt" value="'+(o.amt||'')+'" placeholder="'+esc(T('ws_unit_ph'))+'"><span class="x">฿ ×</span><input type="number" class="hoptQty qty" min="1" value="'+(o.qty||1)+'"><span class="linetot">= ฿'+won(lineTHB(o))+'</span></div>'
    +'<input class="hoptMemo" style="margin-top:6px" value="'+esc(o.memo||'')+'" placeholder="'+esc(T('qb_memo_ph'))+'"></div>').join('')
    :'<div class="small" style="padding:4px 0">'+T('qb_none')+'</div>';
  const adRows=q.addl.map(x=>'<div class="optitem" data-aid="'+x.id+'">'
    +'<div class="toprow"><input class="adDesc" style="flex:1" value="'+esc(x.desc)+'" placeholder="'+esc(T('qb_desc_ph'))+'"><button class="chip adShow'+(x.show?' on':'')+'">'+(x.show?T('qb_show'):T('qb_hide'))+'</button><button class="del adDel">−</button></div>'
    +'<div class="optline"><input type="number" class="adAmt" value="'+(x.amt||'')+'" placeholder="'+esc(T('ws_unit_ph'))+'"><span class="x">×</span><input type="number" class="adQty qty" min="1" value="'+(x.qty||1)+'"><select class="adCur"><option value="thb"'+(x.cur==='thb'?' selected':'')+'>฿</option><option value="krw"'+(x.cur==='krw'?' selected':'')+'>₩</option></select><span class="linetot">= '+(x.cur==='krw'?'₩':'฿')+won(lineTHB(x))+'</span></div>'
    +'<input class="adMemo" style="margin-top:6px" value="'+esc(x.memo||'')+'" placeholder="'+esc(T('qb_memo_ph'))+'"></div>').join('');
  const ovrVal=Math.round(c.perMan*10)/10;
  const qs=migQuotes(req),qi=qs.indexOf(q);
  const st=ui.qStep;                         /* 단계마다 따로 접고 편다 */
  const K={base:'q_k_base',add:'q_k_add',rec:'q_k_rec'};
  /* ① 구간별 호텔 드롭다운 — 기본·추가·추천을 한 목록에 종류 표시와 함께 */
  const legRows=req.rows.map((r,i)=>{const dd=rDates(req,r,i),p=pickedFor(req,r,i,q);
    const os=legCandidates(req,r,i).map(cd=>{
      const amt=keyTHB(req,r,i,cd.key,cd.rooms);
      return '<option value="'+esc(cd.key)+'"'+(cd.key===p.key?' selected':'')+'>'
        +'['+T(K[cd.kind])+'] '+escT(dHotel(cd.name)||T('no_input'))
        +(amt?' · ฿'+won(amt):'')+'</option>';}).join('');
    return '<div class="qleg"><div class="qleglab">'+T('q_leg').replace('{n}',i+1)
      +'<span class="qlegdate">'+fdshort(dd.checkIn)+' → '+fdshort(dd.checkOut)+' · '+dd.nights+T('n_sfx')+'</span></div>'
      +'<select class="qPick" data-row="'+r.id+'">'+os+'</select>'
      +'<div class="qlegamt">฿'+won(keyTHB(req,r,i,p.key,p.rooms))+'</div></div>';}).join('');
  const step=(n,key,val,body)=>{const op=st.has(n);
    return '<div class="qstep'+(op?' on':'')+'">'
    +'<div class="qstephd" data-qstep="'+n+'"><span class="chev'+(op?' open':'')+'">▶</span>'
    +'<span class="qstepnum">'+n+'</span>'+T(key)
    +'<span class="qstepval">'+val+'</span></div>'
    +(op?'<div class="qstepbody">'+body+'</div>':'')+'</div>';};
  return '<div class="qbuild">'
    /* 견적 여러 장 — 탭 */
    +'<div class="qtabs">'+qs.map((x,ix)=>{const nm=quoteName(req,x);
      return '<button class="qtab'+(ix===qi?' on':'')+'" data-qtab="'+ix+'" title="'+esc(nm)+'">'+escT(nm)+'</button>';}).join('')
      +'<button class="qtab add" id="qAdd">'+T('q_new')+'</button></div>'
    /* ── 입력 카드 ── */
    +'<div class="qedit">'
    +step(1,'q_s1','฿'+won(c.hTHB),legRows)
    +step(2,'q_s2',(c.optTHB||q.addl.length)?'฿'+won(c.optTHB):T('q_empty'),
        '<div class="label">'+T('ws_opt_label')+'</div>'+hoptRows
        +'<div class="label" style="margin-top:10px">'+T('qb_addl')+'</div>'+adRows
        +'<button id="adAdd" class="addbtn sm">'+T('qb_addl_btn')+'</button>')
    +step(3,'q_s3',manwonF(c.perMan),
        '<div class="line l2" style="margin-top:0">'
        +'<div><div class="label">'+T('qb_rate')+'</div><input type="number" id="qRate" value="'+q.rate+'"></div>'
        +'<div><div class="label">'+T('qb_pax')+'</div><input type="number" id="qPax" min="1" value="'+q.pax+'"></div></div>'
        +'<div class="qsum">'
          +'<div class="brow"><span>'+T('qb_htotal')+'</span><span class="mono">฿'+won(c.hTHB)+'</span></div>'
          +'<div class="brow"><span>'+T('qb_optsum')+'</span><span class="mono">฿'+won(c.optTHB)+'</span></div>'
          +'<div class="brow"><span>'+T('qb_sub_rate')+' '+won(c.rate)+'</span><span class="mono">฿'+won(c.baseTHB)+' → ₩'+won(c.baseTHB*c.rate)+'</span></div>'
          +'<div class="brow"><span>'+T('qb_addl_sum')+'</span><span class="mono">₩'+won(c.addlKRW)+'</span></div>'
          +'<div class="brow tot" style="color:var(--brand)"><span>'+T('qb_krw_total')+' ('+c.pax+T('ppl')+')</span><span class="mono">₩'+won(c.totalKRW)+'</span></div>'
          +'<div class="brow" style="color:var(--muted)"><span>'+T('qb_auto1')+'</span><span class="mono">₩'+won(c.per)+' · '+manwonF(c.per/10000)+'</span></div></div>'
        +'<div class="qovr"><div class="label" style="color:var(--brand)">'+T('qb_final')+'</div>'
        +'<div class="flex aic" style="gap:8px"><input type="number" step="0.1" id="ovr" value="'+ovrVal+'" style="flex:1;text-align:right;font-weight:800;font-size:16px"><span style="font-weight:700">'+T('qb_man')+'</span>'
        +'<button id="ovrReset" class="curbtn" style="width:auto;padding:8px 12px">'+T('qb_auto')+'</button></div></div>')
    +step(4,'q_s4',q.remark?'●':T('q_empty'),
        '<div class="label">'+T('qb_remark')+'</div>'
        +'<textarea id="qRemark" placeholder="'+esc(T('qb_remark_ph'))+'">'+escT(q.remark||'')+'</textarea>'
        +'<div class="label" style="margin-top:12px">'+T('qb_preview')+'</div>'+quoteCardHTML(req)
        /* A안: 무엇을 내보내느냐(견적서만 / 결과+견적)로 먼저 묶고, 그 안에서 형식을 고른다.
           초록(.qmgr #2F7A55)은 AV 상태색과 같은 값이라 버렸다 — 상태색은 상태에만 쓴다. */
        +'<div class="qgrp"><div class="qgrptop">📄 '+T('exp_quote')+'<span class="n">'+T('exp_quote_n')+'</span></div>'
          +'<div class="qbtns" style="margin-top:0"><button class="qprimary2" id="qbCopy">'+T('exp_text')+'</button>'
          +'<button class="qprimary2" id="qbImg">'+T('exp_img')+'</button></div></div>'
        +'<div class="qgrp"><div class="qgrptop">📦 '+T('exp_full')+'<span class="n">'+T('exp_full_n')+'</span></div>'
          +'<div class="qbtns" style="margin-top:0"><button class="qghost2" id="fullUrl">'+T('exp_link')+'</button>'
          +'<button class="qghost2" id="fullImg">'+T('exp_img')+'</button></div></div>'
        +(qs.length>1?'<button class="qdelq" id="qDel">'+T('q_del')+'</button>':''))
    +'</div>'
    /* ── 결과: 어느 단계를 접든 최종 금액은 항상 보인다 ── */
    +'<div class="qhero"><div class="k">'+T('qb_final')+'</div>'
      +'<div class="v">'+manwonF(c.perMan)+'</div>'
      +'<div class="s">'+c.pax+T('ppl')+' '+manwonF(c.totalMan)+'</div></div>'
    +'<p class="foot">'+T('qb_foot')+'</p>'
    +'</div>';
}
function bindQuoteBuilder(req){
  /* 아코디언이라 접힌 단계의 요소는 DOM에 없다 — 모든 접근에 가드를 둔다 */
  const el=id=>document.getElementById(id);
  const on=(id,ev,fn)=>{const n=el(id);if(n)n[ev]=fn;};
  const Q=curQuote(req),qs=migQuotes(req);
  /* 단계 열고 닫기 — 한 번에 하나만 */
  document.querySelectorAll('[data-qstep]').forEach(h=>h.onclick=()=>{
    const n=Number(h.dataset.qstep);
    ui.qStep.has(n)?ui.qStep.delete(n):ui.qStep.add(n);renderApp();});
  /* 견적 탭 */
  document.querySelectorAll('button.qtab[data-qtab]').forEach(b=>b.onclick=()=>{
    ui.qIdx=Number(b.dataset.qtab);renderApp();});
  /* 새 견적은 지금 보고 있는 견적을 복제해서 만든다 — 호텔 선택·환율·인원·추가 항목·비고를
     그대로 가져오고, 바꾸고 싶은 것만 고치면 된다. id와 이름만 새로 받는다. */
  on('qAdd','onclick',()=>{const src=JSON.parse(JSON.stringify(Q));
    delete src.id;delete src.name;
    src.addl=(src.addl||[]).map((x,i)=>Object.assign({},x,{id:Date.now()+i}));
    qs.push(mkQuote(qs.length+1,src));ui.qIdx=qs.length-1;
    saveDB();renderApp();toast(T('q_copied'));});
  on('qDel','onclick',()=>{if(qs.length<2)return;if(!confirm(T('q_del_confirm')))return;
    const i=qs.indexOf(Q);qs.splice(i,1);ui.qIdx=Math.max(0,i-1);saveDB();renderApp();});
  /* ① 구간별 호텔 선택 */
  document.querySelectorAll('select.qPick').forEach(sel=>sel.onchange=e=>{
    Q.picks=Q.picks||{};Q.picks[sel.dataset.row]=e.target.value;saveDB();renderApp();});
  /* ③ 금액 */
  on('qRate','onchange',e=>{Q.rate=Number(e.target.value)||0;saveDB();renderApp();});
  on('qPax','onchange',e=>{Q.pax=Math.max(1,Number(e.target.value)||1);saveDB();renderApp();});
  on('ovr','onchange',e=>{Q.override=Number(e.target.value)||0;saveDB();renderApp();});
  on('ovrReset','onclick',()=>{Q.override=null;saveDB();renderApp();});
  /* ② 옵션 · 추가 항목 */
  on('adAdd','onclick',()=>{Q.addl.push({id:Date.now(),desc:'',amt:0,qty:1,cur:'thb',show:true,memo:''});saveDB();renderApp();});
  document.querySelectorAll('.optitem[data-hoid]').forEach(rowEl=>{const rid=Number(rowEl.dataset.hrid),oid=Number(rowEl.dataset.hoid);
    const r=req.rows.find(x=>x.id===rid),o=r&&(r.options||[]).find(x=>x.id===oid);if(!o)return;
    rowEl.querySelector('.hoptAmt').onchange=e=>{o.amt=Number(e.target.value)||0;saveDB();renderApp();};
    rowEl.querySelector('.hoptQty').onchange=e=>{o.qty=Math.max(1,Number(e.target.value)||1);saveDB();renderApp();};
    rowEl.querySelector('.hoptShow').onclick=()=>{o.show=!o.show;saveDB();renderApp();};
    rowEl.querySelector('.hoptMemo').oninput=e=>{o.memo=e.target.value;saveDB();};});
  document.querySelectorAll('.optitem[data-aid]').forEach(rowEl=>{const id=Number(rowEl.dataset.aid),it=Q.addl.find(x=>x.id===id);
    if(!it)return;
    rowEl.querySelector('.adDesc').oninput=e=>{it.desc=e.target.value;saveDB();};
    rowEl.querySelector('.adAmt').onchange=e=>{it.amt=Number(e.target.value)||0;saveDB();renderApp();};
    rowEl.querySelector('.adQty').onchange=e=>{it.qty=Math.max(1,Number(e.target.value)||1);saveDB();renderApp();};
    rowEl.querySelector('.adCur').onchange=e=>{it.cur=e.target.value;saveDB();renderApp();};
    rowEl.querySelector('.adShow').onclick=()=>{it.show=!it.show;saveDB();renderApp();};
    rowEl.querySelector('.adMemo').oninput=e=>{it.memo=e.target.value;saveDB();};
    rowEl.querySelector('.adDel').onclick=()=>{Q.addl=Q.addl.filter(x=>x.id!==id);saveDB();renderApp();};});
  /* ④ 비고 · 발송 */
  const qr=el('qRemark');if(qr){qr.oninput=e=>{Q.remark=e.target.value;saveDB();};qr.onchange=()=>renderApp();}
  on('qbCopy','onclick',()=>copyText(quoteText(req),T('t_qtcopied')));
  on('qbImg','onclick',()=>saveImg('qcard'+req.id,'견적.png'));
  on('fullImg','onclick',()=>saveFullImg(req));
  on('fullUrl','onclick',()=>copyText(reqURL(req),T('t_fullurl')));
}

/* ================= 달력 (범위 선택) ================= */
/* 한국 공휴일 (설·추석·부처님오신날 및 대체공휴일 포함, 2025–2028) */
const FIXED_HOL=['01-01','03-01','05-05','06-06','08-15','10-03','10-09','12-25'];
const LUNAR_HOL={
 2025:['01-28','01-29','01-30','03-03','05-06','10-05','10-06','10-07','10-08'],
 2026:['02-16','02-17','02-18','03-02','05-24','05-25','08-17','09-24','09-25','09-26','10-05'],
 2027:['02-06','02-07','02-08','02-09','05-13','08-16','09-14','09-15','09-16','10-04','10-11','12-27'],
 2028:['01-25','01-26','01-27','05-02','10-02','10-03','10-04','10-05']};
const isHoliday=iso=>{const y=Number(iso.slice(0,4)),md=iso.slice(5);
  return FIXED_HOL.includes(md)||((LUNAR_HOL[y]||[]).includes(md));};
let cal=null;
/* mode: 'range'(첵인 달력 — 첫 클릭=첵인, 둘째 클릭=첵아웃) | 'out'(첵아웃 달력 — 첵아웃만 변경) */
function openCal(target,inIso,outIso,mode){mode=mode||'range';
  cal={target,mode,anchor:mode==='out'?inIso:null,hover:null,
    month:(mode==='out'?(outIso||inIso):inIso).slice(0,7),curIn:inIso,curOut:outIso};renderCal();}
function closeCal(){cal=null;const el=document.getElementById('calov');if(el)el.remove();}
function calMin(){let min=todayISO(); /* 오늘 이후만 선택 가능 */
  if(cal.target.type==='row'){const d=draft,row=d.rows.find(r=>r.id===cal.target.rowId),i=d.rows.indexOf(row);
    if(i>0){const m=addDays(rDates(d,d.rows[i-1],i-1).checkIn,1);if(m>min)min=m;}}
  if(cal.mode==='out'){const m=addDays(cal.anchor,1);if(m>min)min=m;} /* 첵아웃은 첵인 다음날부터 */
  return min;}
function calApply(a,b){const d=draft;
  if(cal.target.type==='global'){d.startDate=a;d.sharedNights=diffD(a,b);}
  else{const row=d.rows.find(r=>r.id===cal.target.rowId),i=d.rows.indexOf(row);
    if(!row){closeCal();return;}
    if(i===0)d.startDate=a;
    else{const prev=d.rows[i-1],pci=rDates(d,prev,i-1).checkIn;prev.nights=Math.max(1,diffD(pci,a));}
    row.nights=diffD(a,b);}
  closeCal();renderApp();}
function calShiftMonth(n){const p=cal.month.split('-').map(Number);const d=new Date(Date.UTC(p[0],p[1]-1+n,1));
  cal.month=d.getUTCFullYear()+'-'+String(d.getUTCMonth()+1).padStart(2,'0');renderCal();}
function renderCal(){
  let ov=document.getElementById('calov');
  if(!ov){ov=document.createElement('div');ov.id='calov';document.body.appendChild(ov);
    ov.onclick=e=>{if(e.target.id==='calov')closeCal();};}
  const p=cal.month.split('-').map(Number),y=p[0],m=p[1];
  const startDow=new Date(Date.UTC(y,m-1,1)).getUTCDay();
  const dim=new Date(Date.UTC(y,m,0)).getUTCDate();
  const min=calMin(),a=cal.anchor,h=cal.hover;
  let info=T('cal_pick_in');
  if(cal.mode==='out')info=fdshort(a)+' '+T('cal_pick_out');
  else if(a&&h&&diffD(a,h)>=1)info=fdshort(a)+' → '+fdshort(h)+' · <b>'+diffD(a,h)+T('n_sfx')+'</b> '+T('cal_confirm');
  else if(a)info=fdshort(a)+' '+T('cal_pick_out');
  let cells='';
  for(let k=0;k<startDow;k++)cells+='<span class="cd dis"></span>';
  for(let day=1;day<=dim;day++){
    const iso=cal.month+'-'+String(day).padStart(2,'0');
    const dow=(startDow+day-1)%7;
    let cls='cd';
    if(dow===0||isHoliday(iso))cls+=' hol';else if(dow===6)cls+=' sat';
    if(min&&iso<min)cls+=' dis';
    if(a&&iso===a)cls+=' anchor';
    else if(a&&h&&iso>a&&iso<h)cls+=' inr';
    else if(a&&h&&iso===h)cls+=' endr';
    cells+='<button class="'+cls+'" data-iso="'+iso+'">'+day+'</button>';
  }
  const ty=new Date().getFullYear();
  let ys='';for(let yy=Math.min(ty,y)-1;yy<=Math.max(ty,y)+3;yy++)ys+=opt(String(yy),yy+T('yr'),yy===y);
  let ms='';for(let mm=1;mm<=12;mm++)ms+=opt(String(mm),isEN()?MON[mm-1]:(mm+T('mo')),mm===m);
  ov.innerHTML='<div class="calbox">'
    +'<div class="calhead"><button class="calnav" id="calPrev">‹</button>'
      +'<span class="calym"><select class="calsel" id="calY">'+ys+'</select><select class="calsel" id="calM">'+ms+'</select></span>'
      +'<button class="calnav" id="calNext">›</button></div>'
    +'<div class="calinfo">'+info+'</div>'
    +'<div class="calgrid">'+(isEN()?WDE:WDK).map((w,ix)=>'<span class="cwd'+(ix===0?' hol':(ix===6?' sat':''))+'">'+w+'</span>').join('')+cells+'</div>'
    +'<div class="calfoot"><button class="chip" id="calClose">'+T('cal_close')+'</button></div></div>';
  document.getElementById('calPrev').onclick=()=>calShiftMonth(-1);
  document.getElementById('calNext').onclick=()=>calShiftMonth(1);
  document.getElementById('calClose').onclick=closeCal;
  document.getElementById('calY').onchange=e=>{cal.month=e.target.value+'-'+cal.month.split('-')[1];renderCal();};
  document.getElementById('calM').onchange=e=>{cal.month=cal.month.split('-')[0]+'-'+String(Number(e.target.value)).padStart(2,'0');renderCal();};
  ov.querySelectorAll('.cd[data-iso]').forEach(c=>{
    const iso=c.dataset.iso;
    if(c.classList.contains('dis'))return; /* 과거·불가 날짜는 클릭 무시 */
    c.onclick=()=>{
      if(cal.mode==='out'){calApply(cal.anchor,iso);return;} /* 첵아웃만 변경 */
      if(!cal.anchor){cal.anchor=iso;cal.hover=null;renderCal();}
      else if(iso>cal.anchor){calApply(cal.anchor,iso);}
      else{cal.anchor=iso;cal.hover=null;renderCal();} /* 범위 밖 → 첵인부터 다시 */
    };
    c.onmouseenter=()=>{if(cal.mode!=='out'&&cal.anchor&&iso>cal.anchor&&cal.hover!==iso){cal.hover=iso;renderCal();}};
  });
}

/* ================= 토스트 & 초기화 ================= */
let _tt;function toast(m){const t=document.getElementById('toast');t.textContent=m;t.style.opacity='1';clearTimeout(_tt);_tt=setTimeout(()=>t.style.opacity='0',2000);}
(async function init(){
  applyChrome();
  if(!await srvInit())return;
  applyChrome();
  /* 에이전시/서버 로그인 시 에이전트·담당자 자동 채움 (2026-07-17) */
  if(SRV.on&&SRV.me){
    if(ui.role==='agent'&&!draft.agent)draft.agent=meNick()||DB.agentName||'';
    if((ui.role==='agent'||ui.role==='sreq')&&meNick())draft.registrant=meNick();
  }
  sweep();
  const imp=loadHash();
  if(imp){
    if(!imp.no){var _ik=imp.direct?'seqD':'seqA';DB[_ik]=(DB[_ik]||0)+1;imp.no=DB[_ik];}
    upsert(imp);
    if(ui.role==='agent'){ui.sel=imp.id;}else{ui.ssel=imp.id;}
    history.replaceState(null,'',location.pathname+location.search);
    toast(TF('t_imported',{no:reqNo(imp)}));
  }
  renderApp();
})();
