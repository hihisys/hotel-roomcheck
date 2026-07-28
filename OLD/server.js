// 룸 체크 로컬 서버 (node 내장 기능만 사용)
const http=require('http'),fs=require('fs'),path=require('path');
const ROOT=__dirname,PORT=8000;
const MIME={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.png':'image/png','.jpg':'image/jpeg','.svg':'image/svg+xml','.json':'application/json','.ico':'image/x-icon'};
http.createServer((req,res)=>{
  let p=decodeURIComponent((req.url||'/').split('?')[0]);
  if(p==='/'||p==='')p='/index.html';
  const file=path.join(ROOT,path.normalize(p).replace(/^(\.\.[\/\\])+/,''));
  if(!file.startsWith(ROOT)){res.writeHead(403);res.end();return;}
  fs.readFile(file,(err,data)=>{
    if(err){res.writeHead(404,{'Content-Type':'text/plain; charset=utf-8'});res.end('404 Not Found');return;}
    res.writeHead(200,{'Content-Type':MIME[path.extname(file).toLowerCase()]||'application/octet-stream','Cache-Control':'no-cache'});
    res.end(data);
  });
}).listen(PORT,()=>console.log('서버 실행 중: http://localhost:'+PORT));
