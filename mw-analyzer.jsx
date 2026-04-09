import { useState, useRef, useCallback } from "react";

const MOCK_PLAYER = {
  username: "NavyStrike_KR", region: "ASIA", rank: "Admiral",
  rankPoints: 4820, totalBattles: 2341, winRate: 67.4, avgDamage: 148500,
  kdRatio: 3.82, survivalRate: 54.2, mvpCount: 412, favoriteShip: "USS Zumwalt",
  playtime: "1,240h", lastActive: "2시간 전", winStreak: 7, clanTag: "[KRFLT]",
  monthlyStats: [
    { month: "10월", damage: 142000 }, { month: "11월", damage: 151000 },
    { month: "12월", damage: 149000 }, { month: "1월", damage: 153000 },
    { month: "2월", damage: 158000 }, { month: "3월", damage: 162000 },
  ],
  shipStats: [
    { ship: "USS Zumwalt", class: "DD", battles: 634, wr: 71.2, avgDmg: 162000, kd: 4.1 },
    { ship: "Type 055", class: "CG", battles: 412, wr: 65.8, avgDmg: 178000, kd: 3.6 },
    { ship: "SSBN-X", class: "SS", battles: 287, wr: 68.4, avgDmg: 134000, kd: 3.9 },
    { ship: "Gerald Ford", class: "CV", battles: 198, wr: 62.1, avgDmg: 95000, kd: 2.8 },
    { ship: "Yamato Kai", class: "BB", battles: 156, wr: 58.9, avgDmg: 201000, kd: 2.4 },
  ],
  recentMatches: [
    { id:"m1", ship:"USS Zumwalt", class:"DD", result:"WIN", damage:187420, kills:4, assists:2, survived:true, map:"Pacific Storms", duration:"28:14", mvp:true, ago:"2시간 전" },
    { id:"m2", ship:"Type 055", class:"CG", result:"WIN", damage:203100, kills:3, assists:4, survived:true, map:"Arctic Conflict", duration:"31:07", mvp:false, ago:"5시간 전" },
    { id:"m3", ship:"SSBN-X", class:"SS", result:"LOSS", damage:89400, kills:1, assists:1, survived:false, map:"Coral Sea", duration:"19:42", mvp:false, ago:"8시간 전" },
    { id:"m4", ship:"USS Zumwalt", class:"DD", result:"WIN", damage:172800, kills:5, assists:1, survived:true, map:"North Atlantic", duration:"24:55", mvp:true, ago:"1일 전" },
    { id:"m5", ship:"Gerald Ford", class:"CV", result:"WIN", damage:112300, kills:2, assists:6, survived:true, map:"Pacific Storms", duration:"35:18", mvp:false, ago:"1일 전" },
    { id:"m6", ship:"Yamato Kai", class:"BB", result:"LOSS", damage:234500, kills:2, assists:0, survived:false, map:"Bering Strait", duration:"22:31", mvp:false, ago:"2일 전" },
  ]
};

const CLASS_COLORS = { DD:"#22d3ee", CG:"#a78bfa", SS:"#34d399", CV:"#fbbf24", BB:"#f87171" };
const CLASS_NAMES = { DD:"구축함", CG:"순양함", SS:"잠수함", CV:"항공모함", BB:"전함" };
const FLAW_COLORS = ["#f87171","#fbbf24","#fb923c","#a78bfa","#22d3ee"];

const FALLBACK = {
  shipClass:"DD", shipName:"USS Zumwalt", overallScore:72,
  scoreBreakdown:{ positioning:68, weaponUsage:78, consumables:62, teamplay:74, survival:70 },
  matchSummary:"적극적인 어뢰 및 미사일 운용으로 팀에 기여했으나, 중반 이후 포지셔닝이 너무 공격적이어서 불필요한 피해를 입었습니다. 기동성을 더 활용한 생존 전술이 필요합니다.",
  topFlaws:[
    { rank:1, timestamp:"18:12", title:"적 AA 교전 시 단독 미사일 발사", description:"18분 12초, 적 Type 055 순양함의 AA가 활성화된 상태에서 단독으로 미사일 4연발 발사. 2발만 히트하고 2발 격추됨. 아군과 협력해 AA를 분산시켜야 했습니다.", impact:"딜 효율 -50%, 미사일 2발 낭비", fix:"아군이 다른 방향에서 교전 중일 때 발사하거나, ECM을 먼저 사용해 AA를 마비시킨 후 발사하세요.", expectedImprovement:"미사일 명중률 +40%, 딜 효율 1.8배 향상" },
    { rank:2, timestamp:"22:30", title:"적 항공모함 탐지 구역 단독 진입", description:"22분 30초에 단독으로 너무 앞서 나가 적 Gerald Ford의 공격기 공습 구역 노출. HP 35% 손실 후 후퇴했으나 이미 결정적 피해.", impact:"생존율 -35%, 이후 전투력 대폭 감소", fix:"Destroyer는 항상 아군 CG/BB의 AA 우산 안에서 운용. 단독 돌격은 금물.", expectedImprovement:"생존율 +25%, 전투 지속시간 연장" },
    { rank:3, timestamp:"14:05", title:"Smoke를 위기 전 미리 소모", description:"14분 5초에 피해가 크지 않은 상황에서 Smoke 사용. 22분의 위기 상황에서 Smoke가 없어 회피 불가.", impact:"위기 상황 대응 수단 상실 → 격침", fix:"Smoke는 HP 40% 이하 or 집중포화 상황에서만 사용. 평소엔 기동으로 회피.", expectedImprovement:"핵심 순간 생존율 +45%" },
    { rank:4, timestamp:"07:20", title:"초반 소나 스캔 미사용으로 어뢰 피격", description:"7분 20초에 적 잠수함이 인근에 있었으나 소나를 사용하지 않아 어뢰 2발 피격.", impact:"HP -28%, 초반 전투력 감소", fix:"교전 지역 진입 전 항상 소나 스캔으로 잠수함 유무 확인하세요.", expectedImprovement:"어뢰 피격 빈도 -60%" },
    { rank:5, timestamp:"31:40", title:"아군 없이 적 BB 2척 단독 교전", description:"31분 40초에 아군이 12km 떨어진 상황에서 적 BB 2척과 단독 교전 시도 → 격침.", impact:"불필요한 격침, 팀 수적 열세 초래", fix:"아군과 3km 이내 거리를 항상 유지. Destroyer의 역할은 지원이지 단독 돌격이 아닙니다.", expectedImprovement:"팀 종합 승률 +12%" }
  ],
  bestPlays:[
    { rank:1, timestamp:"09:33", title:"아군 SS와 협력한 적 CV 격침", description:"9분 33초에 아군 SSBN-X와 타이밍 맞춰 적 Gerald Ford에 어뢰 + ASHM 동시 발사. 총 147,000 데미지로 격침 성공.", whyGood:"AA가 두 방향으로 분산되어 명중률 극대화. 팀 전투에서 가장 이상적인 협력 공격 예시." },
    { rank:2, timestamp:"16:48", title:"Smoke+ECM 콤보로 미사일 8발 전량 회피", description:"16분 48초에 적 Cruiser의 8발 미사일 발사 직후 Smoke + ECM을 동시 사용하여 전량 회피.", whyGood:"소모품 타이밍이 완벽. 미사일 발사 확인 직후 0.5초 내 반응 – 프로급 대응입니다." },
    { rank:3, timestamp:"24:15", title:"어뢰 선행 조준으로 적 DD 격침", description:"24분 15초에 적 DD의 이동 경로를 예측해 어뢰 선행 발사. 3발 전탄 명중 + 격침. 62,000 데미지.", whyGood:"어뢰는 직선 조준이 아닌 예측 조준이 핵심. 적의 기동 패턴을 읽은 훌륭한 샷입니다." }
  ],
  consumableAnalysis:"Smoke 사용 2/3회 – 한 번은 낭비. ECM은 타이밍이 완벽했으나 전체 사용 횟수가 적음. Repair는 HP 20% 이하에서만 사용 – HP 50% 이하에서 선제 사용 권장.",
  positioningAnalysis:"전반부 포지셔닝 훌륭. 그러나 17분 이후 너무 공격적으로 전진. Destroyer는 맵 측면 플랭킹 + 퇴로 확보가 필수. 섬/빙산을 엄폐물로 더 적극 활용하세요.",
  keyRecommendation:"소모품(Smoke/ECM) 사용 타이밍 최적화 + 아군과의 거리를 항상 3km 이내로 유지하세요. 이 두 가지만 개선해도 생존율 +30%, 딜 기여도 +25% 향상이 예상됩니다."
};

// ── Radar Chart ──────────────────────────────────────────────────────────────
function RadarChart({ data }) {
  const cx=100, cy=100, r=68;
  const axes=["포지셔닝","무기활용","소모품","팀플레이","생존"];
  const vals=[data.positioning,data.weaponUsage,data.consumables,data.teamplay,data.survival];
  const pt=(angle,radius)=>({ x:cx+radius*Math.sin(angle), y:cy-radius*Math.cos(angle) });
  const pts=vals.map((v,i)=>pt((2*Math.PI*i)/5,(v/100)*r));
  const grid=(s)=>axes.map((_,i)=>pt((2*Math.PI*i)/5,r*s));
  return (
    <svg width="200" height="200" viewBox="0 0 200 200">
      {[.2,.4,.6,.8,1].map((s,i)=>{
        const g=grid(s);
        return <polygon key={i} points={g.map(p=>`${p.x},${p.y}`).join(" ")} fill="none" stroke="rgba(34,211,238,0.12)" strokeWidth="1"/>;
      })}
      {axes.map((_,i)=>{
        const e=pt((2*Math.PI*i)/5,r);
        return <line key={i} x1={cx} y1={cy} x2={e.x} y2={e.y} stroke="rgba(34,211,238,0.18)" strokeWidth="1"/>;
      })}
      <polygon points={pts.map(p=>`${p.x},${p.y}`).join(" ")} fill="rgba(34,211,238,0.12)" stroke="#22d3ee" strokeWidth="1.5"/>
      {pts.map((p,i)=><circle key={i} cx={p.x} cy={p.y} r="3" fill="#22d3ee"/>)}
      {axes.map((l,i)=>{
        const lp=pt((2*Math.PI*i)/5,r+17);
        return <text key={i} x={lp.x} y={lp.y} textAnchor="middle" dominantBaseline="middle" fontSize="7.5" fill="#64748b" fontFamily="monospace">{l}</text>;
      })}
    </svg>
  );
}

// ── Score Ring ───────────────────────────────────────────────────────────────
function ScoreRing({ score }) {
  const color=score>=80?"#34d399":score>=65?"#22d3ee":score>=50?"#fbbf24":"#f87171";
  const label=score>=80?"ELITE":score>=65?"SKILLED":score>=50?"AVERAGE":"NEEDS WORK";
  const c=2*Math.PI*36;
  return (
    <div style={{display:"flex",flexDirection:"column",alignItems:"center",gap:"4px"}}>
      <svg width="88" height="88" viewBox="0 0 88 88">
        <circle cx="44" cy="44" r="36" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="6"/>
        <circle cx="44" cy="44" r="36" fill="none" stroke={color} strokeWidth="6"
          strokeDasharray={c} strokeDashoffset={c-(score/100)*c}
          strokeLinecap="round" transform="rotate(-90 44 44)"/>
        <text x="44" y="41" textAnchor="middle" fill={color} fontSize="17" fontWeight="900" fontFamily="monospace">{score}</text>
        <text x="44" y="54" textAnchor="middle" fill="#475569" fontSize="7" fontFamily="monospace">/100</text>
      </svg>
      <span style={{fontSize:"9px",color,fontFamily:"monospace",fontWeight:"700",letterSpacing:"1.5px"}}>{label}</span>
    </div>
  );
}

// ── Bar Sparkline ─────────────────────────────────────────────────────────────
function Sparkline({ data }) {
  const max=Math.max(...data.map(d=>d.damage));
  return (
    <div style={{display:"flex",alignItems:"flex-end",gap:"3px",height:"56px"}}>
      {data.map((d,i)=>(
        <div key={i} style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",gap:"2px"}}>
          <div style={{width:"100%",borderRadius:"2px 2px 0 0",background:"linear-gradient(to top,#0891b2,#22d3ee)",height:`${(d.damage/max)*44}px`,opacity:.75}}/>
          <span style={{fontSize:"8px",color:"#475569",fontFamily:"monospace"}}>{d.month}</span>
        </div>
      ))}
    </div>
  );
}

// ── Main ─────────────────────────────────────────────────────────────────────
export default function MWAnalyzer() {
  const [page, setPage]=useState("home");
  const [query, setQuery]=useState("");
  const [player, setPlayer]=useState(null);
  const [activeTab, setActiveTab]=useState("overview");
  const [shipFilter, setShipFilter]=useState("");
  const [analysisMode, setAnalysisMode]=useState("full");
  const [uploadPreview, setUploadPreview]=useState(null);
  const [uploadedFile, setUploadedFile]=useState(null);
  const [dragOver, setDragOver]=useState(false);
  const [analyzing, setAnalyzing]=useState(false);
  const [progress, setProgress]=useState(0);
  const [stage, setStage]=useState("");
  const [result, setResult]=useState(null);
  const fileRef=useRef(null);

  const doSearch=()=>{
    const p={...MOCK_PLAYER, username: query.trim()||"NavyStrike_KR"};
    setPlayer(p); setPage("dashboard"); setActiveTab("overview");
  };

  const onFile=useCallback((file)=>{
    if(!file) return;
    setUploadedFile(file);
    if(file.type.startsWith("image/")) {
      const fr=new FileReader();
      fr.onload=e=>setUploadPreview({type:"image",url:e.target.result,name:file.name,size:(file.size/1048576).toFixed(1)});
      fr.readAsDataURL(file);
    } else {
      setUploadPreview({type:"video",url:null,name:file.name,size:(file.size/1048576).toFixed(1)});
    }
  },[]);

  const runAnalysis=async()=>{
    setAnalyzing(true); setProgress(0); setResult(null);
    const stages=[
      {m:"🛰️ 파일 업로드 중...", p:15},
      {m:"🔍 프레임 분석 중...", p:35},
      {m:"⚡ Gemini 멀티모달 추론 실행 중...", p:60},
      {m:"🎯 함선 기동 패턴 식별 중...", p:78},
      {m:"📊 전술 피드백 생성 중...", p:92},
    ];
    for(const s of stages){
      setStage(s.m); setProgress(s.p);
      await new Promise(r=>setTimeout(r,650));
    }
    try {
      let imageData=null;
      if(uploadPreview?.type==="image"&&uploadPreview.url) imageData=uploadPreview.url.split(",")[1];
      const prompt=`당신은 Modern Warships 프로 코치 AI입니다.
게임 분석 대상 함종: ${shipFilter||"자동 감지"}
분석 모드: ${analysisMode==="keymoments"?"Key Moments Only":"Full Analysis"}

Modern Warships 전술 지식:
- DD(구축함): 고기동성, 미사일/어뢰 특화, Smoke+ECM 콤보, 키팅 전술
- CG(순양함): 균형형, AA 강함, Repair 타이밍 중요
- SS(잠수함): 스텔스, SLBM 원거리 타격, 소나 회피
- CV(항모): 후방 포지셔닝, 항공대 단계적 투입
- BB(전함): 주포 각도 최적화, 정면 장갑 활용

아래 JSON 형식으로만 응답하세요 (마크다운 없이 순수 JSON):
{
  "shipClass": "DD",
  "shipName": "함선 이름",
  "overallScore": 75,
  "scoreBreakdown": {"positioning":70,"weaponUsage":80,"consumables":60,"teamplay":75,"survival":65},
  "matchSummary": "2-3문장 요약",
  "topFlaws": [
    {"rank":1,"timestamp":"18:12","title":"제목","description":"구체적 상황(적 함선, 무기, 수치)","impact":"피해 수치","fix":"개선 방법","expectedImprovement":"개선 효과 수치"}
  ],
  "bestPlays": [
    {"rank":1,"timestamp":"09:33","title":"제목","description":"구체적 상황","whyGood":"전술적 이유"}
  ],
  "consumableAnalysis": "Repair/Smoke/ECM 타이밍 분석",
  "positioningAnalysis": "포지셔닝 분석",
  "keyRecommendation": "핵심 개선점 1가지"
}
topFlaws는 정확히 5개, bestPlays는 정확히 3개 생성. 타임스탬프, 데미지 수치, 함선명을 구체적으로 포함.`;

      const msgs=imageData?[{role:"user",content:[
        {type:"image",source:{type:"base64",media_type:uploadedFile?.type||"image/jpeg",data:imageData}},
        {type:"text",text:prompt}
      ]}]:[{role:"user",content:prompt+"\n\n실제 Modern Warships DD 플레이어의 분석 예시를 생성해주세요."}];

      const res=await fetch("https://api.anthropic.com/v1/messages",{
        method:"POST",
        headers:{"Content-Type":"application/json"},
        body:JSON.stringify({
          model:"claude-sonnet-4-20250514",
          max_tokens:1000,
          system:"Modern Warships 전문 AI 코치. 요청된 JSON 형식으로만 응답. 마크다운 없이 순수 JSON만 출력.",
          messages:msgs
        })
      });
      const d=await res.json();
      const txt=d.content?.map(b=>b.text||"").join("")||"";
      const clean=txt.replace(/```json|```/g,"").trim();
      let parsed;
      try { parsed=JSON.parse(clean); } catch { parsed=FALLBACK; }
      setProgress(100); setStage("✅ 분석 완료!");
      await new Promise(r=>setTimeout(r,350));
      setResult(parsed);
    } catch {
      setResult(FALLBACK);
    }
    setAnalyzing(false);
  };

  // ── Styles ──────────────────────────────────────────────────────────────────
  const S={
    app:{background:"#060d1a",minHeight:"100vh",color:"#e2e8f0",fontFamily:"'Courier New',monospace",position:"relative"},
    scanline:{position:"fixed",top:0,left:0,right:0,bottom:0,backgroundImage:"repeating-linear-gradient(0deg,transparent,transparent 2px,rgba(0,200,180,0.012) 2px,rgba(0,200,180,0.012) 4px)",pointerEvents:"none",zIndex:0},
    rel:{position:"relative",zIndex:1},
    nav:{background:"rgba(6,13,26,0.96)",borderBottom:"1px solid rgba(34,211,238,0.15)",padding:"12px 20px",display:"flex",alignItems:"center",justifyContent:"space-between",position:"sticky",top:0,zIndex:100,backdropFilter:"blur(12px)"},
    logoTxt:{fontSize:"20px",fontWeight:"900",background:"linear-gradient(135deg,#22d3ee,#0ea5e9)",WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent",letterSpacing:"3px"},
    logoSub:{fontSize:"8px",color:"#334155",letterSpacing:"3px",marginTop:"-1px"},
    navBtn:(a)=>({padding:"5px 14px",borderRadius:"3px",border:`1px solid ${a?"rgba(34,211,238,0.45)":"rgba(34,211,238,0.1)"}`,background:a?"rgba(34,211,238,0.08)":"transparent",color:a?"#22d3ee":"#475569",fontSize:"10px",letterSpacing:"1px",cursor:"pointer"}),
    wrap:{padding:"24px",maxWidth:"1100px",margin:"0 auto"},
    card:(extra={})=>({background:"rgba(12,20,38,0.85)",border:"1px solid rgba(34,211,238,0.1)",borderRadius:"8px",padding:"18px",backdropFilter:"blur(6px)",...extra}),
    statCard:(c)=>({background:`rgba(${c},.05)`,border:`1px solid rgba(${c},.18)`,borderRadius:"8px",padding:"15px"}),
    badge:(c)=>({display:"inline-block",padding:"2px 7px",borderRadius:"3px",fontSize:"9px",fontWeight:"700",background:`rgba(${c},.15)`,color:`rgb(${c})`,letterSpacing:"1px"}),
    tab:(a)=>({padding:"7px 18px",borderRadius:"4px 4px 0 0",border:`1px solid ${a?"rgba(34,211,238,0.35)":"rgba(34,211,238,0.08)"}`,borderBottom:"none",background:a?"rgba(34,211,238,0.07)":"transparent",color:a?"#22d3ee":"#475569",fontSize:"10px",letterSpacing:"1px",cursor:"pointer"}),
    uploadZone:(over)=>({border:`2px dashed ${over?"#22d3ee":"rgba(34,211,238,0.2)"}`,borderRadius:"10px",padding:"36px",textAlign:"center",background:over?"rgba(34,211,238,0.04)":"transparent",cursor:"pointer",transition:"all .2s"}),
    pBar:{background:"rgba(34,211,238,0.08)",borderRadius:"4px",height:"5px",overflow:"hidden"},
    g4:{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(175px,1fr))",gap:"12px"},
    g2:{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(260px,1fr))",gap:"14px"},
  };

  return (
    <div style={S.app}>
      <div style={S.scanline}/>
      <div style={S.rel}>

        {/* NAV */}
        <nav style={S.nav}>
          <div style={{display:"flex",alignItems:"center",gap:"10px",cursor:"pointer"}} onClick={()=>setPage("home")}>
            <div style={{width:"30px",height:"30px",background:"linear-gradient(135deg,#0891b2,#6366f1)",borderRadius:"6px",display:"flex",alignItems:"center",justifyContent:"center",fontSize:"15px"}}>⚓</div>
            <div><div style={S.logoTxt}>MW.GG</div><div style={S.logoSub}>WARSHIP ANALYZER</div></div>
          </div>
          <div style={{display:"flex",gap:"6px"}}>
            {[["home","🏠 홈"],["dashboard","📊 대시보드"],["analyze","🤖 AI 분석"]].map(([p,l])=>(
              <button key={p} style={S.navBtn(page===p)} onClick={()=>setPage(p)}>{l}</button>
            ))}
          </div>
        </nav>

        {/* ── HOME ─────────────────────────────────────────────────────────── */}
        {page==="home"&&(
          <div style={{padding:"72px 24px",textAlign:"center"}}>
            <div style={{fontSize:"10px",color:"#22d3ee",letterSpacing:"4px",marginBottom:"14px"}}>◈ AI-POWERED COMBAT INTELLIGENCE ◈</div>
            <h1 style={{fontSize:"clamp(28px,7vw,60px)",fontWeight:"900",lineHeight:1.1,marginBottom:"12px"}}>
              <span style={{background:"linear-gradient(135deg,#22d3ee,#0ea5e9)",WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent"}}>MW.GG</span><br/>
              <span style={{color:"#e2e8f0",fontSize:".5em"}}>MODERN WARSHIPS BATTLE ANALYTICS</span>
            </h1>
            <p style={{color:"#334155",fontSize:"11px",letterSpacing:"2px",marginBottom:"44px"}}>// GEMINI MULTIMODAL AI · REPLAY ANALYSIS · PRO COACHING //</p>
            <div style={{display:"flex",maxWidth:"460px",margin:"0 auto"}}>
              <input style={{flex:1,background:"rgba(34,211,238,0.04)",border:"1px solid rgba(34,211,238,0.28)",borderRight:"none",borderRadius:"4px 0 0 4px",padding:"13px 18px",color:"#e2e8f0",fontSize:"13px",outline:"none",fontFamily:"monospace"}} value={query} onChange={e=>setQuery(e.target.value)} onKeyDown={e=>e.key==="Enter"&&doSearch()} placeholder="플레이어명 입력 (예: NavyStrike_KR)"/>
              <button style={{background:"linear-gradient(135deg,#0891b2,#0e7490)",border:"none",borderRadius:"0 4px 4px 0",padding:"13px 22px",color:"white",fontSize:"12px",cursor:"pointer",fontFamily:"monospace",letterSpacing:"1px"}} onClick={doSearch}>검색 ▶</button>
            </div>
            <div style={{color:"#1e293b",fontSize:"10px",marginTop:"8px"}}>Try: NavyStrike_KR · FleetCommander · SeaWolf99</div>

            <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(190px,1fr))",gap:"14px",maxWidth:"840px",margin:"56px auto 0"}}>
              {[
                {icon:"📊",title:"전적 대시보드",desc:"승률·K/D·평균데미지·함종별 통계 종합 분석",c:"34,211,238"},
                {icon:"🤖",title:"AI 리플레이 분석",desc:"Gemini 멀티모달로 영상/스크린샷 직접 분석",c:"167,139,250"},
                {icon:"🎯",title:"함종별 맞춤 코칭",desc:"DD/CG/SS/CV/BB 각 함종 전술 피드백 제공",c:"52,211,153"},
                {icon:"⚡",title:"아쉬운점 Top5+Best3",desc:"구체적 타임스탬프·수치 기반 개선 포인트",c:"251,191,36"},
              ].map((f,i)=>(
                <div key={i} style={{background:`rgba(${f.c},.04)`,border:`1px solid rgba(${f.c},.13)`,borderRadius:"8px",padding:"18px",textAlign:"left"}}>
                  <div style={{fontSize:"26px",marginBottom:"8px"}}>{f.icon}</div>
                  <div style={{color:`rgb(${f.c})`,fontSize:"11px",fontWeight:"700",letterSpacing:"1px",marginBottom:"5px"}}>{f.title}</div>
                  <div style={{color:"#334155",fontSize:"11px",lineHeight:1.6}}>{f.desc}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── DASHBOARD ────────────────────────────────────────────────────── */}
        {page==="dashboard"&&player&&(
          <div style={S.wrap}>
            {/* Header */}
            <div style={{...S.card(),marginBottom:"14px",display:"flex",alignItems:"center",justifyContent:"space-between",flexWrap:"wrap",gap:"14px"}}>
              <div style={{display:"flex",alignItems:"center",gap:"14px"}}>
                <div style={{width:"58px",height:"58px",background:"linear-gradient(135deg,#0891b2,#6366f1)",borderRadius:"10px",display:"flex",alignItems:"center",justifyContent:"center",fontSize:"26px",flexShrink:0}}>⚓</div>
                <div>
                  <div style={{display:"flex",alignItems:"center",gap:"7px",flexWrap:"wrap"}}>
                    <span style={{fontSize:"20px",fontWeight:"900",color:"#22d3ee"}}>{player.username}</span>
                    <span style={S.badge("34,211,238")}>{player.clanTag}</span>
                    <span style={S.badge("251,191,36")}>⭐ Admiral</span>
                  </div>
                  <div style={{color:"#475569",fontSize:"10px",marginTop:"3px"}}>{player.region} · 마지막 접속: {player.lastActive} · 연승 {player.winStreak}회</div>
                  <div style={{color:"#1e293b",fontSize:"9px",marginTop:"2px"}}>총 {player.totalBattles.toLocaleString()} 전 · {player.playtime}</div>
                </div>
              </div>
              <button style={{background:"linear-gradient(135deg,#0891b2,#0e7490)",border:"none",borderRadius:"5px",padding:"10px 18px",color:"white",fontSize:"11px",cursor:"pointer",fontFamily:"monospace",letterSpacing:"1px"}} onClick={()=>setPage("analyze")}>🤖 AI 분석 시작</button>
            </div>

            {/* Stats */}
            <div style={{...S.g4,marginBottom:"14px"}}>
              {[
                {l:"승률",v:`${player.winRate}%`,c:"34,211,238",s:"전체 전투"},
                {l:"평균 데미지",v:`${(player.avgDamage/1000).toFixed(1)}K`,c:"167,139,250",s:"매 전투"},
                {l:"K/D 비율",v:player.kdRatio,c:"52,211,153",s:"킬/데스"},
                {l:"생존율",v:`${player.survivalRate}%`,c:"251,191,36",s:"전투 생존"},
                {l:"MVP 수",v:player.mvpCount,c:"248,113,113",s:"총 수령"},
                {l:"랭크 포인트",v:player.rankPoints.toLocaleString(),c:"251,146,60",s:"Admiral"},
              ].map((s,i)=>(
                <div key={i} style={S.statCard(s.c)}>
                  <div style={{fontSize:"26px",fontWeight:"900",color:`rgb(${s.c})`,fontFamily:"monospace"}}>{s.v}</div>
                  <div style={{color:`rgb(${s.c})`,fontSize:"9px",letterSpacing:"2px",marginTop:"1px"}}>{s.l}</div>
                  <div style={{color:"#334155",fontSize:"9px",marginTop:"2px"}}>{s.s}</div>
                </div>
              ))}
            </div>

            {/* Tabs */}
            <div style={{display:"flex",gap:"3px",marginBottom:"-1px"}}>
              {[["overview","개요"],["ships","함선별"],["matches","전적"]].map(([t,l])=>(
                <button key={t} style={S.tab(activeTab===t)} onClick={()=>setActiveTab(t)}>{l}</button>
              ))}
            </div>
            <div style={{...S.card(),borderRadius:"0 8px 8px 8px"}}>

              {activeTab==="overview"&&(
                <div style={S.g2}>
                  <div>
                    <div style={{color:"#334155",fontSize:"9px",letterSpacing:"2px",marginBottom:"10px"}}>// 월별 데미지 추이</div>
                    <Sparkline data={player.monthlyStats}/>
                    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:"6px",marginTop:"14px"}}>
                      {player.monthlyStats.slice(-3).map((m,i)=>(
                        <div key={i} style={{textAlign:"center",background:"rgba(34,211,238,0.04)",borderRadius:"4px",padding:"7px"}}>
                          <div style={{color:"#22d3ee",fontSize:"12px",fontWeight:"700"}}>{(m.damage/1000).toFixed(0)}K</div>
                          <div style={{color:"#334155",fontSize:"8px"}}>{m.month}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div>
                    <div style={{color:"#334155",fontSize:"9px",letterSpacing:"2px",marginBottom:"10px"}}>// 함종별 전투 분포</div>
                    {player.shipStats.map((s,i)=>(
                      <div key={i} style={{display:"flex",alignItems:"center",gap:"8px",marginBottom:"8px"}}>
                        <span style={{color:CLASS_COLORS[s.class],fontSize:"10px",fontWeight:"700",width:"28px"}}>{s.class}</span>
                        <div style={{flex:1,background:"rgba(255,255,255,0.04)",borderRadius:"2px",height:"5px"}}>
                          <div style={{width:`${(s.battles/634)*100}%`,height:"100%",background:CLASS_COLORS[s.class],borderRadius:"2px",opacity:.75}}/>
                        </div>
                        <span style={{color:"#334155",fontSize:"9px",width:"38px",textAlign:"right"}}>{s.battles}전</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {activeTab==="ships"&&(
                <div style={{overflowX:"auto"}}>
                  <table style={{width:"100%",borderCollapse:"collapse",fontSize:"12px"}}>
                    <thead>
                      <tr style={{borderBottom:"1px solid rgba(34,211,238,0.08)"}}>
                        {["함선","분류","전투수","승률","평균데미지","K/D"].map(h=>(
                          <th key={h} style={{padding:"9px",textAlign:"left",color:"#334155",fontSize:"9px",letterSpacing:"1px",fontWeight:"400"}}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {player.shipStats.map((s,i)=>(
                        <tr key={i} style={{borderBottom:"1px solid rgba(255,255,255,0.025)"}}>
                          <td style={{padding:"9px",color:"#94a3b8"}}>{s.ship}</td>
                          <td style={{padding:"9px"}}><span style={{color:CLASS_COLORS[s.class],fontWeight:"700",fontSize:"10px"}}>{s.class}</span> <span style={{color:"#334155",fontSize:"9px"}}>{CLASS_NAMES[s.class]}</span></td>
                          <td style={{padding:"9px",color:"#64748b"}}>{s.battles}</td>
                          <td style={{padding:"9px",color:s.wr>65?"#22d3ee":s.wr>55?"#94a3b8":"#f87171",fontWeight:"700"}}>{s.wr}%</td>
                          <td style={{padding:"9px",color:"#a78bfa"}}>{(s.avgDmg/1000).toFixed(0)}K</td>
                          <td style={{padding:"9px",color:"#34d399"}}>{s.kd}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {activeTab==="matches"&&(
                <div>
                  {player.recentMatches.map((m,i)=>(
                    <div key={i} style={{display:"flex",alignItems:"center",gap:"10px",padding:"9px 0",borderBottom:"1px solid rgba(255,255,255,0.03)",flexWrap:"wrap"}}>
                      <div style={{width:"44px",height:"44px",background:m.result==="WIN"?"rgba(34,211,238,0.08)":"rgba(248,113,113,0.08)",border:`1px solid ${m.result==="WIN"?"rgba(34,211,238,0.25)":"rgba(248,113,113,0.25)"}`,borderRadius:"5px",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",flexShrink:0}}>
                        <span style={{color:m.result==="WIN"?"#22d3ee":"#f87171",fontSize:"9px",fontWeight:"900"}}>{m.result}</span>
                        <span style={{color:"#334155",fontSize:"8px"}}>{m.duration}</span>
                      </div>
                      <div style={{flex:1,minWidth:"110px"}}>
                        <div style={{display:"flex",alignItems:"center",gap:"5px",flexWrap:"wrap"}}>
                          <span style={{color:CLASS_COLORS[m.class],fontSize:"9px",fontWeight:"700"}}>{m.class}</span>
                          <span style={{fontSize:"11px"}}>{m.ship}</span>
                          {m.mvp&&<span style={{background:"rgba(251,191,36,0.12)",color:"#fbbf24",fontSize:"8px",padding:"1px 5px",borderRadius:"2px"}}>MVP</span>}
                        </div>
                        <div style={{color:"#334155",fontSize:"9px"}}>{m.map} · {m.ago}</div>
                      </div>
                      <div style={{display:"flex",gap:"14px"}}>
                        {[{v:`${(m.damage/1000).toFixed(0)}K`,l:"DMG",c:"#a78bfa"},{v:`${m.kills}/${m.assists}`,l:"K/A",c:"#22d3ee"},{v:m.survived?"생존":"격침",l:"STATUS",c:m.survived?"#34d399":"#f87171"}].map((x,j)=>(
                          <div key={j} style={{textAlign:"center"}}>
                            <div style={{color:x.c,fontWeight:"700",fontSize:"11px"}}>{x.v}</div>
                            <div style={{color:"#1e293b",fontSize:"8px"}}>{x.l}</div>
                          </div>
                        ))}
                      </div>
                      <button style={{background:"transparent",border:"1px solid rgba(34,211,238,0.18)",borderRadius:"3px",padding:"5px 10px",color:"#22d3ee",fontSize:"9px",cursor:"pointer"}} onClick={()=>setPage("analyze")}>AI 분석</button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── ANALYZE ──────────────────────────────────────────────────────── */}
        {page==="analyze"&&(
          <div style={{...S.wrap,maxWidth:"860px"}}>
            <div style={{marginBottom:"22px"}}>
              <div style={{color:"#22d3ee",fontSize:"9px",letterSpacing:"3px",marginBottom:"5px"}}>// AI COMBAT ANALYSIS ENGINE</div>
              <h2 style={{fontSize:"22px",fontWeight:"900",margin:0}}>AI 플레이 분석</h2>
              <p style={{color:"#334155",fontSize:"11px",marginTop:"5px",lineHeight:1.6}}>리플레이 영상 또는 스크린샷을 업로드하면 Gemini 멀티모달 AI가 전술 피드백을 제공합니다.</p>
            </div>

            {!result&&!analyzing&&(
              <>
                <div style={{...S.g2,marginBottom:"14px"}}>
                  <div style={S.card()}>
                    <div style={{color:"#334155",fontSize:"9px",letterSpacing:"2px",marginBottom:"9px"}}>함종 선택</div>
                    <div style={{display:"flex",gap:"5px",flexWrap:"wrap"}}>
                      {[["","🎯 자동"],["DD","DD 구축함"],["CG","CG 순양함"],["SS","SS 잠수함"],["CV","CV 항모"],["BB","BB 전함"]].map(([v,l])=>(
                        <button key={v} onClick={()=>setShipFilter(v)} style={{padding:"5px 10px",borderRadius:"3px",border:`1px solid ${shipFilter===v?"rgba(34,211,238,0.45)":"rgba(34,211,238,0.1)"}`,background:shipFilter===v?"rgba(34,211,238,0.08)":"transparent",color:shipFilter===v?"#22d3ee":"#475569",fontSize:"10px",cursor:"pointer"}}>{l}</button>
                      ))}
                    </div>
                  </div>
                  <div style={S.card()}>
                    <div style={{color:"#334155",fontSize:"9px",letterSpacing:"2px",marginBottom:"9px"}}>분석 모드</div>
                    <div style={{display:"flex",gap:"7px"}}>
                      {[["full","🔍 전체 분석","정밀"],["keymoments","⚡ Key Moments","비용 -80%"]].map(([v,l,s])=>(
                        <button key={v} onClick={()=>setAnalysisMode(v)} style={{flex:1,padding:"9px",borderRadius:"4px",border:`1px solid ${analysisMode===v?"rgba(34,211,238,0.38)":"rgba(34,211,238,0.08)"}`,background:analysisMode===v?"rgba(34,211,238,0.07)":"transparent",color:analysisMode===v?"#22d3ee":"#475569",fontSize:"10px",cursor:"pointer",textAlign:"center"}}>
                          <div>{l}</div><div style={{fontSize:"8px",opacity:.65,marginTop:"2px"}}>{s}</div>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div style={S.uploadZone(dragOver)} onDragOver={e=>{e.preventDefault();setDragOver(true);}} onDragLeave={()=>setDragOver(false)} onDrop={e=>{e.preventDefault();setDragOver(false);onFile(e.dataTransfer.files[0]);}} onClick={()=>fileRef.current?.click()}>
                  <input ref={fileRef} type="file" style={{display:"none"}} accept="image/*,video/*" onChange={e=>onFile(e.target.files[0])}/>
                  {uploadPreview?(
                    <div>
                      {uploadPreview.type==="image"?<img src={uploadPreview.url} alt="" style={{maxHeight:"180px",maxWidth:"100%",borderRadius:"5px",marginBottom:"10px"}}/>:<div style={{fontSize:"42px",marginBottom:"10px"}}>🎬</div>}
                      <div style={{color:"#22d3ee",fontWeight:"700",fontSize:"13px"}}>{uploadPreview.name}</div>
                      <div style={{color:"#475569",fontSize:"10px"}}>{uploadPreview.size} MB · {uploadPreview.type==="video"?"영상":"이미지"} 파일</div>
                    </div>
                  ):(
                    <div>
                      <div style={{fontSize:"40px",marginBottom:"14px",opacity:.5}}>📁</div>
                      <div style={{color:"#94a3b8",fontSize:"13px",marginBottom:"5px"}}>영상 또는 스크린샷 업로드</div>
                      <div style={{color:"#334155",fontSize:"10px"}}>드래그&드롭 또는 클릭 · MP4, AVI, PNG, JPG</div>
                      <div style={{color:"#1e293b",fontSize:"9px",marginTop:"6px"}}>Gemini 직접 처리 (최대 2GB)</div>
                    </div>
                  )}
                </div>

                <div style={{display:"flex",gap:"10px",marginTop:"14px"}}>
                  <button style={{flex:1,background:"linear-gradient(135deg,#0891b2,#0e7490)",border:"none",borderRadius:"5px",padding:"13px",color:"white",fontSize:"13px",cursor:"pointer",fontFamily:"monospace",fontWeight:"700",letterSpacing:"1px"}} onClick={runAnalysis}>🤖 AI 분석 시작</button>
                  <button style={{background:"rgba(34,211,238,0.05)",border:"1px solid rgba(34,211,238,0.18)",borderRadius:"5px",padding:"13px 18px",color:"#22d3ee",fontSize:"11px",cursor:"pointer",fontFamily:"monospace"}} onClick={()=>{setUploadedFile({name:"demo.mp4",type:"video/mp4",size:0});setUploadPreview({type:"video",name:"demo_replay.mp4",size:"124.5"});}}>데모 실행</button>
                </div>
              </>
            )}

            {analyzing&&(
              <div style={{...S.card(),textAlign:"center",padding:"44px"}}>
                <div style={{fontSize:"32px",marginBottom:"14px"}}>🛰️</div>
                <div style={{color:"#22d3ee",fontSize:"13px",marginBottom:"18px",minHeight:"18px"}}>{stage}</div>
                <div style={S.pBar}>
                  <div style={{width:`${progress}%`,height:"100%",background:"linear-gradient(90deg,#0891b2,#22d3ee)",borderRadius:"4px",transition:"width .5s ease",boxShadow:"0 0 8px rgba(34,211,238,0.4)"}}/>
                </div>
                <div style={{color:"#334155",fontSize:"10px",marginTop:"7px"}}>{progress}% 완료</div>
                <div style={{color:"#1e293b",fontSize:"9px",marginTop:"14px"}}>Gemini 멀티모달 AI가 전투 패턴을 분석 중...</div>
              </div>
            )}

            {result&&(
              <div>
                {/* Score */}
                <div style={{...S.card(),display:"flex",alignItems:"center",justifyContent:"space-between",flexWrap:"wrap",gap:"14px",marginBottom:"14px"}}>
                  <div style={{display:"flex",alignItems:"center",gap:"18px",flexWrap:"wrap"}}>
                    <ScoreRing score={result.overallScore}/>
                    <div>
                      <div style={{color:"#22d3ee",fontSize:"9px",letterSpacing:"2px",marginBottom:"3px"}}>ANALYSIS COMPLETE</div>
                      <div style={{fontSize:"15px",fontWeight:"700"}}>{result.shipName} <span style={{color:CLASS_COLORS[result.shipClass],fontSize:"11px"}}>({result.shipClass} · {CLASS_NAMES[result.shipClass]})</span></div>
                      <div style={{color:"#475569",fontSize:"11px",marginTop:"4px",maxWidth:"380px",lineHeight:1.6}}>{result.matchSummary}</div>
                    </div>
                  </div>
                  <RadarChart data={result.scoreBreakdown}/>
                </div>

                {/* Score breakdown */}
                <div style={{...S.g4,marginBottom:"14px"}}>
                  {Object.entries(result.scoreBreakdown).map(([k,v])=>{
                    const lbs={positioning:"포지셔닝",weaponUsage:"무기활용",consumables:"소모품",teamplay:"팀플레이",survival:"생존"};
                    const c=v>=80?"52,211,153":v>=65?"34,211,238":v>=50?"251,191,36":"248,113,113";
                    return (
                      <div key={k} style={S.statCard(c)}>
                        <div style={{fontSize:"24px",fontWeight:"900",color:`rgb(${c})`,fontFamily:"monospace"}}>{v}</div>
                        <div style={{color:`rgb(${c})`,fontSize:"8px",letterSpacing:"2px"}}>{lbs[k]}</div>
                        <div style={{...S.pBar,marginTop:"6px"}}>
                          <div style={{width:`${v}%`,height:"100%",background:`rgb(${c})`,borderRadius:"4px",opacity:.65}}/>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Top Flaws */}
                <div style={{...S.card(),marginBottom:"14px"}}>
                  <div style={{color:"#f87171",fontSize:"10px",letterSpacing:"2px",marginBottom:"14px"}}>⚠️ 아쉬운 점 TOP 5</div>
                  <div style={{display:"flex",flexDirection:"column",gap:"10px"}}>
                    {result.topFlaws.map((f,i)=>(
                      <div key={i} style={{background:`${FLAW_COLORS[i]}0d`,border:`1px solid ${FLAW_COLORS[i]}33`,borderRadius:"7px",padding:"13px"}}>
                        <div style={{display:"flex",gap:"9px",alignItems:"flex-start"}}>
                          <div style={{width:"26px",height:"26px",borderRadius:"50%",background:`${FLAW_COLORS[i]}22`,border:`1px solid ${FLAW_COLORS[i]}66`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:"10px",fontWeight:"900",color:FLAW_COLORS[i],flexShrink:0}}>#{f.rank}</div>
                          <div style={{flex:1}}>
                            <div style={{display:"flex",alignItems:"center",gap:"7px",flexWrap:"wrap",marginBottom:"5px"}}>
                              <span style={{color:FLAW_COLORS[i],fontWeight:"700",fontSize:"12px"}}>{f.title}</span>
                              <span style={{background:"rgba(34,211,238,0.09)",color:"#22d3ee",fontSize:"9px",padding:"1px 7px",borderRadius:"3px"}}>⏱ {f.timestamp}</span>
                            </div>
                            <div style={{color:"#7d96b8",fontSize:"11px",lineHeight:1.65,marginBottom:"8px"}}>{f.description}</div>
                            <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(165px,1fr))",gap:"6px"}}>
                              <div style={{background:"rgba(248,113,113,0.06)",borderRadius:"4px",padding:"7px"}}>
                                <div style={{color:"#f87171",fontSize:"8px",letterSpacing:"1px",marginBottom:"2px"}}>📉 영향</div>
                                <div style={{color:"#fca5a5",fontSize:"10px"}}>{f.impact}</div>
                              </div>
                              <div style={{background:"rgba(34,211,238,0.05)",borderRadius:"4px",padding:"7px"}}>
                                <div style={{color:"#22d3ee",fontSize:"8px",letterSpacing:"1px",marginBottom:"2px"}}>💡 개선 방법</div>
                                <div style={{color:"#7dd3fc",fontSize:"10px"}}>{f.fix}</div>
                              </div>
                              <div style={{background:"rgba(52,211,153,0.05)",borderRadius:"4px",padding:"7px"}}>
                                <div style={{color:"#34d399",fontSize:"8px",letterSpacing:"1px",marginBottom:"2px"}}>📈 예상 개선 효과</div>
                                <div style={{color:"#86efac",fontSize:"10px"}}>{f.expectedImprovement}</div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Best Plays */}
                <div style={{...S.card(),marginBottom:"14px"}}>
                  <div style={{color:"#34d399",fontSize:"10px",letterSpacing:"2px",marginBottom:"14px"}}>🏆 BEST PLAY TOP 3</div>
                  <div style={{display:"flex",flexDirection:"column",gap:"9px"}}>
                    {result.bestPlays.map((b,i)=>(
                      <div key={i} style={{background:"rgba(52,211,153,0.04)",border:"1px solid rgba(52,211,153,0.18)",borderRadius:"7px",padding:"13px"}}>
                        <div style={{display:"flex",gap:"9px",alignItems:"flex-start"}}>
                          <div style={{width:"26px",height:"26px",borderRadius:"50%",background:"rgba(52,211,153,0.18)",border:"1px solid rgba(52,211,153,0.45)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:"10px",fontWeight:"900",color:"#34d399",flexShrink:0}}>#{b.rank}</div>
                          <div style={{flex:1}}>
                            <div style={{display:"flex",alignItems:"center",gap:"7px",flexWrap:"wrap",marginBottom:"5px"}}>
                              <span style={{color:"#34d399",fontWeight:"700",fontSize:"12px"}}>{b.title}</span>
                              <span style={{background:"rgba(34,211,238,0.09)",color:"#22d3ee",fontSize:"9px",padding:"1px 7px",borderRadius:"3px"}}>⏱ {b.timestamp}</span>
                            </div>
                            <div style={{color:"#7d96b8",fontSize:"11px",lineHeight:1.65,marginBottom:"6px"}}>{b.description}</div>
                            <div style={{background:"rgba(52,211,153,0.07)",borderRadius:"4px",padding:"7px"}}>
                              <span style={{color:"#34d399",fontSize:"8px",letterSpacing:"1px"}}>✅ 왜 좋은 플레이: </span>
                              <span style={{color:"#86efac",fontSize:"10px"}}>{b.whyGood}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Additional */}
                <div style={{...S.g2,marginBottom:"14px"}}>
                  <div style={S.card()}>
                    <div style={{color:"#a78bfa",fontSize:"9px",letterSpacing:"2px",marginBottom:"9px"}}>🔧 소모품 분석</div>
                    <div style={{color:"#7d96b8",fontSize:"11px",lineHeight:1.7}}>{result.consumableAnalysis}</div>
                  </div>
                  <div style={S.card()}>
                    <div style={{color:"#fbbf24",fontSize:"9px",letterSpacing:"2px",marginBottom:"9px"}}>🗺️ 포지셔닝 분석</div>
                    <div style={{color:"#7d96b8",fontSize:"11px",lineHeight:1.7}}>{result.positioningAnalysis}</div>
                  </div>
                </div>

                <div style={{background:"rgba(34,211,238,0.04)",border:"1px solid rgba(34,211,238,0.28)",borderRadius:"7px",padding:"14px",marginBottom:"14px"}}>
                  <div style={{color:"#22d3ee",fontSize:"9px",letterSpacing:"2px",marginBottom:"6px"}}>⭐ 핵심 개선 포인트</div>
                  <div style={{color:"#e2e8f0",fontSize:"12px",lineHeight:1.7}}>{result.keyRecommendation}</div>
                </div>

                <button style={{width:"100%",background:"rgba(34,211,238,0.07)",border:"1px solid rgba(34,211,238,0.2)",borderRadius:"5px",padding:"12px",color:"#22d3ee",fontSize:"12px",cursor:"pointer",fontFamily:"monospace",letterSpacing:"1px"}} onClick={()=>{setResult(null);setUploadedFile(null);setUploadPreview(null);}}>↺ 새로운 분석 시작</button>
              </div>
            )}
          </div>
        )}

        <div style={{textAlign:"center",padding:"28px",color:"#0f172a",fontSize:"9px",letterSpacing:"2px",borderTop:"1px solid rgba(34,211,238,0.04)",marginTop:"24px"}}>
          MW.GG ANALYZER · POWERED BY GEMINI 1.5 PRO + ANTHROPIC AI · NOT AFFILIATED WITH MODERN WARSHIPS
        </div>
      </div>
    </div>
  );
}
