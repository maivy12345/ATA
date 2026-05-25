import { useState, useEffect, useRef } from "react";

// ─── FEE TABLES ────────────────────────────────────────────────
const TXN_TIERS = [
  { min:0,   max:29,  label:"Below 30 txn/yr",      fee:481  },
  { min:30,  max:59,  label:"30–59 txn/yr",          fee:546  },
  { min:60,  max:99,  label:"60–99 txn/yr",          fee:624  },
  { min:100, max:119, label:"100–119 txn/yr",        fee:663  },
  { min:120, max:199, label:"120–199 txn/yr",        fee:819  },
  { min:200, max:249, label:"200–249 txn/yr",        fee:1079 },
  { min:250, max:349, label:"250–349 txn/yr",        fee:1456 },
  { min:350, max:449, label:"350–449 txn/yr",        fee:1963 },
  { min:450, max:999, label:"450+ txn/yr",           fee:null },
];

const REV_TIERS = [
  { min:0,      max:64499,   label:"Below US$64,500",         fee:1221 },
  { min:64500,  max:95999,   label:"US$64,500 – 95,999",      fee:1391 },
  { min:96000,  max:127999,  label:"US$96,000 – 127,999",     fee:1664 },
  { min:128000, max:191999,  label:"US$128,000 – 191,999",    fee:2145 },
  { min:192000, max:255999,  label:"US$192,000 – 255,999",    fee:2353 },
  { min:256000, max:383999,  label:"US$256,000 – 383,999",    fee:2666 },
  { min:384000, max:511999,  label:"US$384,000 – 511,999",    fee:3146 },
  { min:512000, max:640999,  label:"US$512,000 – 640,999",    fee:4485 },
  { min:641000, max:9999999, label:"US$641,000+",             fee:null },
];

const FIXED = { bir51: 390, employer: 260, fsReview: 250 };
// Dormant: audit WAIVED ($0) — competitive positioning vs BBCIncorp/Osome
const DORMANT_AUDIT_FEE = 0;

function getTxnTier(v) { return TXN_TIERS.find(t => v>=t.min && v<=t.max)||TXN_TIERS[0]; }
function getRevTier(v) { return REV_TIERS.find(t => v>=t.min && v<=t.max)||REV_TIERS[0]; }
function usd(n) { return n==null?"TBC":"US$"+n.toLocaleString("en-US"); }

// ── Animated counter ────────────────────────────────────────────
function AnimatedTotal({ value }) {
  const [disp, setDisp] = useState(value);
  const [flash, setFlash] = useState(false);
  const prev = useRef(value);
  useEffect(() => {
    if (value === prev.current) return;
    setFlash(true);
    const s = typeof prev.current==="number" ? prev.current : 0;
    const e = typeof value==="number" ? value : 0;
    const t0 = performance.now();
    const step = now => {
      const p = Math.min((now-t0)/380, 1);
      const ease = 1-Math.pow(1-p,3);
      setDisp(Math.round(s+(e-s)*ease));
      if (p<1) requestAnimationFrame(step);
      else { setDisp(value); prev.current=value; }
    };
    requestAnimationFrame(step);
    setTimeout(()=>setFlash(false), 500);
  }, [value]);
  if (typeof value !== "number") return <span style={{color:"#d97706"}}>TBC</span>;
  return (
    <span style={{
      display:"inline-block", transition:"transform 0.15s",
      transform: flash?"scale(1.05)":"scale(1)",
      color: flash?"#f0c040":"#d4a820"
    }}>
      US${typeof disp==="number" ? disp.toLocaleString("en-US") : disp}
    </span>
  );
}

// ── Slider ──────────────────────────────────────────────────────
function Slider({ value, min, max, onChange, log=false, formatLabel }) {
  const toS = v => log ? Math.round(Math.log(v+1)/Math.log(max+1)*100) : Math.round((v-min)/(max-min)*100);
  const fromS = s => log ? Math.round(Math.pow(max+1,s/100)-1) : Math.round(min+(s/100)*(max-min));
  const pct = toS(value);
  return (
    <div>
      <div style={{ position:"relative", height:6, borderRadius:3, background:"#1e2130", marginBottom:14 }}>
        <div style={{
          position:"absolute", left:0, top:0, height:"100%", width:pct+"%",
          borderRadius:3, background:"linear-gradient(90deg,#b8860b,#d4a820)"
        }}/>
        <input type="range" min={0} max={100} value={pct}
          onChange={e=>onChange(fromS(+e.target.value))}
          style={{ position:"absolute", inset:0, width:"100%", height:"100%", opacity:0, cursor:"pointer", margin:0 }}
        />
        <div style={{
          position:"absolute", top:"50%", left:pct+"%",
          transform:"translate(-50%,-50%)", width:20, height:20, borderRadius:"50%",
          background:"#0f1117", border:"3px solid #d4a820",
          boxShadow:"0 0 0 4px rgba(212,168,32,0.2)", pointerEvents:"none"
        }}/>
      </div>
      <div style={{ fontSize:11.5, color:"#d4a820", fontWeight:600, textAlign:"center" }}>
        {formatLabel ? formatLabel(value) : value}
      </div>
    </div>
  );
}

// ── Pills ────────────────────────────────────────────────────────
function Pills({ options, value, onChange }) {
  return (
    <div style={{ display:"flex", gap:8, flexWrap:"wrap" }}>
      {options.map(o => (
        <button key={o.value} onClick={()=>onChange(o.value)} style={{
          padding:"8px 20px", borderRadius:40, border:"1.5px solid",
          borderColor: value===o.value ? "#d4a820" : "#252830",
          background: value===o.value ? "#d4a820" : "transparent",
          color: value===o.value ? "#0f1117" : "#888",
          fontSize:12.5, fontWeight: value===o.value ? 700 : 400,
          cursor:"pointer", transition:"all 0.18s", fontFamily:"inherit"
        }}>{o.label}</button>
      ))}
    </div>
  );
}

// ── Toggle Card ─────────────────────────────────────────────────
function ToggleCard({ active, onToggle, title, sub, price, disabled, locked }) {
  return (
    <div onClick={disabled||locked ? undefined : onToggle} style={{
      display:"flex", alignItems:"center", gap:12,
      padding:"11px 14px", border:"1.5px solid",
      borderColor: locked ? "#1e3a24" : disabled ? "#181b22" : active ? "#d4a820" : "#1e2130",
      borderRadius:6,
      background: locked ? "rgba(74,222,128,0.04)" : active ? "rgba(212,168,32,0.05)" : "transparent",
      opacity: disabled ? 0.35 : 1,
      cursor: disabled||locked ? "default" : "pointer",
      transition:"all 0.18s"
    }}>
      <div style={{
        width:18, height:18, borderRadius:4, flexShrink:0,
        border:"2px solid", borderColor: locked ? "#4ade80" : active ? "#d4a820" : "#2a2d36",
        background: locked ? "#4ade80" : active ? "#d4a820" : "transparent",
        display:"flex", alignItems:"center", justifyContent:"center", transition:"all 0.15s"
      }}>
        {(active||locked) && <span style={{ fontSize:10, color:"#0f1117", fontWeight:800 }}>✓</span>}
      </div>
      <div style={{ flex:1 }}>
        <div style={{ fontSize:12.5, fontWeight:600, color: locked?"#4ade80":"#ddd" }}>{title}</div>
        {sub && <div style={{ fontSize:11, color:"#555", marginTop:2 }}>{sub}</div>}
      </div>
      {price && (
        <div style={{ fontSize:12, fontWeight:700, whiteSpace:"nowrap",
          color: locked?"#4ade80" : active ? "#d4a820" : "#444" }}>
          {price}
        </div>
      )}
    </div>
  );
}

// ── Invoice Section Header ───────────────────────────────────────
function SecHdr({ n, title }) {
  return (
    <div style={{ display:"flex", alignItems:"center", gap:8, padding:"12px 0 6px" }}>
      <div style={{
        width:20, height:20, borderRadius:"50%", background:"#141720",
        border:"1px solid #252830", display:"flex", alignItems:"center", justifyContent:"center",
        fontSize:9.5, fontWeight:700, color:"#d4a820", flexShrink:0
      }}>{n}</div>
      <div style={{ fontSize:9.5, letterSpacing:"0.15em", textTransform:"uppercase", color:"#d4a820", fontWeight:600 }}>
        {title}
      </div>
      <div style={{ flex:1, height:1, background:"#141720" }}/>
    </div>
  );
}

// ── Invoice Line ─────────────────────────────────────────────────
function InvLine({ label, basis, amount, type="normal", show=true }) {
  if (!show) return null;
  const colors = { normal:"#d4a820", tbc:"#d97706", included:"#4ade80", waived:"#4ade80", na:"#444" };
  const texts = { included:"Included", waived:"Waived", na:"N/A" };
  const amtText = texts[type] || (amount==null?"TBC":usd(amount));
  return (
    <div style={{
      display:"flex", justifyContent:"space-between", alignItems:"flex-start",
      padding:"8px 0", borderBottom:"1px solid #0f1117", gap:10
    }}>
      <div style={{ flex:1 }}>
        <div style={{ fontSize:12, color:"#bbb" }}>{label}</div>
        {basis && <div style={{ fontSize:10.5, color: type==="tbc"?"#d97706":"#444", marginTop:2, fontStyle:"italic" }}>{basis}</div>}
      </div>
      <div style={{ fontSize:12.5, fontWeight:700, color:colors[type]||colors.normal, whiteSpace:"nowrap", minWidth:72, textAlign:"right" }}>
        {amtText}
      </div>
    </div>
  );
}

// ── MAIN ────────────────────────────────────────────────────────
export default function App() {
  const [companyType, setCompanyType] = useState("active");
  const [txnCount, setTxnCount]       = useState(80);
  const [revenue, setRevenue]         = useState(50000);
  const [hasStaff, setHasStaff]       = useState(false);
  const [fsReview, setFsReview]       = useState(false);
  const [hasBacklog, setHasBacklog]   = useState(false);

  const isDormant = companyType === "dormant"; // active = active/holding
  const txnTier   = getTxnTier(txnCount);
  const revTier   = getRevTier(revenue);

  const bookFee   = isDormant ? 0 : txnTier.fee;
  const auditFee  = isDormant ? DORMANT_AUDIT_FEE : revTier.fee;
  const bir51Fee  = FIXED.bir51;
  const empFee    = hasStaff ? FIXED.employer : 0;
  const fsFee     = fsReview ? FIXED.fsReview : 0;

  const bookTBC   = !isDormant && txnTier.fee === null;
  const auditTBC  = !isDormant && revTier.fee === null;
  const needAdvisor = bookTBC || auditTBC;

  const numericTotal = (bookFee||0) + (auditFee||0) + bir51Fee + empFee + fsFee;
  const totalDisplay = needAdvisor ? null : numericTotal;

  const serif = { fontFamily:"'DM Serif Display','Libre Baskerville',Georgia,serif" };

  return (
    <div style={{ minHeight:"100vh", background:"#070910", color:"#e8e4d8", fontFamily:"'DM Sans','Outfit',sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&family=DM+Sans:wght@300;400;500;600;700&display=swap');
        *{box-sizing:border-box;} input[type=range]{-webkit-appearance:none;appearance:none;}
        ::-webkit-scrollbar{width:4px;background:#0a0c10;}
        ::-webkit-scrollbar-thumb{background:#1e2130;border-radius:2px;}
        button{outline:none;} button:focus-visible{outline:2px solid #d4a820;}
      `}</style>

      {/* TOPBAR */}
      <div style={{ background:"#090b10", borderBottom:"1px solid #141720", padding:"11px 32px", display:"flex", justifyContent:"space-between", alignItems:"center" }}>
        <div style={{ ...serif, fontSize:15, color:"#d4a820" }}>One IBC Group</div>
        <div style={{ fontSize:9.5, letterSpacing:"0.2em", textTransform:"uppercase", color:"#333" }}>🇭🇰 HK Compliance</div>
      </div>

      {/* HERO */}
      <div style={{
        background:"linear-gradient(180deg,#0f1117 0%,#070910 100%)",
        borderBottom:"1px solid #141720", padding:"48px 32px 40px",
        textAlign:"center", position:"relative", overflow:"hidden"
      }}>
        <div style={{ position:"absolute", inset:0, background:"radial-gradient(ellipse 70% 60% at 50% -5%,rgba(184,134,11,0.16) 0%,transparent 70%)", pointerEvents:"none" }}/>
        <div style={{ display:"inline-block", border:"1px solid #b8860b", color:"#d4a820", fontSize:9, letterSpacing:"0.22em", textTransform:"uppercase", padding:"4px 16px", borderRadius:2, marginBottom:18 }}>
          Instant Price Estimator
        </div>
        <div style={{ ...serif, fontSize:"clamp(24px,4.5vw,42px)", lineHeight:1.2, marginBottom:12 }}>
          Your HK Compliance Cost,<br/>
          <em style={{color:"#d4a820"}}>Itemised to the Line</em>
        </div>
        <div style={{ color:"#555", fontSize:13, maxWidth:420, margin:"0 auto", lineHeight:1.8 }}>
          Select your company profile and drag the sliders. Your proforma invoice builds itself in real time.
        </div>
      </div>

      {/* GRID */}
      <div style={{ maxWidth:1080, margin:"0 auto", padding:"36px 24px 80px", display:"grid", gridTemplateColumns:"1fr 352px", gap:28, alignItems:"start" }}>

        {/* ── LEFT PANEL ─────────────────────────────────────── */}
        <div style={{ display:"flex", flexDirection:"column", gap:18 }}>

          {/* Company Profile */}
          <div style={{ background:"#0d0f16", border:"1px solid #181b24", borderRadius:8, padding:26 }}>
            <div style={{ fontSize:9.5, letterSpacing:"0.18em", textTransform:"uppercase", color:"#d4a820", fontWeight:600, marginBottom:20 }}>
              A.  Company Profile
            </div>

            {/* A1 type */}
            <div style={{ marginBottom:22 }}>
              <div style={{ fontSize:12, fontWeight:600, color:"#aaa", marginBottom:10 }}>A1 — Company Type</div>
              <Pills value={companyType} onChange={setCompanyType} options={[
                { value:"active",  label:"Active / Holding company" },
                { value:"dormant", label:"Dormant company"           },
              ]}/>
              <div style={{ fontSize:11, color:"#444", marginTop:8, lineHeight:1.6 }}>
                Active and holding companies follow the same fee structure.
              </div>
            </div>

            {/* DORMANT BANNER — shown only when dormant */}
            {isDormant && (
              <div style={{
                background:"linear-gradient(135deg,rgba(26,102,48,0.25),rgba(26,102,48,0.1))",
                border:"1.5px solid #2d6e3e", borderRadius:8, padding:"18px 20px", marginBottom:22
              }}>
                <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:10 }}>
                  <div style={{ width:28, height:28, borderRadius:"50%", background:"#1a6630", display:"flex", alignItems:"center", justifyContent:"center", fontSize:14, flexShrink:0 }}>✓</div>
                  <div style={{ ...serif, fontSize:16, color:"#4ade80" }}>Dormant Package</div>
                </div>
                <div style={{ fontSize:12.5, color:"#86efac", lineHeight:1.75, marginBottom:14 }}>
                  Audit fee <strong style={{color:"#4ade80"}}>waived</strong> for dormant companies.<br/>
                  You only pay: <strong style={{color:"#4ade80"}}>NIL PTR (BIR51) + Annual Return (NAR1)</strong>.
                </div>
                <div style={{
                  background:"rgba(74,222,128,0.1)", borderRadius:6,
                  padding:"10px 16px", display:"flex", justifyContent:"space-between", alignItems:"center"
                }}>
                  <span style={{ fontSize:12, color:"#86efac" }}>Total annual compliance cost</span>
                  <span style={{ ...serif, fontSize:22, color:"#4ade80", fontWeight:400 }}>US$390 / yr</span>
                </div>
                <div style={{ fontSize:10.5, color:"#4a7a56", marginTop:10, lineHeight:1.6 }}>
                  Bookkeeping and statutory audit are not required for declared dormant companies. BIR51 (NIL PTR) filing remains mandatory.
                </div>
              </div>
            )}

            {/* A2 Transactions — hidden for dormant */}
            {!isDormant && (
              <div style={{ marginBottom:22 }}>
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:10 }}>
                  <div style={{ fontSize:12, fontWeight:600, color:"#aaa" }}>A2 — Annual Transactions</div>
                  <div style={{ background:"#141720", borderRadius:16, padding:"2px 10px", fontSize:10.5, color:"#d4a820", fontWeight:600 }}>{txnCount}</div>
                </div>
                <Slider value={txnCount} min={0} max={499} onChange={setTxnCount}
                  formatLabel={v => { const t=getTxnTier(v); return t.fee ? `${t.label}  →  ${usd(t.fee)}` : `${t.label}  →  advisor quote`; }}
                />
                {bookTBC && (
                  <div style={{ marginTop:10, fontSize:11.5, color:"#d97706", padding:"8px 12px", background:"rgba(217,119,6,0.08)", borderRadius:4, borderLeft:"3px solid #d97706" }}>
                    ⚠ 450+ transactions — bookkeeping fee TBC, advisor will confirm.
                  </div>
                )}
              </div>
            )}

            {/* A3 Revenue — hidden for dormant */}
            {!isDormant && (
              <div>
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:10 }}>
                  <div style={{ fontSize:12, fontWeight:600, color:"#aaa" }}>A3 — Annual Revenue (USD)</div>
                  <div style={{ background:"#141720", borderRadius:16, padding:"2px 10px", fontSize:10.5, color:"#d4a820", fontWeight:600 }}>
                    {revenue===0 ? "US$0" : "US$"+revenue.toLocaleString()}
                  </div>
                </div>
                <Slider value={revenue} min={0} max={640999} onChange={setRevenue} log={true}
                  formatLabel={v => { const t=getRevTier(v); return t.fee ? `${t.label}  →  Audit ${usd(t.fee)}` : `${t.label}  →  advisor quote`; }}
                />
                {auditTBC && (
                  <div style={{ marginTop:10, fontSize:11.5, color:"#d97706", padding:"8px 12px", background:"rgba(217,119,6,0.08)", borderRadius:4, borderLeft:"3px solid #d97706" }}>
                    ⚠ Revenue ≥ US$641,000 — audit fee confirmed after CPA scope review.
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Tax & Add-ons */}
          <div style={{ background:"#0d0f16", border:"1px solid #181b24", borderRadius:8, padding:26 }}>
            <div style={{ fontSize:9.5, letterSpacing:"0.18em", textTransform:"uppercase", color:"#d4a820", fontWeight:600, marginBottom:20 }}>
              B.  Tax Filing & Add-ons
            </div>
            <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
              <ToggleCard locked title="Profits Tax Return (BIR51)" sub={isDormant?"NIL PTR — mandatory for dormant companies":"Mandatory annual filing — Inland Revenue Dept"} price="US$390"/>
              <ToggleCard locked title="Annual Return (NAR1)" sub="Companies Registry — included in all packages" price="Included"/>
              {!isDormant && <>
                <ToggleCard active={hasStaff} onToggle={()=>setHasStaff(!hasStaff)} title="Employer's Return" sub="Required if you have staff or directors on payroll" price="+US$260"/>
                <ToggleCard active={fsReview} onToggle={()=>setFsReview(!fsReview)} title="Financial Statement Review" sub="For client-prepared accounts — CPA verification" price="+US$250"/>
                <ToggleCard active={hasBacklog} onToggle={()=>setHasBacklog(!hasBacklog)} title="Catch-up / Backlog Bookkeeping" sub="Incomplete or historical records require catch-up work" price="+ TBC"/>
              </>}
            </div>
          </div>

          {/* Audit warning — only for active */}
          {!isDormant && (
            <div style={{ padding:"13px 16px", background:"rgba(192,57,43,0.07)", border:"1px solid rgba(192,57,43,0.25)", borderLeft:"4px solid #c0392b", borderRadius:4 }}>
              <div style={{ fontSize:10, fontWeight:700, letterSpacing:"0.12em", textTransform:"uppercase", color:"#c0392b", marginBottom:5 }}>⚠ HK Mandatory Audit</div>
              <div style={{ fontSize:12, color:"#c07060", lineHeight:1.7 }}>
                Unlike Singapore, Hong Kong has <strong style={{color:"#e08070"}}>no audit exemption</strong> for active companies. Statutory audit is mandatory annually, regardless of size or revenue.
              </div>
            </div>
          )}
        </div>

        {/* ── RIGHT: INVOICE PANEL ───────────────────────────── */}
        <div style={{ position:"sticky", top:24 }}>
          <div style={{ background:"#090b10", border:"1px solid #141720", borderRadius:8, overflow:"hidden", boxShadow:"0 24px 64px rgba(0,0,0,0.5)" }}>

            {/* Invoice header */}
            <div style={{ background:"#0d0f16", padding:"18px 22px", borderBottom:"1px solid #141720" }}>
              <div style={{ fontSize:9, letterSpacing:"0.2em", textTransform:"uppercase", color:"#444", marginBottom:4 }}>One IBC Group · Hong Kong</div>
              <div style={{ ...serif, fontSize:18, color:"#e8e4d8" }}>Proforma Invoice</div>
              <div style={{ fontSize:10, color:"#333", marginTop:3 }}>Estimated Annual Compliance Fees · USD</div>
            </div>

            {/* Body */}
            <div style={{ padding:"4px 22px 18px" }}>

              {/* ── DORMANT: simplified invoice ── */}
              {isDormant ? (
                <>
                  <div style={{ margin:"16px 0 8px", padding:"16px", background:"rgba(26,102,48,0.15)", border:"1px solid #2d6e3e", borderRadius:6 }}>
                    <div style={{ fontSize:9.5, letterSpacing:"0.15em", textTransform:"uppercase", color:"#4ade80", fontWeight:600, marginBottom:10 }}>
                      Dormant Package
                    </div>
                    <div style={{ display:"flex", justifyContent:"space-between", padding:"7px 0", borderBottom:"1px solid rgba(74,222,128,0.1)" }}>
                      <div>
                        <div style={{ fontSize:12, color:"#86efac" }}>NIL Profits Tax Return (BIR51)</div>
                        <div style={{ fontSize:10.5, color:"#4a7a56", fontStyle:"italic", marginTop:2 }}>Inland Revenue Dept — mandatory</div>
                      </div>
                      <div style={{ fontSize:13, fontWeight:700, color:"#4ade80" }}>US$390</div>
                    </div>
                    <div style={{ display:"flex", justifyContent:"space-between", padding:"7px 0", borderBottom:"1px solid rgba(74,222,128,0.1)" }}>
                      <div>
                        <div style={{ fontSize:12, color:"#86efac" }}>Annual Return (NAR1)</div>
                        <div style={{ fontSize:10.5, color:"#4a7a56", fontStyle:"italic", marginTop:2 }}>Companies Registry — mandatory</div>
                      </div>
                      <div style={{ fontSize:13, fontWeight:700, color:"#4ade80" }}>Included</div>
                    </div>
                    <div style={{ display:"flex", justifyContent:"space-between", padding:"7px 0" }}>
                      <div>
                        <div style={{ fontSize:12, color:"#86efac", textDecoration:"line-through", opacity:0.5 }}>Statutory Audit</div>
                        <div style={{ fontSize:10.5, color:"#4ade80", fontStyle:"italic", marginTop:2 }}>✓ Waived for dormant companies</div>
                      </div>
                      <div style={{ fontSize:13, fontWeight:700, color:"#4ade80", textDecoration:"line-through", opacity:0.5 }}>Waived</div>
                    </div>
                  </div>

                  {/* Dormant total */}
                  <div style={{ background:"#0d0f16", border:"1px solid #1e3a24", borderRadius:6, padding:"16px 18px", marginTop:8 }}>
                    <div style={{ fontSize:9, letterSpacing:"0.16em", textTransform:"uppercase", color:"#4a7a56", marginBottom:8 }}>Total Annual Cost</div>
                    <div style={{ ...serif, fontSize:38, lineHeight:1, color:"#4ade80" }}>US$390</div>
                    <div style={{ fontSize:10, color:"#4a7a56", marginTop:8, lineHeight:1.7 }}>
                      NIL PTR + NAR1 only. No audit fee.
                    </div>
                  </div>
                </>
              ) : (
                /* ── ACTIVE / HOLDING invoice ── */
                <>
                  <SecHdr n="1" title="Bookkeeping & Accounting"/>
                  <InvLine
                    label="Bookkeeping & Accounting"
                    basis={bookTBC ? "450+ txn — advisor will confirm" : txnTier.label}
                    amount={bookFee}
                    type={bookTBC ? "tbc" : "normal"}
                  />

                  <SecHdr n="2" title="Statutory Audit"/>
                  <InvLine
                    label="Statutory Audit (CPA-certified)"
                    basis={auditTBC ? "US$641K+ — CPA scope review" : revTier.label}
                    amount={auditFee}
                    type={auditTBC ? "tbc" : "normal"}
                  />

                  <SecHdr n="3" title="Tax & Compliance Filing"/>
                  <InvLine label="Profits Tax Return (BIR51)" basis="Inland Revenue Dept — mandatory" amount={bir51Fee}/>
                  <InvLine label="Annual Return (NAR1)" basis="Companies Registry — mandatory" type="included"/>
                  <InvLine label="Employer's Return" basis="Inland Revenue Dept" amount={FIXED.employer} show={hasStaff}/>

                  {(fsReview||hasBacklog) && <SecHdr n="4" title="Add-on Services"/>}
                  <InvLine label="Financial Statement Review" basis="CPA review — client-prepared accounts" amount={FIXED.fsReview} show={fsReview}/>
                  <InvLine label="Catch-up / Backlog Bookkeeping" basis="Scope confirmed after records review" type="tbc" show={hasBacklog}/>

                  {/* Sub-totals */}
                  <div style={{ marginTop:12, paddingTop:12, borderTop:"1px solid #141720" }}>
                    {[
                      ["Accounting", bookTBC?"TBC":usd(bookFee)],
                      ["Audit",      auditTBC?"TBC":usd(auditFee)],
                      ["Tax & Compliance", usd(bir51Fee+empFee)],
                      ...(fsReview?[["Add-ons", usd(fsFee)]]: []),
                    ].map(([lbl,val])=>(
                      <div key={lbl} style={{ display:"flex", justifyContent:"space-between", fontSize:11, color:"#444", marginBottom:5 }}>
                        <span>{lbl}</span>
                        <span style={{ color: val==="TBC"?"#d97706":"#666" }}>{val}</span>
                      </div>
                    ))}
                  </div>

                  <div style={{ height:1, background:"#1e2130", margin:"12px 0 14px" }}/>

                  {/* Grand total */}
                  <div style={{ background:"#0d0f16", border:"1px solid #1e2130", borderRadius:6, padding:"16px 18px" }}>
                    <div style={{ fontSize:9, letterSpacing:"0.16em", textTransform:"uppercase", color:"#444", marginBottom:8 }}>Estimated Total (Annual)</div>
                    <div style={{ ...serif, fontSize:38, lineHeight:1 }}>
                      <AnimatedTotal value={totalDisplay}/>
                    </div>
                    {hasBacklog && <div style={{ fontSize:11, color:"#d97706", marginTop:6, fontStyle:"italic" }}>+ TBC (catch-up bookkeeping)</div>}
                    {needAdvisor && <div style={{ fontSize:11, color:"#d97706", marginTop:6, fontStyle:"italic" }}>+ TBC items — advisor will confirm</div>}
                    <div style={{ fontSize:10, color:"#333", marginTop:10, borderTop:"1px solid #141720", paddingTop:10, lineHeight:1.7 }}>
                      Incl. Bookkeeping · Audit · BIR51 · NAR1{hasStaff?" · Employer's Return":""}{fsReview?" · FS Review":""}
                    </div>
                  </div>
                </>
              )}

              {/* CTA */}
              <button style={{
                width:"100%", padding:"13px", marginTop:14,
                background: isDormant ? "#1a6630" : needAdvisor ? "#141720" : "#d4a820",
                color: isDormant ? "#4ade80" : needAdvisor ? "#d4a820" : "#0f1117",
                border: isDormant ? "1.5px solid #2d6e3e" : needAdvisor ? "1.5px solid #d4a820" : "none",
                borderRadius:4, fontSize:12, fontWeight:700, letterSpacing:"0.08em",
                textTransform:"uppercase", cursor:"pointer", fontFamily:"inherit", transition:"all 0.2s"
              }}>
                {isDormant ? "Get Dormant Package →" : needAdvisor ? "Request Custom Quote →" : "Get My Free Quote →"}
              </button>

              <div style={{ fontSize:10, color:"#2a2d36", textAlign:"center", marginTop:12, lineHeight:1.7 }}>
                Indicative only · Final pricing confirmed after records review<br/>No engagement fee to get a quote
              </div>
            </div>

            {/* Credentials */}
            <div style={{
              borderTop:"1px solid #141720", background:"#070910",
              padding:"14px 22px", display:"grid", gridTemplateColumns:"1fr 1fr", gap:10
            }}>
              {[["500+","HK Companies"],["CPA/ACCA","Certified Team"],["30+","Jurisdictions"],["4.8 ★","Client Rating"]].map(([v,l])=>(
                <div key={l} style={{ textAlign:"center" }}>
                  <div style={{ ...serif, fontSize:15, color:"#d4a820" }}>{v}</div>
                  <div style={{ fontSize:9.5, color:"#333", marginTop:1 }}>{l}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
