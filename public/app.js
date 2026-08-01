/* ================= 기준 데이터 ================= */
const HOTELS=[
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
const REGIONS=["전체","카오락","푸켓","파타야","크라비","방콕"];
const OPTLIST=["올인","올인 2회","풀보드","하프보드","조식 포함","허니문 세팅","고층 요청","커넥팅룸","레이트 체크아웃","얼리 체크인","패스트 트랙","VIP 라운지","공항 픽업"];
const MON=["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
const WDK=["일","월","화","수","목","금","토"];
const STOPT=[["","–"],["av","AV"],["rq","RQ"],["so","S/O"]];
const STCLS={av:"st-av",rq:"st-rq",so:"st-so","":""};

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
const RG_EN={"카오락":"Khao Lak","푸켓":"Phuket","파타야":"Pattaya","크라비":"Krabi","방콕":"Bangkok"};
let FORCE_KO=false; /* 전체 이미지(고객용) 렌더 시 한국어 강제 */
/* 표시 언어 판정: 역할이 아니라 "지정 언어" 기준 — 한국어 선택 시 한글, 영어/태국어 선택 시 영문 (2026-07-30) */
const isEN=()=>{if(FORCE_KO||typeof ui==='undefined')return false;
  if(ui.role!=='sreq'&&ui.role!=='schk')return false;
  try{const a=LANG_ALLOWED[ui.role]||[];let l=(typeof DB!=='undefined'&&DB&&DB.langs&&DB.langs[ui.role])||a[0];if(!a.includes(l))l=a[0];return l!=='ko';}catch(e){return true;}};
const dHotel=n=>isEN()?(HOTEL_EN[n]||n):n;
/* API 영문 룸타입의 한글 표기 변환 (표시용 · 저장은 원문 유지, 2026-07-30) */
const RT_WORD_KO={Deluxe:"디럭스",Superior:"슈페리어",Suite:"스위트",Twin:"트윈",Double:"더블",Triple:"트리플",King:"킹",Queen:"퀸",Villa:"빌라",Pool:"풀",Family:"패밀리",Studio:"스튜디오",Premier:"프리미어",Premium:"프리미엄",Executive:"이그제큐티브",Grand:"그랜드",Junior:"주니어",Club:"클럽",Garden:"가든",Beach:"비치",Beachfront:"비치프론트",Oceanfront:"오션프론트",Penthouse:"펜트하우스",Residence:"레지던스",Room:"룸",Bungalow:"방갈로",Cottage:"코티지",Standard:"스탠다드",Classic:"클래식",Signature:"시그니처",Royal:"로얄",Presidential:"프레지덴셜",
  /* 약어/추가 단어 (2026-07-30) */
  PV:"풀빌라","S/V":"씨뷰",SV:"씨뷰",DLX:"디럭스",STD:"스탠다드",SUP:"슈페리어",EXE:"이그제큐티브",JR:"주니어",BF:"비치프론트",OV:"오션뷰",GV:"가든뷰",CV:"시티뷰",MV:"마운틴뷰",
  View:"뷰",Sea:"씨",Ocean:"오션",Mountain:"마운틴",City:"시티",Lake:"레이크",River:"리버",Lagoon:"라군",Access:"액세스",Wing:"윙",Corner:"코너",Terrace:"테라스",Balcony:"발코니",Connecting:"커넥팅",Honeymoon:"허니문",Romance:"로맨스",Romantic:"로맨틱",Love:"러브",In:"인",Bedroom:"베드룸",Loft:"로프트",Duplex:"듀플렉스",Cabana:"카바나",Chalet:"샬레",Tent:"텐트",Apartment:"아파트먼트",Jacuzzi:"자쿠지",Plunge:"플런지",Cliff:"클리프",Hillside:"힐사이드",Seaside:"씨사이드",Sunset:"선셋",Sunrise:"선라이즈",One:"원",Two:"투",Three:"쓰리"};
const RT_PHRASE_KO=[["Sea View","씨뷰"],["Ocean View","오션뷰"],["Pool Access","풀액세스"],["Pool Villa","풀빌라"],["with Balcony","(발코니)"],["With Balcony","(발코니)"],["No Balcony","(발코니 없음)"],["City View","시티뷰"],["Mountain View","마운틴뷰"],["Garden View","가든뷰"]];
const _rtWordKoMap={};Object.keys(RT_WORD_KO).forEach(k=>{_rtWordKoMap[k.toLowerCase()]=RT_WORD_KO[k];});
const _rtKo2En={}; /* 한글 표기 → 원문(영문) 역매핑 (입력·선택 시 원문으로 저장) */
function rtDispKo(n){if(!n||/[가-힣]/.test(n))return n;
  let s=String(n);RT_PHRASE_KO.forEach(p=>{s=s.split(p[0]).join(p[1]);});
  s=s.split(/\s+/).map(w=>{const hit=_rtWordKoMap[w.toLowerCase()];return hit||w;}).join(' ').trim();
  if(s!==n)_rtKo2En[s]=n;return s;}
const dRoom=n=>isEN()?(RT_EN[n]||n):rtDispKo(n);
const dRegion=n=>isEN()?(RG_EN[n]||n):n;
const fdate=iso=>isEN()?fmtD(iso):kdstr(iso);
const fdshort=iso=>isEN()?fmtD(iso):kdshort(iso);
const esc=v=>String(v||'').replace(/"/g,'&quot;');
const escT=v=>String(v||'').replace(/&/g,'&amp;').replace(/</g,'&lt;');
const opt=(v,t,sel)=>'<option value="'+esc(v)+'"'+(sel?' selected':'')+'>'+t+'</option>';
const hotelsIn=r=>r==="전체"?HOTELS:HOTELS.filter(h=>h.region===r);
const roomsFor=name=>{const h=HOTELS.find(x=>x.name===name);return h?h.rooms:GENERIC;};
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
let ui={role:(typeof PAGE!=='undefined'?PAGE:'agent'),sel:null,ssel:null,notesOpen:false,open:new Set(),optOpen:new Set(),hnOpen:new Set(),qOpen:false,pastOpen:false,conOpen:false,qbOpen:null,phAdd:new Set()};
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
function visNotifs(){var items=NOTIF.items||[];
  var wk=Date.now()-7*24*3600*1000;items=items.filter(function(n){return Number(n.at||0)>=wk;}); /* 2026-08-01: 최근 1주일만 표시 */
  if(ui.role==='agent'){var me=[meName(),meNick()].filter(Boolean).map(function(x){return String(x).trim();});items=items.filter(function(n){var a=n.p&&n.p.agent;return a?me.indexOf(String(a).trim())>=0:false;});}return items;}
function visUnread(){return visNotifs().filter(function(n){return n.new;}).length;}
function notifPanelHTML(){
  const items=(visNotifs()).map(n=>{
    const key={new_request:'nt_new_request',answered:'nt_answered',partial:'nt_partial',quote_requested:'nt_quote_requested',quote_sent:'nt_quote_sent'}[n.type]||n.type;
    const sub=[n.p&&n.p.hotels?escT(n.p.hotels):'',n.p&&n.p.agent?escT(n.p.agent):''].filter(Boolean).join(' · ');
    return '<div class="ntitem'+(n.new?' ntnew':'')+'" data-ntgo="'+esc(n.no||'')+'" style="cursor:pointer"><div class="ntline1">'+T(key)+' <b>'+esc(n.no||'')+'</b></div>' /* 2026-08-01: 클릭 시 해당 요청으로 이동 */
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
  /* 알림 클릭 → 해당 요청 열기 (2026-08-01) */
  document.querySelectorAll('[data-ntgo]').forEach(it=>it.onclick=()=>{
    const no=it.dataset.ntgo;if(!no)return;
    const r=(DB.requests||[]).find(x=>{try{return reqNo(x)===no;}catch(e){return false;}});
    ui.notifOpen=false;
    if(!r){renderApp();toast('해당 요청을 찾을 수 없습니다');return;}
    if(ui.role==='schk'){
      ui.listTab=(r.status==='answered'&&r.answerComplete)?(isFullbookReq(r)?'full':'done'):'act';
      ui.ssel=r.id;
    }else{
      ui.listTab=r.contractedAt?'con':(r.archivedAt?'past':'act');
      ui.sel=r.id;ui.ssel=r.id;
    }
    renderApp();
    setTimeout(()=>{const t=document.querySelector('[data-sel="'+r.id+'"],[data-ssel="'+r.id+'"]');if(t)t.scrollIntoView({behavior:'smooth',block:'start'});},80);
  });
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
/* 부계정의 소속 에이전시(회사) 이름 (2026-07-30): 회원정보에서 수정한 값 우선, 없으면 API 목록에서 idx로 조회 */
function myAgencyName(){
  if(!SRV.on||!SRV.me)return '';
  if(SRV.me.agent_company)return String(SRV.me.agent_company);
  const ag=SRV.me.agency;if(!ag||!ag.idx)return '';
  const a=(typeof AGENTS!=='undefined'?AGENTS:[]).find(x=>x&&x.api&&x.idx===ag.idx);
  return a?a.name:'';
}
/* 에이전트 페이지 기본값 (2026-07-30): 에이전트=소속 에이전시(회사), 담당자=본인 — 통계가 '에이전트 담당자'로 잡히도록 */
function applyAgentDefaults(){
  if(ui.role!=='agent'||!SRV.on||!SRV.me)return;
  const comp=myAgencyName();
  if(comp)draft.agent=comp; /* 에이전트 페이지는 항상 본인 소속 에이전시로 고정 (다른 사용자 localStorage 잔값 무시, 2026-07-31) */
  if(!draft.agentManager)draft.agentManager=meNick()||'';
}
/* 외부 API 목록 반영 (2026-07-30): 캐시 즉시 표시 후 백그라운드 갱신 */
function applyAgencies(_gl){
  (_gl||[]).slice().sort((a,b)=>String(a.name||'').localeCompare(String(b.name||''),'ko'))
    .forEach(a=>{if(a&&a.name&&(a.active==null||a.active==='Y')&&!AGENTS.some(x=>x.name===a.name))AGENTS.push({name:a.name,nickname:'',api:true,idx:a.idx});});
}
function applyHotels(_hl){
  _hl=(_hl||[]).slice();if(!_hl.length)return;
  const _a2r={KL:'카오락',PK:'푸켓',PT:'파타야',KR:'크라비',BK:'방콕'};
  _hl.sort((a,b)=>((b.main_hotel_yn==='Y')-(a.main_hotel_yn==='Y'))||String(a.name_kr||a.name||'').localeCompare(String(b.name_kr||b.name||''),'ko'));
  const keep={};HOTELS.forEach(h=>{if(h.api&&(h._rtLoaded||h._telLoaded))keep[h.name]=h;}); /* 로드된 룸타입 캐시 보존 */
  HOTELS.length=0; /* 너바나 호텔만 표시 — 정적/중복 목록 제거 */
  _hl.forEach(h=>{if(!h)return;const _dn=h.name_kr||h.name;if(!_dn||HOTELS.some(x=>x.name===_dn))return;
    if(h.name&&h.name!==_dn){if(!HOTEL_EN[_dn])HOTEL_EN[_dn]=h.name;if(!HOTEL_KO[h.name])HOTEL_KO[h.name]=_dn;}
    HOTELS.push(keep[_dn]||{name:_dn,region:_a2r[h.area]||'전체',rooms:GENERIC.slice(),api:true,idx:h.idx,main:h.main_hotel_yn==='Y'});});
}
async function loadExternalLists(){
  try{const c=JSON.parse(localStorage.getItem('rc_extcache')||'null');
    if(c&&Date.now()-c.at<600000){applyAgencies(c.agencies);applyHotels(c.hotels);applyAgentDefaults();}}catch(e){}
  let _ags=null,_hts=null;
  await Promise.all([
    fetch('api/agencies?active=Y',{cache:'no-store'}).then(r=>r.ok?r.json():null).then(j=>{_ags=(j&&j.agencies)||null;}).catch(()=>{}),
    fetch('api/hotels?active=Y',{cache:'no-store'}).then(r=>r.ok?r.json():null).then(j=>{_hts=(j&&j.hotels)||null;}).catch(()=>{})
  ]);
  if(_ags)applyAgencies(_ags);
  if(_hts)applyHotels(_hts);
  if(_ags||_hts){try{localStorage.setItem('rc_extcache',JSON.stringify({at:Date.now(),agencies:_ags||[],hotels:_hts||[]}));}catch(e){}}
  applyAgentDefaults();
  const editing=document.activeElement&&['INPUT','TEXTAREA','SELECT'].includes(document.activeElement.tagName);
  if(!editing)renderApp();
}
async function srvInit(){
  try{
    /* 로딩 속도 개선 (2026-07-31): me/agents/state 3개 요청을 동시에 시작 —
       순차 호출 시 왕복지연(RTT)×3이 걸리던 것을 1회분으로 단축 */
    const pMe=fetch('api/me',{cache:'no-store'});
    const pAg=fetch('api/agents',{cache:'no-store'}).catch(()=>null);
    const pSt=fetch('api/state?rev=-1',{cache:'no-store'}).catch(()=>null);
    const r=await pMe;
    if(!r.ok)throw 0;
    const j=await r.json();
    if(!j||typeof j!=='object'||!('user' in j))throw 0;
    if(!j.user){location.href='login.html?to='+encodeURIComponent(ui.role);return false;}
    const pageOf={agent:'agent.html',sreq:'request.html',schk:'check.html',admin:'admin.html'};
    if(j.user.role!==ui.role&&j.user.role!=='admin'){location.href=pageOf[j.user.role]||'index.html';return false;}
    SRV.on=true;SRV.me=j.user;
    /* 외부 API(에이전시·호텔)는 첫 화면을 막지 않고 백그라운드 로드 + 10분 캐시 */
    loadExternalLists();
    try{const _ar=await pAg;if(_ar&&_ar.ok)AGENTS=(await _ar.json()).agents||[];}catch(e){}
    DB.langs=DB.langs||{};
    if(j.user.lang&&(LANG_ALLOWED[ui.role]||[]).includes(j.user.lang))DB.langs[ui.role]=j.user.lang;
    try{const rs=await pSt;if(rs&&rs.ok)srvApplyState(await rs.json());}catch(e){}
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
  if(j.nicks)SRV.nicks=j.nicks; /* 이름→닉네임 맵 (2026-08-01) */
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
/* 호텔 연락처 자동 로드 — API 호텔이면 /api/hotels/{idx}의 telnumber를 연락처 목록에 자동 등록 (2026-07-30) */
async function ensureHotelPhone(name){
  const h=HOTELS.find(x=>x.name===name&&x.api&&x.idx);if(!h||h._telLoaded)return;h._telLoaded=true;
  try{const r=await fetch('api/hotels/'+h.idx,{cache:'no-store'});if(!r.ok){h._telLoaded=false;return;}
    const j=await r.json();const tel=String((((j&&j.hotel)||{}).hotel||{}).telnumber||'').trim();
    if(!tel)return;
    DB.phones=DB.phones||{};DB.phones[name]=DB.phones[name]||[];
    if(DB.phones[name].indexOf(tel)<0){DB.phones[name].unshift(tel);saveDB();if(typeof srvSchedule==='function')srvSchedule();
      const editing=document.activeElement&&['INPUT','TEXTAREA','SELECT'].includes(document.activeElement.tagName);
      if(!editing)renderApp();
    }
  }catch(e){h._telLoaded=false;}
}
function phoneHTML(req,row){
  if(!(ui.role==='schk'||ui.role==='sreq'))return '';
  DB.phones=DB.phones||{};
  if(row.hotel)ensureHotelPhone(row.hotel);
  const nums=(row.hotel&&DB.phones[row.hotel])||[];
  const sel=row.phone&&nums.includes(row.phone)?row.phone:(nums[0]||'');
  let os=nums.map(n=>opt(n,'📞 '+n,n===sel)).join('');
  os+='<option value="__add">'+T('ph_add_opt')+'</option>';
  let h='<select class="phSel" data-prid="'+row.id+'" style="width:auto;flex:0 1 auto;padding:7px 5px;font-size:12px;font-family:var(--mono)">'
    +(nums.length?'':'<option value="" selected>'+T('ph_none')+'</option>')+os+'</select>';
  if(sel)h+='<a class="chip on" style="text-decoration:none;line-height:1" href="tel:'+sel.replace(/[^+0-9]/g,'')+'">'+T('ph_call')+'</a>';
  if(ui.phAdd.has(row.id))h+='<input class="phNew" data-prid="'+row.id+'" placeholder="'+esc(T('ph_new'))+'" style="width:150px;flex:0 0 auto;padding:7px 8px;font-size:12px;font-family:var(--mono)">';
  if(ui.role==='schk'||(ui.role==='sreq'&&req.direct))
    h+='<input class="phWho" data-prid="'+row.id+'" value="'+esc(row.confirmedBy||'')+'" placeholder="'+esc(T('ph_who'))+'" style="width:104px;flex:0 0 auto;padding:7px 8px;font-size:12px">';
  return h;
}
function draftFromReq(r){const base=Date.now();
  return {mode:r.mode,startDate:r.startDate,sharedNights:r.sharedNights||1,sharedRooms:(r.mode==='parallel'&&r.rows[0]?r.rows[0].rooms:1),
    agent:r.agent||'',agentManager:r.agentManager||'',registrant:r.registrant||'심은선',manager:'',notes:r.notes||'',quoteAsk:false,
    _quote:r.quote?JSON.parse(JSON.stringify(r.quote)):null,
    _wsn:r.rows.map((row,i)=>rDates(r,row,i).dates.map(iso=>{const c=(r.ws||{})[row.id+'|'+iso]||{};return {price:c.price||''};})),
    rows:r.rows.map((row,i)=>({id:base+i,region:row.region||'전체',hotel:row.hotel||'',roomType:row.roomType||'',rooms:row.rooms||1,nights:row.nights||1,note:row.note||'',
      options:(row.options||[]).map((o,j)=>({id:base+100+i*10+j,name:o.name,qty:o.qty||1,amt:o.amt||0,show:o.show!==false,memo:o.memo||''}))}))};}
function newDraft(prev){return {mode:'multi',startDate:todayISO(),sharedNights:1,sharedRooms:1,
  agent:prev?prev.agent:(DB.agentName||''),agentManager:prev?prev.agentManager:'',registrant:prev?prev.registrant:'심은선',manager:'',notes:'',quoteAsk:false,
  agentName:prev?prev.agentName:'',agentNickname:prev?prev.agentNickname:'',agentPhone:prev?prev.agentPhone:'',agentBank:prev?prev.agentBank:'',
  rows:[{id:Date.now(),region:'전체',hotel:'',roomType:'',rooms:1,nights:1,note:'',options:[]}]};}
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
  if(req.status==='requested'){const prog=forStaff&&req.rows.length>1&&doneCount(req)>0?' '+doneCount(req)+'/'+req.rows.length:'';
    return req.quoteRequested
    ? '<span class="badge b-wait">'+(forStaff?T('b_wait_staff'):T('b_wait'))+prog+'</span><span class="badge b-qreq">'+(forStaff?T('b_qreq_staff'):T('b_qreq'))+'</span>'
    : '<span class="badge b-wait">'+(forStaff?T('b_wait_staff'):T('b_wait'))+prog+'</span>';}
  const part=req.status==='answered'&&req.rows.length>1&&!allDone(req);
  const resend=forStaff&&req.status==='answered'&&!req.answerComplete&&allDone(req);
  const ansB=part?'<span class="badge b-wait">'+T('b_partial')+' '+doneCount(req)+'/'+req.rows.length+'</span>'
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
function doneCount(req){return req.rows.filter((r,i)=>rowDone(req,r,i)).length;}
function allDone(req){return doneCount(req)===req.rows.length;}
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
  else{app.innerHTML=langSwitchHTML()+checkerHTML()+staffListHTML();bindStaff();}
  bindLang();
}
function checkerHTML(){
  return '<section class="card"><div class="label">'+T('checker_label')+'</div>'
    +'<input id="checker" value="'+esc(DB.checker||'')+'" placeholder="'+esc(T('checker_ph'))+'"></section>';
}

/* ================= ① 요청자(에이전트) 폼 ================= */
function agentSelOpts(cur){var opts='<option value="">'+escT(T('ph_sel_input'))+'</option>';var names=AGENTS.map(function(a){return a.name;});AGENTS.forEach(function(a){var lbl=(a.nickname&&a.nickname!==a.name)?(a.nickname+' ('+a.name+')'):a.name;opts+='<option value="'+esc(a.name)+'"'+(a.name===cur?' selected':'')+'>'+escT(lbl)+'</option>';});if(cur&&names.indexOf(cur)<0)opts+='<option value="'+esc(cur)+'" selected>'+escT(cur)+'</option>';return opts;}
/* 커스텀 빠른검색 드롭다운 (2026-07-30)
   - 표시: 지정 언어 이름 1개만 (한글 없으면 영문)
   - 검색: 한글/영문 어느 쪽이든 부분 일치 (공백 무시) — "마이"→마이카오락, "다이"→DYNAMIC
   - 포커스/클릭 시 전체 목록, 입력 시 즉시 필터 */
function attachAC(inp,getItems,onPick){
  if(!inp||inp._ac)return;inp._ac=true;
  const wrap=inp.parentElement;if(!wrap)return;
  if(getComputedStyle(wrap).position==='static')wrap.style.position='relative';
  const box=document.createElement('div');
  box.style.cssText='display:none;position:absolute;top:100%;left:0;right:0;margin-top:4px;max-height:240px;overflow:auto;background:#fff;border:1px solid var(--line);border-radius:10px;z-index:70;box-shadow:0 10px 24px rgba(0,0,0,.14)';
  wrap.appendChild(box);
  const norm=s=>String(s||'').toLowerCase().replace(/\s+/g,'');
  const render=q=>{
    const nq=norm(q);
    const items=getItems().filter(it=>!nq||(it.s||[it.label]).some(x=>norm(x).includes(nq)));
    if(!items.length){box.style.display='none';return;}
    box.innerHTML=items.slice(0,200).map(it=>'<div style="padding:9px 12px;cursor:pointer;font-size:13px">'+escT(it.label)+(it.sub?' <span style="color:var(--muted);font-size:11.5px">· '+escT(it.sub)+'</span>':'')+'</div>').join('');
    box.style.display='block';
    Array.prototype.forEach.call(box.children,(el,i)=>{
      el.onmouseenter=()=>{el.style.background='#F2F5FA';};el.onmouseleave=()=>{el.style.background='';};
      el.onmousedown=ev=>{ev.preventDefault();box.style.display='none';onPick(items[i].label,items[i]);};
    });
  };
  inp.addEventListener('focus',()=>{render('');});
  inp.addEventListener('click',()=>{if(box.style.display==='none')render(inp._acTyped?inp.value:'');});
  inp.addEventListener('input',()=>{inp._acTyped=true;render(inp.value);});
  inp.addEventListener('blur',()=>{setTimeout(()=>{box.style.display='none';inp._acTyped=false;},150);});
  inp.addEventListener('keydown',e=>{if(e.key==='Escape')box.style.display='none';});
}
/* 에이전시 담당자 자동 로드 — 에이전트 선택 시 /api/agencies/{idx}의 managers를 담당자 목록에 반영 (2026-07-30)
   force=true(에이전트 확정 선택 시): 기존 담당자 값이 있어도 새 에이전시의 첫 담당자로 갱신 */
async function loadAgencyManagers(name,force){
  const a=AGENTS.find(x=>x.name===name&&x.api&&x.idx);if(!a)return;
  if(!a._mgrs){
    try{const r=await fetch('api/agencies/'+a.idx,{cache:'no-store'});if(!r.ok)return;
      const j=await r.json();
      a._mgrs=(((j&&j.agency)||{}).managers||[]).filter(m=>m&&m.mname&&(m.active==null||m.active==='Y')).map(m=>String(m.mname));
    }catch(e){return;}
  }
  const dl=document.getElementById('dlAm');
  if(dl)dl.innerHTML=a._mgrs.map(n=>'<option value="'+esc(n)+'">').join('')
    +(((DB.hist&&DB.hist.am)||[]).filter(n=>a._mgrs.indexOf(n)<0).map(n=>'<option value="'+esc(n)+'">').join(''));
  const am=document.getElementById('agentMgr');
  if(a._mgrs.length&&draft.agent===name&&(force||!draft.agentManager)){
    draft.agentManager=a._mgrs[0];
    if(am)am.value=a._mgrs[0];
  }
}
/* 호텔 룸타입 자동 로드 — API 호텔 선택 시 /api/hotels/{idx}의 room_types를 룸타입 목록에 반영 (2026-07-30) */
async function loadHotelRooms(name){
  const h=HOTELS.find(x=>x.name===name);if(!h||!h.api||!h.idx||h._rtLoaded)return;
  h._rtLoaded=true;
  try{const r=await fetch('api/hotels/'+h.idx,{cache:'no-store'});if(!r.ok){h._rtLoaded=false;return;}
    const j=await r.json();
    const rts=(((j&&j.hotel)||{}).room_types||[]).filter(rt=>rt&&rt.name&&(rt.active==null||rt.active==='Y')&&(rt.del==null||rt.del==='N'||rt.del===0||rt.del==='0')).map(rt=>String(rt.name));
    if(rts.length)h.rooms=rts; /* 빠른검색 목록은 열 때마다 roomsFor()를 다시 읽으므로 즉시 반영됨 */
  }catch(e){h._rtLoaded=false;}
}
function formHTML(){
  const d=draft;
  /* 2026-07-30: 에이전시 부계정 정보 섹션은 룸첵 요청 페이지에서 제거 — 회원정보(profile.html)에서만 표시 */
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
    /* 호텔/룸타입 목록은 커스텀 빠른검색 드롭다운(attachAC)으로 표시 — 표시명은 지정 언어 1개만 (2026-07-30) */
    const dateRow = d.mode==='multi'
      ? '<div class="dategrid">'
        +'<div class="datewrap" style="grid-area:1/1"><span class="dlab">'+T('checkin')+'</span><input class="dateinput" readonly data-target="'+row.id+'" data-kind="in" value="'+fdate(dd.checkIn)+'"><button class="calico calOpen" data-target="'+row.id+'" data-kind="in" title="'+esc(T('cal_open'))+'">📅</button></div>'
        +'<div class="datewrap" style="grid-area:2/1"><span class="dlab">'+T('checkout')+'</span><input class="dateinput" readonly data-target="'+row.id+'" data-kind="out" value="'+fdate(dd.checkOut)+'"><button class="calico calOpen" data-target="'+row.id+'" data-kind="out" title="'+esc(T('cal_open'))+'">📅</button></div>'
        +'<div class="dg-tall" style="grid-area:1/2/3/3"><div class="label">'+T('nights_label')+'</div><input type="number" class="inNights" min="1" value="'+row.nights+'"></div>'
        +'<div class="dg-tall" style="grid-area:1/3/3/4"><div class="label">'+T('rooms_label')+'</div><input type="number" class="inRooms" min="1" value="'+row.rooms+'"></div></div>'
      : '<div style="margin-top:10px"><div class="label">'+T('date_common')+'</div><div class="datebox"><span class="dv">'+fdate(dd.checkIn)+'</span><span class="arrow">→</span><span class="dv">'+fdate(dd.checkOut)+'</span><span class="nightsb">'+dd.nights+T('n_sfx')+'</span><span class="nightsb">'+(d.sharedRooms||1)+T('r_sfx')+'</span></div></div>';
    return '<div class="hblock" data-id="'+row.id+'">'
      +'<div class="flex between aic"><span class="bnum">'+T('hotel_n')+' '+(i+1)+'</span><button class="del btnDel" title="'+esc(T('del_hotel'))+'">−</button></div>'
      +'<div class="line lhotel" style="margin-top:8px">'
        +'<div><div class="label">'+T('region')+'</div><select class="selRegion">'+rlist+'</select></div>'
        +'<div><div class="label">'+T('hotel_sel')+'</div><input class="inHotel" autocomplete="off" value="'+esc(dHotel(row.hotel))+'" placeholder="'+esc(T('ph_hotel'))+'"></div>'
        +'<div><div class="label">'+T('room_sel')+'</div><input class="inRoom" autocomplete="off" value="'+esc(dRoom(row.roomType))+'" placeholder="'+esc(T('ph_room'))+'"></div></div>'
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
      +'</div>';
  }).join('');
  return '<section class="card">'
    +'<div class="label">'+T('mode_label')+'</div>'
    +'<div class="seg" id="mode"><button data-v="parallel"'+(d.mode==='parallel'?' class="on"':'')+'>'+T('mode_parallel')+'</button><button data-v="multi"'+(d.mode==='multi'?' class="on"':'')+'>'+T('mode_multi')+'</button></div>'
    +(ui.role==='sreq'
      ? '<div class="line l3">'
        +'<div><div class="label">'+T('agent_select')+'</div><input id="agent" autocomplete="off" value="'+esc(d.agent||'')+'" placeholder="'+esc(T('ph_sel_input'))+'"></div>'
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
function bindForm(){
  const d=draft;
  document.querySelectorAll('#mode button').forEach(b=>b.onclick=()=>{d.mode=b.dataset.v;renderApp();});
  const ag=document.getElementById('agent');if(ag){ag.oninput=e=>{d.agent=e.target.value;loadAgencyManagers(d.agent);};ag.onchange=e=>{d.agent=e.target.value;loadAgencyManagers(d.agent,true);};} /* 확정 선택 시 담당자 강제 갱신 */
  if(d.agent)loadAgencyManagers(d.agent); /* 이미 선택된 에이전트의 담당자 목록 미리 로드 */
  /* 에이전트 빠른검색 드롭다운 (2026-07-30): 이름/닉네임 부분 일치 */
  if(ag)attachAC(ag,
    ()=>AGENTS.map(a=>({label:a.name,s:[a.name,a.nickname||'']})),
    label=>{d.agent=label;ag.value=label;loadAgencyManagers(label,true);});
  const am=document.getElementById('agentMgr');if(am)am.oninput=e=>{d.agentManager=e.target.value;};
  const rg=document.getElementById('regName');if(rg)rg.oninput=e=>{d.registrant=e.target.value;};
  /* (2026-07-30) 부계정 정보 필드는 회원정보 페이지로 이동 — 요청 페이지 바인딩 제거 */
  const nt=document.getElementById('notes');nt.oninput=e=>{d.notes=e.target.value;};
  document.getElementById('notesHead').onclick=()=>{ui.notesOpen=!ui.notesOpen;renderApp();};
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
  document.querySelectorAll('#rows .hblock').forEach(el=>{
    const id=Number(el.dataset.id),row=d.rows.find(r=>r.id===id),i=d.rows.indexOf(row);
    el.querySelector('.selRegion').onchange=e=>{row.region=e.target.value;renderApp();};
    const hi=el.querySelector('.inHotel');
    /* 호텔 입력은 "찾기 전용" — 목록의 호텔(한/영)만 저장, 임의 입력은 저장하지 않음 (2026-07-30) */
    const hotelByInput=v=>{v=String(v||'').trim();if(!v)return '';const k=HOTEL_KO[v]||v;return HOTELS.some(x=>x.name===k)?k:null;};
    hi.oninput=e=>{const m=hotelByInput(e.target.value);if(m!==null){row.hotel=m;if(m)loadHotelRooms(m);}};
    hi.onchange=e=>{const m=hotelByInput(e.target.value);
      if(m===null){row.hotel='';e.target.value='';toast(T('t_pick_hotel'));}
      else{row.hotel=m;if(m)loadHotelRooms(m);}
      renderApp();};
    if(row.hotel)loadHotelRooms(row.hotel); /* 이미 선택된 호텔의 룸타입 미리 로드 */
    const ri=el.querySelector('.inRoom');
    /* 룸타입: 지정 언어 표기로 표시하되 저장은 표준값(정적=한글, API=영문 원문)으로 (2026-07-30) */
    const rtStore=v=>RT_KO[v]||_rtKo2En[v]||v;
    ri.oninput=e=>{row.roomType=rtStore(e.target.value);};
    ri.onchange=e=>{row.roomType=rtStore(e.target.value);renderApp();};
    /* 호텔/룸타입 빠른검색 드롭다운 (2026-07-30): 한/영 부분 일치, 표시명은 지정 언어 1개 */
    attachAC(hi,
      ()=>{const _ro={'카오락':1,'푸켓':2,'파타야':3,'크라비':4,'방콕':5}; /* 지역 그룹 순서 */
        return hotelsIn(row.region).map(h=>({label:dHotel(h.name),s:[h.name,HOTEL_EN[h.name]||''],main:!!h.main,
            _r:_ro[h.region]||9,sub:(row.region==='전체'&&h.region&&h.region!=='전체')?dRegion(h.region):''}))
          .sort((a,b)=>((b.main?1:0)-(a.main?1:0))||(a._r-b._r)||a.label.localeCompare(b.label,isEN()?'en':'ko'));}, /* 2026-07-31: 메인 우선 → 지역별 그룹 → 언어별 가나다/ABC */
      label=>{row.hotel=HOTEL_KO[label]||label;hi.value=label;loadHotelRooms(row.hotel);renderApp();});
    attachAC(ri,
      ()=>roomsFor(row.hotel).map(r=>({label:dRoom(r),s:[r,RT_EN[r]||'',dRoom(r)]})),
      label=>{row.roomType=rtStore(label);ri.value=label;renderApp();});
    const n=el.querySelector('.inNights');if(n)n.onchange=e=>{row.nights=Math.max(1,Number(e.target.value)||1);renderApp();};
    const rm=el.querySelector('.inRooms');if(rm)rm.onchange=e=>{row.rooms=Math.max(1,Number(e.target.value)||1);};
    el.querySelectorAll('[data-optid]').forEach(o=>{const oid=Number(o.dataset.optid),op=(row.options||[]).find(x=>x.id===oid);
      o.querySelector('.optSel').onchange=e=>{const v=e.target.value;
        if(v==='__c'){op._custom=true;if(OPTLIST.includes(op.name))op.name='';}
        else{op._custom=false;op.name=v;}
        renderApp();};
      const ci=o.querySelector('.inOptName');if(ci)ci.oninput=e=>{op.name=e.target.value;};
      o.querySelector('.inOptQty').onchange=e=>{op.qty=Math.max(1,Number(e.target.value)||1);};
      o.querySelector('.optDel').onclick=()=>{row.options=row.options.filter(x=>x.id!==oid);renderApp();};});
    el.querySelector('.addOpt').onclick=()=>{row.options=row.options||[];row.options.push({id:Date.now(),name:'',qty:1,amt:0,show:true,memo:''});renderApp();};
    const ht=el.querySelector('.hnTog');if(ht)ht.onclick=()=>{ui.hnOpen.has(id)?ui.hnOpen.delete(id):ui.hnOpen.add(id);renderApp();};
    const hx=el.querySelector('.hnText');if(hx)hx.oninput=e=>{row.note=e.target.value;};
    el.querySelector('.btnDel').onclick=()=>{if(d.rows.length>1){d.rows=d.rows.filter(r=>r.id!==id);renderApp();}};
  });
  document.getElementById('addRow').onclick=()=>{d.rows.push({id:Date.now(),region:'전체',hotel:'',roomType:'',rooms:1,nights:1,note:'',options:[]});renderApp();};
  function doSubmit(direct){
    if(!d.rows.some(r=>r.hotel.trim())){toast(T('t_need_hotel1'));return;}
    if(d.mode==='parallel')d.rows.forEach(r=>{r.rooms=Math.max(1,Number(d.sharedRooms)||1);});
    /* 에이전트 페이지 (2026-07-30): 에이전트=소속 에이전시(회사), 담당자=본인 자동 설정 */
    if(ui.role==='agent'){
      if(!(d.agent||'').trim())d.agent=myAgencyName()||meNick()||meName()||'';
      if(!(d.agentManager||'').trim())d.agentManager=meNick()||meName()||'';
    }
    DB.agentName=d.agent;
    var _sk=direct?'seqD':'seqA';DB[_sk]=(DB[_sk]||0)+1;
    DB.hist=DB.hist||{ag:[],am:[],st:[]};
    const pushHist=(arr,v)=>{v=(v||'').trim();if(v&&!arr.includes(v)){arr.unshift(v);if(arr.length>20)arr.pop();}};
    pushHist(DB.hist.ag,d.agent);pushHist(DB.hist.am,d.agentManager);pushHist(DB.hist.st,d.registrant);
    const req={id:Date.now(),no:DB[_sk],createdAt:Date.now(),status:'requested',direct:!!direct,
      quoteRequested:direct?false:((d.quoteKind||0)>0),quoteOnly:(d.quoteKind===1),quoteSent:false,answeredAt:null,
      registrant:(ui.role==='agent'?'':((d.registrant||'심은선').trim()||'심은선')),agentManager:(d.agentManager||'').trim(), /* 2026-07-30: 에이전트 등록 건은 요청자 미지정 — 통계 오귀속 방지 */
      mode:d.mode,startDate:d.startDate,sharedNights:d.sharedNights,agent:d.agent,manager:d.manager,notes:d.notes,
      rows:JSON.parse(JSON.stringify(d.rows)),ws:{},
      quote:d._quote?JSON.parse(JSON.stringify(d._quote)):{rate:40,pax:2,addl:[],override:null}};
    if(d._wsn)req.rows.forEach((row,i)=>{const arr=d._wsn[i];if(!arr||!arr.length)return;
      rDates(req,row,i).dates.forEach((iso,k)=>{const v=arr[k]||arr[arr.length-1];
        if(v&&v.price){req.ws[row.id+'|'+iso]={price:v.price};}});});
    upsert(req);draft=newDraft(d);
    if(ui.role==='agent')ui.sel=req.id;else ui.ssel=req.id;
    renderApp();
    toast((direct?T('t_direct_reg'):T('t_registered'))+reqNo(req));
  }
  document.getElementById('run').onclick=()=>doSubmit(false);
  const rd=document.getElementById('runDirect');if(rd)rd.onclick=()=>doSubmit(true);
}

/* ================= 요청 요약 (공용) ================= */
function reqSummaryHTML(req){
  return req.rows.map((row,i)=>{const dd=rDates(req,row,i);
      const opts=(row.options||[]).filter(o=>o.name).map(o=>'<span class="optchip">'+escT(optLabel(o))+'</span>').join('');
      return '<div class="rq-item rq-plain">'
        +'<div class="rq-datebar">'+fdate(dd.checkIn)+' → '+fdate(dd.checkOut)+' <span class="nightsb">'+dd.nights+T('n_sfx')+'</span><span class="rq-idx">'+T('hotel_n')+' '+(i+1)+'</span></div>'
        +'<div class="rq-body">'
        +(row.region&&row.region!=='전체'?'<div class="rq-region">'+escT(dRegion(row.region))+'</div>':'')
        +'<div class="rq-line"><span class="rq-hotel">'+escT(dHotel(row.hotel)||T('no_hotel'))+'</span><span class="rq-type">'+escT(dRoom(row.roomType)||'-')+' <span class="sm">· '+row.rooms+T('r_sfx')+'</span></span></div>'
        +(row.note?'<div class="rq-note">📝 '+escT(row.note)+'</div>':'')
        +(opts?'<div>'+opts+'</div>':'')+'</div></div>';
    }).join('')
    +(req.notes?'<div class="reqbox">📝 '+escT(req.notes)+'</div>':'')
    +(req.fromSample?'<div class="small" style="margin-top:6px;color:var(--muted)">📑 견적서 샘플에서 복사'+(req.fromSample.name?': '+escT(req.fromSample.name):'')+'</div>':'') /* 2026-08-01 */
    +'<div class="small" style="margin-top:6px">'+escT(agentLine(req))+' · '+T('reqdate_w')+' '+dotDateTime(req.createdAt)+'</div>';
}
function listHead(req,forStaff){
  const names=req.rows.map(function(r,i){var nm=escT(dHotel(r.hotel)||T('no_input'));if(req.status==='answered'&&!(ui.role==='agent'&&req.direct&&!req.forwardedAt)){var av=availOf(req,r,i);var col=av.k==='ok'?'var(--av)':(av.k==='no'?'var(--so)':((av.k==='rq'||av.k==='part')?'var(--rq)':''));if(col)nm='<span style="color:'+col+';font-weight:700">'+nm+'</span>';}return nm;}).join(req.mode==='multi'&&req.rows.length>1?' → ':' · ');
  const lastOut=req.mode==='parallel'?addDays(req.startDate,totalN(req)):finalOut(req);
  const extra=''; /* 2026-08-01: 에이전트/담당자 표기는 상단 헤더로 이동 (하단 중복 삭제) */
  const dtag=(ui.role!=='agent'&&req.direct&&!(req.status==='requested'&&!req.quoteSent))?'<span class="badge b-direct">'+T('b_direct_s')+'</span>':'';
  const stag=req.fromSample?'<span class="badge b-quote">📑 샘플</span>':''; /* 2026-08-01: 견적서 샘플 복사본 표시 */
  /* 상단 헤더 표기 (2026-08-01):
     - 에이전트 페이지: 확인자 닉네임 (답변 전이면 빈칸)
     - 직원 페이지: 에이전트 · 담당자(닉네임) — 없으면 등록 직원(닉네임) */
  let _who='';
  if(ui.role==='agent')_who=nickOf(req.manager)||'';
  else{
    const _ag=nickOf(req.agent)||'',_mgr=req.agentManager?(nickOf(req.agentManager)||''):'';
    _who=[_ag,_mgr].filter(Boolean).join(' · ')||nickOf(req.registrant)||'';
  }
  const _whoTxt=escT(_who);
  return '<div class="t1"><span class="mono small">'+reqNo(req)+(_whoTxt?' · '+_whoTxt:'')+' · '+dotDateTime(req.createdAt)+'</span><span style="display:flex;gap:4px;flex:0 0 auto">'+stag+dtag+reqBadge(req,forStaff)+'</span></div>'
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
          +(ui.qbOpen===req.id? quoteBuilderHTML(req)+'<div class="qbtns"><button class="qcopy" id="qbSend">'+(req.quoteSent?'견적 다시 발송':'견적 발송')+'</button><button class="qimg" id="qbSendTo">➤ '+T('btn_send_agent')+'</button></div>':'')
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
  const vis=r=>{if(ui.role!=='agent')return true;var me=[meName(),meNick(),myAgencyName()].filter(Boolean).map(function(x){return String(x).trim();});
    return me.indexOf(String(r.agent||'').trim())>=0||me.indexOf(String(r.agentManager||'').trim())>=0;}; /* 2026-07-30: 소속 에이전시명·담당자명으로도 매칭 */
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
      +'<button data-t="con"'+(tab==='con'?' class="on"':'')+'>'+T('tab_con')+' ('+con.length+')</button>'
      +(ui.role==='sreq'?'<button data-t="smp"'+(tab==='smp'?' class="on"':'')+'>📑 '+T('tab_samples')+'</button>':'')+'</div>'
    +(tab==='smp'
      ?samplesHTML() /* 견적서 샘플 탭 (2026-07-31) */
      :('<p class="small" style="margin:7px 2px 0">'+caption+'</p>'
        +(cur.length?cur.map(itemFn).join(''):'<p class="small" style="margin:10px 0 2px">'+empty+'</p>')))
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
    return '<div class="rq-item">'
      +'<div class="rq-datebar">'+fdate(dd.checkIn)+' → '+fdate(dd.checkOut)+' <span class="nightsb">'+dd.nights+'박</span><span class="rq-idx">호텔 '+(i+1)+'</span></div>'
      +'<div class="rq-body">'
      +(row.region&&row.region!=='전체'?'<div class="rq-region">'+escT(dRegion(row.region))+'</div>':'')
      +'<div class="qc-rowline" style="align-items:center;margin-top:0"><span class="rq-line"><span class="rq-hotel">'+escT(dHotel(row.hotel)||'-')+'</span><span class="rq-type">'+escT(dRoom(row.roomType)||'-')+' <span class="sm">· '+row.rooms+'실</span></span></span>'
      +'<span class="avbig av-'+av.k+'" style="margin-top:0">'+av.t+'</span></div>'
      +(row.note?'<div class="rq-note">📝 '+escT(row.note)+'</div>':'')
      +(opts?'<div>'+opts+'</div>':'')+dl+'</div></div>';}).join('');
  return '<div class="quotecard '+(answered?'rescard':'reqcard')+'" id="rescard'+req.id+'"><div class="qc-title">The Nirvana · 룸체크 '+(answered?'결과':'요청')+'</div>'
    +'<div class="qc-sub" style="text-align:left;margin-top:3px">'+escT(reqNo(req))
      +(answered
        ?' · 담당 '+escT(nickOf(req.manager)||'-')+'<br>확인일 '+dotDateTime(req.answeredAt||req.createdAt) /* 2026-08-01: 최종 답변자 닉네임 + 확인일 줄바꿈 */
        :' · '+escT(nickOf(req.agent)||'-')+(req.agentManager?' · '+escT(req.agentManager):(req.registrant?' · '+escT(nickOf(req.registrant)):''))+' · 요청일 '+dotDateTime(req.createdAt))+'</div>' /* 2026-07-31: 에이전시 · 담당자 · 요청일 형식 */
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
/* ===== 견적서 샘플 (2026-07-31): 요청자 전체 공유, 투어 종류·로케이션 검색 ===== */
let SAMPLES=null,SMP_F={type:'',loc:'',q:''};
const SMP_TYPES=['허니문','골프','가족','커플','일반'];
const SMP_LOCS=['카오락','푸켓','파타야','크라비','방콕','기타'];
async function fetchSamples(){
  try{const r=await fetch('api/quote-samples',{cache:'no-store'});
    SAMPLES=r.ok?(((await r.json()).samples)||[]):[];
  }catch(e){SAMPLES=[];}
  if((ui.listTab||'')==='smp')renderApp();
}
function smpReq(s){const p=s._p;if(!p)return null;
  return {id:'smp'+s.id,no:0,mode:p.mode||'multi',startDate:p.startDate||todayISO(),sharedNights:p.sharedNights||1,
    rows:p.rows||[],notes:p.notes||'',quote:p.quote||{rate:40,pax:2,addl:[],override:null},status:'requested',ws:{},createdAt:Number(s.created_at)||0};}
function smpPreviewHTML(s){const rq=smpReq(s);if(!rq)return '';FORCE_KO=true;let h='';try{h=quoteCardHTML(rq);}catch(e){h='';}finally{FORCE_KO=false;}return h;}
function samplesHTML(){
  if(SAMPLES===null){fetchSamples();return '<p class="small" style="margin:10px 0 2px">샘플을 불러오는 중…</p>';}
  const f=SMP_F,nq=String(f.q||'').toLowerCase();
  const list=SAMPLES.filter(s=>(!f.type||s.tour_type===f.type)&&(!f.loc||s.location===f.loc)
    &&(!nq||String(s.name||'').toLowerCase().includes(nq)||String(s.hotels||'').toLowerCase().includes(nq)));
  const head='<div style="display:flex;gap:6px;margin:8px 0;flex-wrap:wrap">'
    +'<input id="smpQ" placeholder="🔍 샘플·호텔 검색 (Enter)" value="'+esc(f.q)+'" style="flex:1;min-width:150px">'
    +'<select id="smpFT" style="width:auto">'+['',...SMP_TYPES].map(x=>'<option value="'+esc(x)+'"'+(f.type===x?' selected':'')+'>'+(x||'종류 전체')+'</option>').join('')+'</select>'
    +'<select id="smpFL" style="width:auto">'+['',...SMP_LOCS].map(x=>'<option value="'+esc(x)+'"'+(f.loc===x?' selected':'')+'>'+(x||'지역 전체')+'</option>').join('')+'</select></div>';
  const cards=list.map(s=>{
    const mine=SRV.me&&(((+s.created_by)===SRV.me.id)||SRV.me.role==='admin');
    const open=ui.smpOpen===s.id;
    return '<div class="hblock" style="margin-top:8px">'
      +'<div class="flex between aic" data-smp="'+s.id+'" style="cursor:pointer">'
        +'<div><div style="font-weight:800;font-size:14px">📑 '+escT(s.name)+'</div>'
        +'<div class="small" style="margin-top:2px;color:var(--muted)">'+[s.tour_type,s.location,s.hotels].filter(Boolean).map(escT).join(' · ')+'</div>'
        +'<div class="small" style="color:var(--muted)">'+escT(s.created_name||'')+' · '+dotDateTime(Number(s.created_at))+'</div></div>'
        +'<span class="chev'+(open?' open':'')+'">▶</span></div>'
      +(open?('<div style="margin-top:8px">'+(s._p?smpPreviewHTML(s):'<p class="small">불러오는 중…</p>')+'</div>'
        +'<div class="qbtns"><button class="qcopy" data-smpload="'+s.id+'">📋 복사 만들기</button>' /* 2026-08-01: 요청리스트에 복사본 생성 */
        +(s._p?'<button class="qimg" data-smpimg="'+s.id+'">🖼 이미지 저장</button>':'')
        +(mine?'<button class="qgray" data-smpdel="'+s.id+'">🗑 삭제</button>':'')+'</div>'):'')
      +'</div>';}).join('');
  return head+(list.length?cards:'<p class="small" style="margin:10px 0 2px">저장된 샘플이 없습니다.</p>');
}
/* 복사 만들기 (2026-08-01): 샘플을 요청리스트에 복사본으로 바로 생성 — 출처(샘플) 표시 포함 */
function copySampleToList(s){
  const p=s._p;if(!p){toast('샘플 내용을 불러오는 중입니다 — 잠시 후 다시 눌러주세요');return;}
  DB.seqA=(DB.seqA||0)+1;
  const req={id:Date.now(),no:DB.seqA,createdAt:Date.now(),status:'requested',direct:false,
    quoteRequested:false,quoteOnly:false,quoteSent:false,answeredAt:null,
    registrant:(ui.role==='sreq'?(meNick()||meName()||''):''),agentManager:'',
    mode:p.mode||'multi',startDate:p.startDate||todayISO(),sharedNights:p.sharedNights||1,
    agent:'',manager:'',notes:p.notes||'',
    rows:(p.rows||[]).map((row,i)=>({id:Date.now()+i,region:row.region||'전체',hotel:row.hotel||'',roomType:row.roomType||'',
      rooms:row.rooms||1,nights:row.nights||1,note:row.note||'',options:JSON.parse(JSON.stringify(row.options||[]))})),
    ws:{},quote:p.quote?JSON.parse(JSON.stringify(p.quote)):{rate:40,pax:2,addl:[],override:null},
    fromSample:{id:s.id,name:s.name||''}};
  if(!req.rows.length){toast('샘플에 호텔 정보가 없습니다');return;}
  upsert(req);
  ui.listTab='act';ui.sel=req.id;ui.ssel=req.id;ui.smpOpen=null;ui.qbOpen=null;
  renderApp();window.scrollTo({top:0,behavior:'smooth'});
  toast('샘플 복사본을 요청리스트에 만들었습니다 · '+reqNo(req));
}
function loadSampleToDraft(s){
  const p=s._p;if(!p){toast('샘플 내용을 불러오는 중입니다 — 잠시 후 다시 눌러주세요');return;}
  draft=newDraft();
  draft.mode=p.mode||'multi';
  draft.sharedNights=p.sharedNights||1;
  draft.rows=(p.rows||[]).map((row,i)=>({id:Date.now()+i,region:row.region||'전체',hotel:row.hotel||'',roomType:row.roomType||'',
    rooms:row.rooms||1,nights:row.nights||1,note:row.note||'',options:JSON.parse(JSON.stringify(row.options||[]))}));
  if(!draft.rows.length)draft.rows=[{id:Date.now(),region:'전체',hotel:'',roomType:'',rooms:1,nights:1,note:'',options:[]}];
  draft.notes=p.notes||'';
  draft._quote=p.quote?JSON.parse(JSON.stringify(p.quote)):null;
  if(ui.role==='sreq'&&meNick())draft.registrant=meNick();
  ui.listTab='act';ui.sel=null;ui.ssel=null;
  renderApp();window.scrollTo({top:0,behavior:'smooth'});
  toast('샘플을 불러왔습니다 — 날짜를 선택하고 등록하세요');
}
function openSampleSave(req){
  let ov=document.getElementById('smpOv');if(ov)ov.remove();
  ov=document.createElement('div');ov.id='smpOv';
  ov.style.cssText='position:fixed;inset:0;background:rgba(15,23,42,.45);z-index:120;display:flex;align-items:center;justify-content:center;padding:16px';
  const defName=(req.rows||[]).map(r=>r.hotel).filter(Boolean).slice(0,2).join(' · ')||'견적서 샘플';
  const defLoc=(((req.rows||[])[0]||{}).region);
  ov.innerHTML='<div style="background:#fff;border-radius:14px;max-width:420px;width:100%;padding:18px 16px;box-shadow:0 20px 50px rgba(0,0,0,.25)">'
    +'<h3 style="margin:0 0 10px;font-size:15px;font-weight:800">💾 견적서 샘플로 저장</h3>'
    +'<div class="label">샘플 이름</div><input id="smpName" value="'+esc(defName)+'" style="width:100%">'
    +'<div class="label" style="margin-top:10px">투어 종류</div><select id="smpType" style="width:100%">'+SMP_TYPES.map(t=>'<option>'+t+'</option>').join('')+'<option value="__c">직접 입력…</option></select>'
    +'<input id="smpTypeC" placeholder="투어 종류 입력" style="width:100%;margin-top:6px;display:none">'
    +'<div class="label" style="margin-top:10px">로케이션</div><select id="smpLoc" style="width:100%">'+SMP_LOCS.map(l=>'<option'+(l===defLoc?' selected':'')+'>'+l+'</option>').join('')+'</select>'
    +'<div style="display:flex;gap:8px;margin-top:14px"><button class="qcopy" id="smpSave" style="flex:1">저장</button><button class="qimg" id="smpCancel" style="flex:1">취소</button></div>'
    +'</div>';
  document.body.appendChild(ov);
  ov.onclick=e=>{if(e.target===ov)ov.remove();};
  const ts=ov.querySelector('#smpType'),tc=ov.querySelector('#smpTypeC');
  ts.onchange=()=>{tc.style.display=ts.value==='__c'?'':'none';};
  ov.querySelector('#smpCancel').onclick=()=>ov.remove();
  ov.querySelector('#smpSave').onclick=async()=>{
    const name=ov.querySelector('#smpName').value.trim();
    if(!name){toast('샘플 이름을 입력해주세요');return;}
    const type=ts.value==='__c'?tc.value.trim():ts.value;
    const loc=ov.querySelector('#smpLoc').value;
    try{
      const hotels=(req.rows||[]).map(r=>r.hotel).filter(Boolean).join(' · ');
      const payload={mode:req.mode,startDate:req.startDate,sharedNights:req.sharedNights,rows:req.rows,notes:req.notes,quote:req.quote};
      const r=await fetch('api/quote-samples',{method:'POST',headers:{'Content-Type':'application/json'},
        body:JSON.stringify({name,tour_type:type,location:loc,hotels,payload:JSON.parse(JSON.stringify(payload))})});
      const j=await r.json();
      if(j.ok){ov.remove();SAMPLES=null;toast('견적서 샘플이 저장되었습니다');}
      else toast('저장 실패: '+(j.error||''));
    }catch(e){toast('서버에 연결할 수 없습니다');}
  };
}
/* 다른 에이전트에게 견적서 전송 (2026-07-31): 원본 유지, 복제본을 새 에이전트로 발송 */
function openSendToAgent(req){
  let ov=document.getElementById('sndOv');if(ov)ov.remove();
  ov=document.createElement('div');ov.id='sndOv';
  ov.style.cssText='position:fixed;inset:0;background:rgba(15,23,42,.45);z-index:120;display:flex;align-items:center;justify-content:center;padding:16px';
  ov.innerHTML='<div style="background:#fff;border-radius:14px;max-width:420px;width:100%;padding:18px 16px;box-shadow:0 20px 50px rgba(0,0,0,.25)">'
    +'<h3 style="margin:0 0 10px;font-size:15px;font-weight:800">➤ 다른 에이전트에게 견적서 전송</h3>'
    +'<div class="small" style="color:var(--muted);margin-bottom:8px">원본 요청('+escT(reqNo(req))+')은 그대로 두고, 복제본을 선택한 에이전트에게 발송합니다.</div>'
    +'<div class="label">에이전트 선택</div><div style="position:relative"><input id="sndAgent" autocomplete="off" placeholder="에이전트 검색" style="width:100%"></div>'
    +'<div style="display:flex;gap:8px;margin-top:14px"><button class="qcopy" id="sndGo" style="flex:1">전송</button><button class="qimg" id="sndCancel" style="flex:1">취소</button></div></div>';
  document.body.appendChild(ov);
  ov.onclick=e=>{if(e.target===ov)ov.remove();};
  const inp=ov.querySelector('#sndAgent');
  attachAC(inp,()=>AGENTS.map(a=>({label:a.name,s:[a.name,a.nickname||'']})),label=>{inp.value=label;});
  ov.querySelector('#sndCancel').onclick=()=>ov.remove();
  ov.querySelector('#sndGo').onclick=()=>{
    const name=inp.value.trim();
    if(!name){toast('에이전트를 선택해주세요');return;}
    const copy=JSON.parse(JSON.stringify(req));
    copy.id=Date.now();
    DB.seqA=(DB.seqA||0)+1;copy.no=DB.seqA;
    copy.direct=false;
    copy.agent=name;copy.agentManager='';
    copy.quoteSent=true;copy.quoteRequested=false;copy.quoteSentAt=Date.now();
    copy.quoteBy=copy.quoteBy||DB.checker||((SRV.me&&(SRV.me.nickname||SRV.me.name))||'');
    copy.createdAt=Date.now();
    DB.requests.unshift(copy);saveDB();if(typeof srvSchedule==='function')srvSchedule();
    ov.remove();renderApp();toast('견적서를 "'+name+'" 에이전트에게 전송했습니다');
  };
}
function bindCommonList(){
  document.querySelectorAll('#listTab button').forEach(b=>b.onclick=()=>{ui.listTab=b.dataset.t;ui.sel=null;ui.ssel=null;renderApp();});
  /* 견적서 샘플 탭 바인딩 (2026-07-31) */
  document.querySelectorAll('[data-smp]').forEach(el2=>{el2.onclick=async()=>{
    const id=Number(el2.dataset.smp);ui.smpOpen=ui.smpOpen===id?null:id;
    const s=(SAMPLES||[]).find(x=>x.id===id);
    if(s&&!s._p&&ui.smpOpen===id){
      renderApp();
      try{const r=await fetch('api/quote-samples/'+id,{cache:'no-store'});if(r.ok)s._p=(((await r.json()).sample)||{}).payload;}catch(e){}
    }
    renderApp();};});
  const sq=document.getElementById('smpQ');if(sq)sq.onchange=e=>{SMP_F.q=e.target.value;renderApp();};
  const sft=document.getElementById('smpFT');if(sft)sft.onchange=e=>{SMP_F.type=e.target.value;renderApp();};
  const sfl=document.getElementById('smpFL');if(sfl)sfl.onchange=e=>{SMP_F.loc=e.target.value;renderApp();};
  document.querySelectorAll('[data-smpload]').forEach(b=>b.onclick=e=>{e.stopPropagation();const s=(SAMPLES||[]).find(x=>x.id===Number(b.dataset.smpload));if(s)copySampleToList(s);}); /* 2026-08-01: 불러오기 → 복사 만들기 */
  document.querySelectorAll('[data-smpimg]').forEach(b=>b.onclick=e=>{e.stopPropagation();saveImg('qcardsmp'+b.dataset.smpimg,'견적샘플.png');});
  document.querySelectorAll('[data-smpdel]').forEach(b=>b.onclick=async e=>{e.stopPropagation();
    if(!confirm('이 샘플을 삭제할까요?'))return;
    try{const r=await fetch('api/quote-samples/'+b.dataset.smpdel,{method:'DELETE'});const j=await r.json();
      if(j.ok){SAMPLES=(SAMPLES||[]).filter(x=>x.id!==Number(b.dataset.smpdel));toast('삭제되었습니다');renderApp();}
      else toast('삭제 실패: '+(j.error||''));}catch(e){toast('서버에 연결할 수 없습니다');}});
  const rt=document.getElementById('ruleTog');if(rt)rt.onclick=()=>{ui.ruleOpen=!ui.ruleOpen;renderApp();};
  document.querySelectorAll('[data-contract]').forEach(b=>b.onclick=()=>{const r=byId(Number(b.dataset.contract));if(!r)return;
    if(r.contractedAt){r.contractedAt=null;toast(T('t_contract_x'));}
    else{r.contractedAt=Date.now();toast(T('t_contract')+reqNo(r));}
    saveDB();renderApp();});
  document.querySelectorAll('[data-topast]').forEach(b=>b.onclick=()=>{const r=byId(Number(b.dataset.topast));if(!r)return;
    r.archivedAt=Date.now();ui.sel=null;ui.ssel=null;saveDB();renderApp();toast(T('t_topast')+reqNo(r));});
  document.querySelectorAll('[data-recheck]').forEach(b=>b.onclick=()=>{const r=byId(Number(b.dataset.recheck));if(!r)return;
    draft=draftFromReq(r);ui.sel=null;ui.ssel=null;ui.qbOpen=null;renderApp();
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
      if(s)s.onclick=()=>{r.quoteSent=true;r.quoteRequested=false;r.quoteSentAt=Date.now();r.quoteBy=r.registrant||'심은선';saveDB();renderApp();toast(T('t_quote_sent')+reqNo(r));};
      const st2=document.getElementById('qbSendTo');
      if(st2)st2.onclick=()=>openSendToAgent(r); /* 다른 에이전트에게 복제 전송 (2026-07-31) */}
  }
  document.querySelectorAll('[data-sel]').forEach(el=>el.onclick=()=>{const id=Number(el.dataset.sel);ui.sel=ui.sel===id?null:id;renderApp();});
  document.querySelectorAll('[data-askquote]').forEach(b=>b.onclick=()=>{const r=byId(Number(b.dataset.askquote));if(r){r.quoteRequested=true;saveDB();renderApp();toast(T('t_askq'));}});
  document.querySelectorAll('[data-qtext]').forEach(b=>b.onclick=()=>{const r=byId(Number(b.dataset.qtext));if(r)copyText(quoteText(r),T('t_qcopied'));});
  document.querySelectorAll('[data-qimg]').forEach(b=>b.onclick=()=>{saveImg('qcard'+b.dataset.qimg,'견적.png');});
}
/* html2canvas 로더 (2026-08-01 강화): 내장 파일 → cdnjs → jsdelivr → unpkg 순서로 시도 */
function ensureH2C(){return new Promise(res=>{
  if(typeof html2canvas!=='undefined')return res(true);
  const srcs=['vendor/html2canvas.min.js?v=20260801',
    'https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js',
    'https://cdn.jsdelivr.net/npm/html2canvas@1.4.1/dist/html2canvas.min.js',
    'https://unpkg.com/html2canvas@1.4.1/dist/html2canvas.min.js'];
  let i=0;
  const tryNext=()=>{
    if(typeof html2canvas!=='undefined')return res(true);
    if(i>=srcs.length)return res(false);
    const s=document.createElement('script');s.src=srcs[i++];
    s.onload=()=>{(typeof html2canvas!=='undefined')?res(true):tryNext();};
    s.onerror=()=>tryNext();
    document.head.appendChild(s);};
  tryNext();
});}
/* 캔버스 다운로드 (2026-08-01): toBlob 우선(대용량 이미지 안정), 실패 시 dataURL 예비 */
function dlCanvas(cv,name){
  const viaData=()=>{const a=document.createElement('a');a.download=name;a.href=cv.toDataURL('image/png');document.body.appendChild(a);a.click();a.remove();toast(T('t_img_saved'));};
  try{
    if(cv.toBlob){cv.toBlob(b=>{
      if(!b){viaData();return;}
      const u=URL.createObjectURL(b),a=document.createElement('a');
      a.download=name;a.href=u;document.body.appendChild(a);a.click();a.remove();
      setTimeout(()=>URL.revokeObjectURL(u),5000);toast(T('t_img_saved'));
    },'image/png');}
    else viaData();
  }catch(e){viaData();}
}
async function saveImg(id,name){const node=document.getElementById(id);
  if(!node)return;
  if(!await ensureH2C()){toast(T('t_img_need_net'));return;}
  html2canvas(node,{scale:2,backgroundColor:'#ffffff'}).then(cv=>dlCanvas(cv,name)).catch(()=>{toast(T('t_img_fail'));});}
async function saveFullImg(req){
  if(!await ensureH2C()){toast(T('t_img_need_net'));return;}
  FORCE_KO=true;let html='';
  try{html=resultCardHTML(req)+(req.quoteSent||ui.qOpen||ui.qbOpen?quoteCardHTML(req):'');}
  catch(e){html='';}
  finally{FORCE_KO=false;}
  if(!html){toast(T('t_img_fail'));return;} /* 2026-08-01: 렌더 실패 시 무반응 대신 안내 */
  const tmp=document.createElement('div');
  tmp.style.cssText='position:fixed;left:-10000px;top:0;width:370px;background:#fff;padding:8px';
  tmp.innerHTML=html;
  tmp.querySelectorAll('[id]').forEach(n=>n.removeAttribute('id'));
  document.body.appendChild(tmp);
  html2canvas(tmp,{scale:2,backgroundColor:'#ffffff'})
    .then(cv=>{dlCanvas(cv,'룸체크견적_'+reqNo(req)+'.png');tmp.remove();})
    .catch(()=>{tmp.remove();toast(T('t_img_fail'));});
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
      +(row.savedAt?'<span class="small" style="color:var(--muted);flex:0 0 auto">'+T('save_w')+' '+(row.confirmedBy?escT(nickOf(row.confirmedBy))+' · ':'')+dotDateTime(row.savedAt)+'</span>':'')+'</div>' /* 2026-08-01: 저장 옆에 룸첵 확인자 이름 */
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
    return '<div class="wscard">'+head+detail+'</div>';
  }).join('');
  const legend='<div class="legend">'
    +'<span class="small"><b style="color:var(--av)">AV</b> '+T('lg_av')+'</span>'
    +'<span class="small"><b style="color:var(--rq)">RQ</b> '+T('lg_rq')+'</span>'
    +'<span class="small"><b style="color:var(--so)">S/O</b> '+T('lg_so')+'</span></div>';
  return '<div class="flex between aic" style="margin:2px 0 6px"><h3 style="margin:0;font-size:15.5px;font-weight:800">'+T('ws_title')+'</h3><span class="mono small">'+reqNo(req)+'</span></div>'
    /* 2026-08-01: 접수=등록 당사자(에이전트, 담당자 닉네임 또는 직원 닉네임)+시간 / 답변=최종 처리자 닉네임+시간만 */
    +'<div class="metaline" style="color:#1E63C8;font-weight:600">'+T('recv_w')+' '+escT(nickOf(req.registrant)||[nickOf(req.agent)||'',req.agentManager?(nickOf(req.agentManager)||''):''].filter(Boolean).join(', ')||T('no_input'))+' · '+dotDateTime(req.createdAt)+'</div>'+(req.answeredAt?'<div class="metaline" style="color:var(--av);font-weight:600">'+T('ans_w')+' '+escT(nickOf(req.manager))+' · '+dotDateTime(req.answeredAt)+'</div>':'')+(req.quoteRequested&&!req.quoteSent?'<div class="metaline" style="color:var(--so)">💬 '+T('b_qreq_staff')+'</div>':'')
    +(req.notes?'<div class="reqbox">📝 '+T('extra_req')+': '+escT(req.notes)+'</div>':'')
    +'<div style="margin-top:10px">'+cards+'</div>'+legend
    +'<p class="foot">'+T('ws_foot')+'</p>'
    +(ui.role==='schk'
      ? (req.quoteRequested&&!req.quoteSent?'<p class="small" style="margin:8px 2px 2px">'+T('ws_qreq_note')+'</p>':'')
        +(req.rows.length>1&&!allDone(req)?'<p class="small" style="margin:8px 2px 2px;color:var(--so)">'+TF('ws_partial_warn',{n:req.rows.length-doneCount(req)})+'</p>':'')
        +'<div class="qbtns"><button class="qcopy" id="sendA">'+(req.rows.length>1&&!allDone(req)&&doneCount(req)>0
          ?TF('btn_send_partial',{n:doneCount(req),t:req.rows.length})
          :(req.status==='requested'?T('btn_send_ans'):T('btn_send_upd')))+'</button></div>'
      : (((req.direct&&req.status==='answered')?'<div class="qbtns"><button class="'+(req.forwardedAt?'qgray':'qcopy')+'" id="fwdAgent">'+(req.forwardedAt?'✅ 에이전트에 전송됨':'📤 에이전트에게 전송')+'</button></div>'+(req.forwardedAt?'<p class="small" style="margin:4px 2px;color:var(--muted)">전송 '+dotDateTime(req.forwardedAt)+'</p>':'<p class="small" style="margin:4px 2px;color:var(--rq)">확인 후 에이전트에게 전송하면 에이전트가 결과를 볼 수 있습니다.</p>'):''))+'<div style="border-top:1px solid var(--line);margin-top:6px;padding-top:6px"><button class="linkbtn" id="qTog">'+(ui.qOpen?T('mkq_close'):T('mkq'))+'</button>'
        +(ui.qOpen?quoteBuilderHTML(req):'')+'</div>'
        +'<div class="qbtns"><button class="qcopy" id="sendA">'+(req.status==='requested'?T('btn_send_ans'):T('btn_send_upd'))+'</button><button class="qimg" id="sendQ">'+T('btn_sendq')+'</button></div>'
        +'<div class="qbtns"><button class="qgray" data-recheck="'+req.id+'">'+T('btn_recheck')+'</button>'
        +(req.contractedAt
          ?'<button class="qgray" data-contract="'+req.id+'">'+T('btn_contract_x')+'</button>'
          :'<button class="qcopy" data-contract="'+req.id+'">'+T('btn_contract')+'</button>')+'</div>'
        +(!req.archivedAt&&!req.contractedAt?'<div class="qbtns"><button class="qgray" data-topast="'+req.id+'">'+T('btn_topast')+'</button></div>':''));
}
function stSel(cls,val,attrs,mixed){let o=STOPT.map(([v,t])=>opt(v,t,val===v)).join('');
  if(mixed)o='<option value="__mix" selected>'+T('ws_mixed')+'</option>'+o;
  return '<select class="'+cls+' '+(STCLS[val]||'')+'" '+attrs+'>'+o+'</select>';}
function buildWsFromDOM(req){try{req.ws=req.ws||{};var dbg={na:0,np:0,sv:[],pv:[],wb:Object.keys(req.ws||{}).length};document.querySelectorAll('select.stsel[data-all]').forEach(function(sel){dbg.na++;dbg.sv.push(sel.dataset.all+'#'+sel.value);var v=sel.value;if(!v||v==='__mix')return;var rid=sel.dataset.all;var row=(req.rows||[]).find(function(r){return String(r.id)===String(rid)});if(!row)return;var idx=req.rows.indexOf(row);rDates(req,row,idx).dates.forEach(function(iso){var k=rid+'|'+iso;req.ws[k]=req.ws[k]||{};req.ws[k].status=v;});});document.querySelectorAll('select.stsel[data-key]').forEach(function(sel){var v=sel.value;if(!v||v==='__mix')return;var k=sel.dataset.key;req.ws[k]=req.ws[k]||{};req.ws[k].status=v;});document.querySelectorAll('input.pall').forEach(function(inp){dbg.np++;dbg.pv.push(inp.dataset.all+'#'+inp.value);var v=inp.value;if(v===''||v==null)return;var rid=inp.dataset.all;var row=(req.rows||[]).find(function(r){return String(r.id)===String(rid)});if(!row)return;var idx=req.rows.indexOf(row);rDates(req,row,idx).dates.forEach(function(iso){var k=rid+'|'+iso;req.ws[k]=req.ws[k]||{};req.ws[k].price=v;});});document.querySelectorAll('input.pone').forEach(function(inp){var v=inp.value;if(v===''||v==null)return;var k=inp.dataset.key;req.ws[k]=req.ws[k]||{};req.ws[k].price=v;});dbg.wa=Object.keys(req.ws||{}).length;dbg.dup=(typeof DB!=='undefined'&&DB.requests?DB.requests.filter(function(x){return x&&x.id===req.id}).length:-1);req._bwd=dbg;}catch(e){req._domerr=String(e);}}
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
  if(ui.qOpen)bindQuoteBuilder(req);
  const sa=document.getElementById('sendA');if(sa)sa.onclick=()=>{buildWsFromDOM(req);req.status='answered';req.answeredAt=Date.now();req.manager=DB.checker||'심은선';req.answerComplete=allDone(req);recordFullbook(req);saveDB();renderApp();
    toast(isFullbookReq(req)?T('t_fullbook')+reqNo(req)
      :(!allDone(req)?TF('t_partial',{n:doneCount(req),t:req.rows.length})+reqNo(req)
      :T('t_answered')+reqNo(req)));};
  const fa=document.getElementById('fwdAgent');if(fa)fa.onclick=()=>{req.forwardedAt=Date.now();saveDB();renderApp();toast('에이전트에 전송 · '+reqNo(req));};
  const sq=document.getElementById('sendQ');if(sq)sq.onclick=()=>{buildWsFromDOM(req);req.status='answered';req.answeredAt=Date.now();req.manager=DB.checker||'심은선';req.answerComplete=allDone(req);req.quoteSent=true;req.quoteRequested=false;req.quoteSentAt=Date.now();req.quoteBy=DB.checker||'심은선';recordFullbook(req);saveDB();renderApp();toast(T('t_qsent')+reqNo(req));};
}

/* ================= ④ 간단 견적 ================= */
function hotelTHB(req,row,i){let t=0;rDates(req,row,i).dates.forEach(iso=>{const c=(req.ws||{})[row.id+'|'+iso]||{};t+=(Number(c.price)||0)*Number(row.rooms);});return t;}
function hotelOptsList(req){const l=[];req.rows.forEach(r=>(r.options||[]).forEach(o=>l.push({rid:r.id,hotel:r.hotel,o})));return l;}
function quoteCalc(req){
  const q=req.quote,rate=Number(q.rate)||0,pax=Math.max(1,Number(q.pax)||1);
  const perHotel=req.rows.map((r,i)=>({row:r,name:r.hotel||'-',thb:hotelTHB(req,r,i),showRate:!!r.showRate}));
  const hTHB=perHotel.reduce((a,x)=>a+x.thb,0);
  const optTHB=hotelOptsList(req).reduce((a,{o})=>a+lineTHB(o),0);
  const baseTHB=hTHB+optTHB;
  const addlKRW=q.addl.reduce((a,x)=>a+(x.cur==='krw'?lineTHB(x):lineTHB(x)*rate),0);
  const totalKRW=baseTHB*rate+addlKRW,per=totalKRW/pax;
  const perMan=q.override!=null?Number(q.override):per/10000;
  return {rate,pax,perHotel,hTHB,optTHB,baseTHB,addlKRW,totalKRW,per,perMan,totalMan:perMan*pax};}
function quoteText(req){
  const c=quoteCalc(req);
  const optLine=o=>o.memo?o.memo:o.name;
  let t='The Nirvana · 여행 견적\n'
    +'요청 : '+(req.agent||'-')+(req.agentManager?'-'+req.agentManager:'')+' · '+kdotDateTime(req.createdAt)+'\n'
    +'발행 : '+(req.quoteBy||DB.checker||req.registrant||'심은선')+' · '+kdotDateTime(req.quoteSentAt||Date.now())+'\n'; /* 2026-08-01: 요청/발행 각 한 줄 표시 */
  req.rows.forEach((row,i)=>{const dd=rDates(req,row,i);
    const sh=(row.options||[]).filter(o=>o.show&&o.name);
    t+='\n'+(i+1)+') '+kdstr(dd.checkIn)+' → '+kdstr(dd.checkOut)+' ('+dd.nights+'박)\n';
    if(row.region&&row.region!=='전체')t+=dRegion(row.region)+'\n';
    t+=(dHotel(row.hotel)||'-')+(req.status==='answered'?' → '+avKo(availOf(req,row,i)):'')+'\n'+(dRoom(row.roomType)||'-')+' · '+row.rooms+'실\n';
    sh.forEach(o=>{t+=optLine(o)+'\n';});
    if(row.showRate)t+='   호텔 요금 ₩'+won(hotelTHB(req,row,i)*c.rate)+'\n';});
  req.quote.addl.filter(x=>x.show&&(x.memo||x.desc)).forEach(x=>{t+='· '+(x.memo||x.desc)+'\n';});
  if(req.quote.remark)t+='\n※ '+req.quote.remark+'\n';
  t+='\n견적금액 · 1인 '+manwonF(c.perMan)+'\n'+c.pax+'인 기준 '+manwonF(c.totalMan);
  return t;}
function quoteCardHTML(req){
  const c=quoteCalc(req),q=req.quote;
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
      +(row.showRate?'<div class="qc-price">호텔 요금 ₩'+won(hotelTHB(req,row,i)*c.rate)+'</div>':'')
      +'</div>';}).join('');
  const incLines=q.addl.filter(x=>x.show&&(x.memo||x.desc)).map(x=>'<div style="margin-top:2px"><span class="qc-addl-txt">'+escT(x.memo||x.desc)+'</span></div>').join('');
  const qBy=req.quoteBy||DB.checker||req.registrant||'심은선';
  const qAt=req.quoteSentAt||Date.now();
  return '<div class="quotecard" id="qcard'+req.id+'"><div class="qc-title" style="font-size:17px;letter-spacing:.6px">The Nirvana · 여행 견적</div>'
    +'<div class="qc-sub" style="text-align:left;margin-top:8px;color:var(--sub);font-weight:700">요청 : '+escT((req.agent||'-')+(req.agentManager?'-'+req.agentManager:''))+' · <span style="font-weight:400">'+kdotDateTime(req.createdAt)+'</span></div>' /* 2026-08-01: 한 줄 표시 */
    +'<div class="qc-sub" style="text-align:left;margin-top:2px;color:var(--sub);font-weight:700">발행 : '+escT(qBy)+' · <span style="font-weight:400">'+kdotDateTime(qAt)+'</span></div>'
    +legs+(incLines?'<div class="qc-leg qc-addl">'+incLines+'</div>':'')
    +(q.remark?'<div class="qc-remark">※ '+escT(q.remark).replace(/\n/g,'<br>')+'</div>':'')
    +'<hr class="qc-sep"><div class="qc-final"><span class="lbl">견적금액 · 1인</span><span class="amt">'+manwonF(c.perMan)+'</span></div>'
    +'<div class="qc-sub">'+c.pax+'인 기준 '+manwonF(c.totalMan)+'</div></div>';
}
function quoteBuilderHTML(req){
  const c=quoteCalc(req),q=req.quote;
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
  return '<div style="margin-top:4px">'
    +'<div class="line l2" style="margin-top:0">'
      +'<div><div class="label">'+T('qb_rate')+'</div><input type="number" id="qRate" value="'+q.rate+'"></div>'
      +'<div><div class="label">'+T('qb_pax')+'</div><input type="number" id="qPax" min="1" value="'+q.pax+'"></div></div>'
    +'<div style="margin-top:12px;border-top:1px solid var(--line);padding-top:8px"><div class="label" style="margin-bottom:2px">'+T('qb_hsum')+'</div>'+hotelRows
      +'<div class="brow" style="border-top:1px solid var(--line);font-weight:800"><span>'+T('qb_htotal')+'</span><span class="mono">฿'+won(c.hTHB)+'</span></div></div>'
    +'<div style="margin-top:12px"><div class="label">'+T('ws_opt_label')+'</div>'+hoptRows+'</div>'
    +'<div style="margin-top:8px"><div class="label">'+T('qb_addl')+'</div>'+adRows+'<button id="adAdd" class="addbtn sm">'+T('qb_addl_btn')+'</button></div>'
    +'<div style="margin-top:10px;border-top:1px solid var(--line);padding-top:8px">'
      +'<div class="brow"><span>'+T('qb_htotal')+'</span><span class="mono">฿'+won(c.hTHB)+'</span></div>'
      +'<div class="brow"><span>'+T('qb_optsum')+'</span><span class="mono">฿'+won(c.optTHB)+'</span></div>'
      +'<div class="brow"><span>'+T('qb_sub_rate')+' '+won(c.rate)+'</span><span class="mono">฿'+won(c.baseTHB)+' → ₩'+won(c.baseTHB*c.rate)+'</span></div>'
      +'<div class="brow"><span>'+T('qb_addl_sum')+'</span><span class="mono">₩'+won(c.addlKRW)+'</span></div>'
      +'<div class="brow tot" style="color:var(--brand)"><span>'+T('qb_krw_total')+' ('+c.pax+T('ppl')+')</span><span class="mono">₩'+won(c.totalKRW)+'</span></div>'
      +'<div class="brow" style="color:var(--muted)"><span>'+T('qb_auto1')+'</span><span class="mono">₩'+won(c.per)+' · '+manwonF(c.per/10000)+'</span></div></div>'
    +'<div style="margin-top:10px;border:1px solid var(--brand);border-radius:10px;padding:10px 12px;background:var(--avBg)">'
      +'<div class="label" style="color:var(--brand)">'+T('qb_final')+'</div>'
      +'<div class="flex aic" style="gap:8px"><input type="number" step="0.1" id="ovr" value="'+ovrVal+'" style="flex:1;text-align:right;font-weight:800;font-size:16px"><span style="font-weight:700">'+T('qb_man')+'</span>'
      +'<button id="ovrReset" class="curbtn" style="width:auto;padding:8px 12px">'+T('qb_auto')+'</button></div></div>'
    +'<div style="margin-top:12px"><div class="label">'+T('qb_remark')+'</div>'
      +'<textarea id="qRemark" placeholder="'+esc(T('qb_remark_ph'))+'">'+escT(q.remark||'')+'</textarea></div>'
    +'<div class="label" style="margin-top:12px">'+T('qb_preview')+'</div>'+quoteCardHTML(req)
    +'<div class="qbtns"><button class="qcopy" id="qbDraft">'+T('qb_draft')+'</button><button class="qimg" id="qbImg">'+T('btn_qimg')+'</button><button class="qimg" id="qbSample">💾 '+T('btn_sample')+'</button></div>' /* 2026-08-01: 텍스트 복사 → 임시저장 (발행 없이 저장) */
    +'<div class="qbtns"><button class="qmgr" id="fullImg">'+T('btn_fullimg')+'</button><button class="qmgr" id="fullUrl">'+T('btn_fullurl')+'</button></div>'
    +'<p class="foot">'+T('qb_foot')+'</p>'
    +'</div>';
}
function bindQuoteBuilder(req){
  const el=id=>document.getElementById(id);
  el('qRate').onchange=e=>{req.quote.rate=Number(e.target.value)||0;saveDB();renderApp();};
  el('qPax').onchange=e=>{req.quote.pax=Math.max(1,Number(e.target.value)||1);saveDB();renderApp();};
  el('ovr').onchange=e=>{req.quote.override=Number(e.target.value)||0;saveDB();renderApp();};
  el('ovrReset').onclick=()=>{req.quote.override=null;saveDB();renderApp();};
  el('adAdd').onclick=()=>{req.quote.addl.push({id:Date.now(),desc:'',amt:0,qty:1,cur:'thb',show:true,memo:''});saveDB();renderApp();};
  document.querySelectorAll('.optitem[data-hoid]').forEach(rowEl=>{const rid=Number(rowEl.dataset.hrid),oid=Number(rowEl.dataset.hoid);
    const r=req.rows.find(x=>x.id===rid),o=r&&(r.options||[]).find(x=>x.id===oid);if(!o)return;
    rowEl.querySelector('.hoptAmt').onchange=e=>{o.amt=Number(e.target.value)||0;saveDB();renderApp();};
    rowEl.querySelector('.hoptQty').onchange=e=>{o.qty=Math.max(1,Number(e.target.value)||1);saveDB();renderApp();};
    rowEl.querySelector('.hoptShow').onclick=()=>{o.show=!o.show;saveDB();renderApp();};
    rowEl.querySelector('.hoptMemo').oninput=e=>{o.memo=e.target.value;saveDB();};});
  document.querySelectorAll('.optitem[data-aid]').forEach(rowEl=>{const id=Number(rowEl.dataset.aid),it=req.quote.addl.find(x=>x.id===id);
    rowEl.querySelector('.adDesc').oninput=e=>{it.desc=e.target.value;saveDB();};
    rowEl.querySelector('.adAmt').onchange=e=>{it.amt=Number(e.target.value)||0;saveDB();renderApp();};
    rowEl.querySelector('.adQty').onchange=e=>{it.qty=Math.max(1,Number(e.target.value)||1);saveDB();renderApp();};
    rowEl.querySelector('.adCur').onchange=e=>{it.cur=e.target.value;saveDB();renderApp();};
    rowEl.querySelector('.adShow').onclick=()=>{it.show=!it.show;saveDB();renderApp();};
    rowEl.querySelector('.adMemo').oninput=e=>{it.memo=e.target.value;saveDB();};
    rowEl.querySelector('.adDel').onclick=()=>{req.quote.addl=req.quote.addl.filter(x=>x.id!==id);saveDB();renderApp();};});
  const qr=el('qRemark');if(qr){qr.oninput=e=>{req.quote.remark=e.target.value;saveDB();};qr.onchange=()=>renderApp();}
  /* 임시저장 (2026-08-01): 발행(quoteSent) 없이 견적 내용만 저장하고 닫기 */
  const qd=el('qbDraft');if(qd)qd.onclick=()=>{saveDB();ui.qOpen=false;ui.qbOpen=null;renderApp();toast(T('t_qdraft'));};
  el('qbImg').onclick=()=>saveImg('qcard'+req.id,'견적.png');
  const smB=el('qbSample');if(smB)smB.onclick=()=>openSampleSave(req); /* 샘플로 저장 (2026-07-31) */
  const fi=el('fullImg');if(fi)fi.onclick=()=>saveFullImg(req);
  const fu=el('fullUrl');if(fu)fu.onclick=()=>copyText(reqURL(req),T('t_fullurl'));
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
    /* 2026-07-30: 에이전트=소속 에이전시(회사명), 담당자=본인 — 통계가 '에이전트 담당자'로 잡히도록 */
    if(ui.role==='agent'){applyAgentDefaults();if(!draft.agent)draft.agent=meNick()||DB.agentName||'';}
    if(ui.role==='sreq'&&!draft.agent)draft.agent=meNick()||DB.agentName||'';
    if(ui.role==='sreq'&&meNick())draft.registrant=meNick();
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
  setTimeout(function(){ensureH2C();},1200); /* 2026-08-01: html2canvas 미리 로드 — 이미지 저장 클릭 시 지연·실패 방지 */
})();
