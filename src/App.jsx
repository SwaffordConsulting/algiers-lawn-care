import { useState, useRef } from "react";

const C = {
  green:     "#31A73B",
  greenDk:   "#279030",
  greenLight:"#e8f7ea",
  black:     "#282828",
  white:     "#ffffff",
  offwhite:  "#f9f9f9",
  gray:      "#6b7280",
  lightGray: "#f3f4f6",
  rule:      "#e5e7eb",
  gold:      "#D4A017",
};

const FORMSPREE_URL = "https://formspree.io/f/xqeobpnq";
const CALENDLY_URL  = "https://calendly.com/gregory-cultureofcleanliness/ai-consulting-discovery-call";
const PHONE         = "504-333-2472";
const YT_VIDEO_ID   = "lKQ3jjZC0TQ";

const SERVICES = [
  "🪖 General Meyer Military Cut",
  "⚓ Algiers Pointee — Edges & Trimming",
  "✂️ The Cut Off — Hedge & Yard Cleanup",
  "💨 The Levee Wind Finish",
  "Full Service (All of the Above)",
  "Recurring Maintenance",
  "Commercial Property",
  "Not Sure — Just Need a Quote",
];

const LOT_SIZES = [
  "Under 2,000 sq ft",
  "2,000 – 4,000 sq ft",
  "4,000 – 6,000 sq ft",
  "6,000 – 8,000 sq ft",
  "8,000 – 12,000 sq ft",
  "12,000+ sq ft",
  "Not Sure",
];

const AREAS   = ["Algiers — West Bank","Gretna / Harvey","Marrero / Westwego","East Bank New Orleans","Other"];
const SOURCES = ["Instagram","Facebook","TikTok","Referral","Drove By","Google","Other"];

// ── Quote engine (market rates) ───────────────────────────────────────────
const BASE = {
  "Under 2,000 sq ft":     40,
  "2,000 – 4,000 sq ft":   60,
  "4,000 – 6,000 sq ft":   80,
  "6,000 – 8,000 sq ft":  105,
  "8,000 – 12,000 sq ft": 140,
  "12,000+ sq ft":         180,
  "Not Sure":               70,
};
const ADDON = {
  "🪖 General Meyer Military Cut":          0,
  "⚓ Algiers Pointee — Edges & Trimming": 25,
  "✂️ The Cut Off — Hedge & Yard Cleanup": 45,
  "💨 The Levee Wind Finish":               15,
  "Full Service (All of the Above)":        75,
  "Recurring Maintenance":                   0,
  "Commercial Property":                    65,
  "Not Sure — Just Need a Quote":            0,
};
const RECURRING_DISC = { "Yes — Weekly": 0.15, "Yes — Bi-Weekly": 0.10 };

function calcQuote(lot, service, recurring) {
  if(!lot || !service) return null;
  const base  = BASE[lot]    || 70;
  const addon = ADDON[service]|| 0;
  const disc  = RECURRING_DISC[recurring] || 0;
  const mid   = Math.round((base + addon) * (1 - disc));
  return { low: Math.round(mid*0.9), high: Math.round(mid*1.15), disc: Math.round(disc*100) };
}

// ── Storage ───────────────────────────────────────────────────────────────
const KEY = "alc_v4";
const getLeads  = () => { try { return JSON.parse(localStorage.getItem(KEY)||"[]"); } catch { return []; }};
const pushLead  = d  => { const a=getLeads(); a.unshift({...d,id:Date.now(),at:new Date().toISOString(),status:"New"}); localStorage.setItem(KEY,JSON.stringify(a)); };
const setStatus = (id,s) => { const a=getLeads().map(l=>l.id===id?{...l,status:s}:l); localStorage.setItem(KEY,JSON.stringify(a)); };

// ── Intake Form ───────────────────────────────────────────────────────────
function IntakeForm() {
  const [step, setStep]   = useState(1);
  const [form, setForm]   = useState({
    name:"", phone:"", email:"", area:"",
    propType:"", lotSize:"", service:"", recurring:"No",
    details:"", source:"", photoName:""
  });
  const [photoPreview, setPhotoPreview] = useState(null);
  const [done, setDone]   = useState(false);
  const [busy, setBusy]   = useState(false);
  const [err,  setErr]    = useState(null);
  const fileRef = useRef();
  const set = (k,v) => setForm(f=>({...f,[k]:v}));

  const quote = calcQuote(form.lotSize, form.service, form.recurring);

  const handlePhoto = (e) => {
    const file = e.target.files[0];
    if(!file) return;
    set("photoName", file.name);
    const reader = new FileReader();
    reader.onload = ev => setPhotoPreview(ev.target.result);
    reader.readAsDataURL(file);
  };

  const submit = async () => {
    setBusy(true); setErr(null);
    try {
      const payload = {
        ...form,
        _business: "Algiers Lawn Care",
        estimatedQuote: quote ? `$${quote.low} – $${quote.high}` : "TBD",
        hasPhoto: !!photoPreview,
      };
      const res = await fetch(FORMSPREE_URL,{
        method:"POST",
        headers:{"Content-Type":"application/json","Accept":"application/json"},
        body:JSON.stringify(payload),
      });
      if(res.ok){ pushLead(payload); setDone(true); }
      else setErr("Something went wrong. Please try again.");
    } catch { setErr("Something went wrong. Please try again."); }
    finally { setBusy(false); }
  };

  if(done) return (
    <div style={{textAlign:"center",padding:"2.5rem 1rem"}}>
      <div style={{fontSize:"3rem",marginBottom:"0.75rem"}}>✅</div>
      <h2 style={{fontFamily:"Georgia,serif",fontSize:"1.7rem",color:C.black,margin:"0 0 0.75rem"}}>Request Received!</h2>
      {quote && (
        <div style={{background:C.greenLight,border:`2px solid ${C.green}`,borderRadius:10,padding:"1rem 1.25rem",maxWidth:280,margin:"0 auto 1.25rem"}}>
          <p style={{margin:"0 0 0.25rem",fontSize:"0.72rem",fontWeight:800,letterSpacing:"0.08em",textTransform:"uppercase",color:C.green}}>Your Estimated Quote</p>
          <p style={{margin:0,fontSize:"1.8rem",fontWeight:900,color:C.black}}>${quote.low} – ${quote.high}</p>
          {quote.disc>0 && <p style={{margin:"0.25rem 0 0",fontSize:"0.78rem",color:C.green,fontWeight:700}}>{quote.disc}% recurring discount applied</p>}
          <p style={{margin:"0.35rem 0 0",fontSize:"0.75rem",color:C.gray,fontStyle:"italic"}}>Eric will confirm the final price after reviewing your property.</p>
        </div>
      )}
      <p style={{color:C.gray,fontSize:"0.95rem",lineHeight:1.7,maxWidth:360,margin:"0 auto 1.5rem"}}>
        Eric will reach out within 24 hours to confirm. Book your call now to lock in your slot.
      </p>
      <a href={CALENDLY_URL} target="_blank" rel="noreferrer"
        style={{display:"inline-block",background:C.green,color:C.white,padding:"1rem 2rem",borderRadius:7,fontSize:"1rem",fontWeight:800,textDecoration:"none",marginBottom:"0.75rem",boxShadow:`0 4px 14px ${C.green}50`}}>
        📅 Book Your Free Estimate →
      </a>
      <p style={{fontSize:"0.78rem",color:C.gray,margin:"0 0 1.25rem"}}>15 min · Free · No obligation</p>
      <a href={`tel:${PHONE}`} style={{display:"block",fontSize:"1rem",fontWeight:900,color:C.green,textDecoration:"none"}}>📞 {PHONE}</a>
    </div>
  );

  const inp = {width:"100%",padding:"0.72rem 1rem",borderRadius:6,border:`1.5px solid ${C.rule}`,fontSize:"0.95rem",fontFamily:"inherit",background:'#D4A017',color:C.black,outline:"none",boxSizing:"border-box"};
  const lbl = {display:"block",fontSize:"0.72rem",fontWeight:700,letterSpacing:"0.08em",textTransform:"uppercase",color:C.gray,marginBottom:"0.35rem"};
  const btn = p => ({padding:p?"0.85rem 2rem":"0.7rem 1.4rem",borderRadius:6,border:"none",cursor:"pointer",fontSize:"0.95rem",fontWeight:800,background:p?C.green:"transparent",color:p?C.white:C.gray});

  return (
    <div>
      {/* Progress */}
      <div style={{display:"flex",gap:4,marginBottom:"1.75rem"}}>
        {[1,2,3].map(s=><div key={s} style={{flex:1,height:5,borderRadius:4,background:s<=step?C.green:C.rule,transition:"background 0.3s"}} />)}
      </div>

      {/* Live quote banner */}
      {quote && (
        <div style={{background:C.greenLight,border:`1.5px solid ${C.green}`,borderRadius:8,padding:"0.75rem 1rem",marginBottom:"1rem",display:"flex",alignItems:"center",justifyContent:"space-between"}}>
          <div>
            <div style={{fontSize:"0.7rem",fontWeight:800,letterSpacing:"0.08em",textTransform:"uppercase",color:C.green}}>Estimated Quote</div>
            <div style={{fontSize:"1.3rem",fontWeight:900,color:C.black}}>${quote.low} – ${quote.high}</div>
          </div>
          {quote.disc>0 && <div style={{background:C.green,color:C.white,borderRadius:20,padding:"0.25rem 0.65rem",fontSize:"0.72rem",fontWeight:800}}>{quote.disc}% off</div>}
        </div>
      )}

      {/* STEP 1 — Contact */}
      {step===1 && (
        <div style={{display:"flex",flexDirection:"column",gap:"1.1rem"}}>
          <p style={{margin:"0 0 0.25rem",color:C.gray,fontSize:"0.9rem"}}>Let's get your info.</p>
          <div><label style={lbl}>Full Name</label><input style={inp} value={form.name} onChange={e=>set("name",e.target.value)} placeholder="Your full name" /></div>
          <div><label style={lbl}>Phone Number</label><input style={inp} type="tel" value={form.phone} onChange={e=>set("phone",e.target.value)} placeholder="504-000-0000" /></div>
          <div><label style={lbl}>Email (optional)</label><input style={inp} type="email" value={form.email} onChange={e=>set("email",e.target.value)} placeholder="your@email.com" /></div>
          <div>
            <label style={lbl}>Your Area</label>
            <select style={inp} value={form.area} onChange={e=>set("area",e.target.value)}>
              <option value="">Select your area...</option>
              {AREAS.map(a=><option key={a}>{a}</option>)}
            </select>
          </div>
          <div style={{display:"flex",justifyContent:"flex-end"}}>
            <button style={{...btn(true),opacity:(!form.name||!form.phone)?0.5:1}} onClick={()=>{if(form.name&&form.phone)setStep(2);}}>Continue →</button>
          </div>
        </div>
      )}

      {/* STEP 2 — Property & Quote */}
      {step===2 && (
        <div style={{display:"flex",flexDirection:"column",gap:"1.1rem"}}>
          <p style={{margin:"0 0 0.25rem",color:C.gray,fontSize:"0.9rem"}}>Tell me about the property.</p>

          <div>
            <label style={lbl}>Property Type</label>
            <select style={inp} value={form.propType} onChange={e=>set("propType",e.target.value)}>
              <option value="">Select one...</option>
              {["Residential — Small Yard","Residential — Large Yard","Commercial Property","Rental Property","HOA / Community","Vacant Lot"].map(p=><option key={p}>{p}</option>)}
            </select>
          </div>

          <div>
            <label style={lbl}>Approximate Lot Size</label>
            <select style={inp} value={form.lotSize} onChange={e=>set("lotSize",e.target.value)}>
              <option value="">Select lot size...</option>
              {LOT_SIZES.map(s=><option key={s}>{s}</option>)}
            </select>
            <p style={{margin:"0.3rem 0 0",fontSize:"0.75rem",color:C.gray,fontStyle:"italic"}}>Not sure? Check your property records or Zillow listing.</p>
          </div>

          <div>
            <label style={lbl}>Service Needed</label>
            <select style={inp} value={form.service} onChange={e=>set("service",e.target.value)}>
              <option value="">Select one...</option>
              {SERVICES.map(s=><option key={s}>{s}</option>)}
            </select>
          </div>

          <div>
            <label style={lbl}>Recurring Service?</label>
            <select style={inp} value={form.recurring} onChange={e=>set("recurring",e.target.value)}>
              <option value="No">No — One-time visit</option>
              <option value="Yes — Weekly">Yes — Weekly (15% off)</option>
              <option value="Yes — Bi-Weekly">Yes — Bi-Weekly (10% off)</option>
            </select>
          </div>

          {/* Photo upload */}
          <div>
            <label style={lbl}>Upload a Photo of Your Yard (optional)</label>
            <div
              onClick={()=>fileRef.current?.click()}
              style={{border:`2px dashed ${photoPreview?C.green:C.rule}`,borderRadius:8,padding:"1.25rem",textAlign:"center",cursor:"pointer",background:photoPreview?C.greenLight:C.lightGray,transition:"all 0.2s"}}>
              {photoPreview ? (
                <div>
                  <img src={photoPreview} alt="yard" style={{width:"100%",maxHeight:160,objectFit:"cover",borderRadius:6,marginBottom:"0.5rem"}} />
                  <p style={{margin:0,fontSize:"0.78rem",color:C.green,fontWeight:700}}>✓ Photo uploaded</p>
                </div>
              ) : (
                <div>
                  <div style={{fontSize:"1.75rem",marginBottom:"0.35rem"}}>📸</div>
                  <p style={{margin:0,fontSize:"0.85rem",color:C.gray,fontWeight:600}}>Tap to upload a photo</p>
                  <p style={{margin:"0.2rem 0 0",fontSize:"0.75rem",color:C.gray}}>Helps Eric give you the most accurate quote</p>
                </div>
              )}
            </div>
            <input ref={fileRef} type="file" accept="image/*" capture="environment" onChange={handlePhoto} style={{display:"none"}} />
          </div>

          <div>
            <label style={lbl}>Additional Details</label>
            <textarea style={{...inp,minHeight:80,resize:"vertical"}} value={form.details} onChange={e=>set("details",e.target.value)} placeholder="Gate access, overgrown areas, specific concerns..." />
          </div>

          <div style={{display:"flex",justifyContent:"space-between"}}>
            <button style={btn(false)} onClick={()=>setStep(1)}>← Back</button>
            <button style={{...btn(true),opacity:!form.service?0.5:1}} onClick={()=>{if(form.service)setStep(3);}}>Continue →</button>
          </div>
        </div>
      )}

      {/* STEP 3 — Review & Submit */}
      {step===3 && (
        <div style={{display:"flex",flexDirection:"column",gap:"1.1rem"}}>
          <p style={{margin:"0 0 0.25rem",color:C.gray,fontSize:"0.9rem"}}>One last thing.</p>
          <div>
            <label style={lbl}>How did you find us?</label>
            <select style={inp} value={form.source} onChange={e=>set("source",e.target.value)}>
              <option value="">Select one...</option>
              {SOURCES.map(s=><option key={s}>{s}</option>)}
            </select>
          </div>

          {/* Summary card */}
          <div style={{background:C.lightGray,borderRadius:8,padding:"1rem 1.1rem",border:`1px solid ${C.rule}`}}>
            <p style={{margin:"0 0 0.5rem",fontSize:"0.72rem",fontWeight:700,letterSpacing:"0.08em",textTransform:"uppercase",color:C.gray}}>Your Request Summary</p>
            <p style={{margin:"0.2rem 0",fontSize:"0.9rem",color:C.black}}><strong>{form.name}</strong> · {form.phone}</p>
            <p style={{margin:"0.2rem 0",fontSize:"0.9rem",color:C.black}}>{form.area}{form.propType?` · ${form.propType}`:""}</p>
            <p style={{margin:"0.2rem 0",fontSize:"0.9rem",color:C.black}}>{form.lotSize}</p>
            <p style={{margin:"0.2rem 0",fontSize:"0.9rem",color:C.green,fontWeight:800}}>{form.service}</p>
            <p style={{margin:"0.2rem 0",fontSize:"0.85rem",color:C.gray}}>{form.recurring}</p>
            {photoPreview && <p style={{margin:"0.2rem 0",fontSize:"0.85rem",color:C.green,fontWeight:700}}>📸 Photo attached</p>}
            {quote && (
              <div style={{marginTop:"0.6rem",paddingTop:"0.6rem",borderTop:`1px solid ${C.rule}`}}>
                <p style={{margin:0,fontSize:"0.75rem",fontWeight:700,color:C.gray,letterSpacing:"0.06em",textTransform:"uppercase"}}>Estimated Quote</p>
                <p style={{margin:"0.15rem 0 0",fontSize:"1.2rem",fontWeight:900,color:C.black}}>${quote.low} – ${quote.high}</p>
                {quote.disc>0 && <p style={{margin:"0.1rem 0 0",fontSize:"0.75rem",color:C.green,fontWeight:700}}>{quote.disc}% recurring discount applied</p>}
              </div>
            )}
          </div>

          {err && <p style={{color:"#dc2626",fontSize:"0.88rem",margin:0}}>{err}</p>}
          <div style={{display:"flex",justifyContent:"space-between"}}>
            <button style={btn(false)} onClick={()=>setStep(2)}>← Back</button>
            <button style={{...btn(true),background:busy?"#999":C.green}} onClick={submit} disabled={busy}>
              {busy?"Sending...":"Get My Free Estimate ✓"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Dashboard ─────────────────────────────────────────────────────────────
const STATUS_STYLE = {
  "New":       {bg:"#dcfce7",fg:"#166534"},
  "Contacted": {bg:"#fef9c3",fg:"#854d0e"},
  "Scheduled": {bg:"#dbeafe",fg:"#1d4ed8"},
  "Completed": {bg:"#f0fdf4",fg:"#166534"},
  "No Answer": {bg:"#fee2e2",fg:"#991b1b"},
};

function Dashboard({onBack}) {
  const [leads, setLeads]   = useState(getLeads());
  const [filter, setFilter] = useState("All");
  const refresh = () => setLeads(getLeads());
  const statuses = ["New","Contacted","Scheduled","Completed","No Answer"];
  const visible  = filter==="All"?leads:leads.filter(l=>l.status===filter);
  const counts   = statuses.reduce((a,s)=>({...a,[s]:leads.filter(l=>l.status===s).length}),{});

  return (
    <div>
      <div style={{display:"flex",alignItems:"center",gap:"1rem",marginBottom:"1.5rem"}}>
        <button onClick={onBack} style={{background:"none",border:"none",cursor:"pointer",color:C.gray,fontSize:"0.85rem",padding:0}}>← Back</button>
        <h2 style={{margin:0,fontFamily:"Georgia,serif",fontSize:"1.3rem",color:C.black}}>Job Requests</h2>
        <span style={{marginLeft:"auto",fontSize:"0.78rem",color:C.gray}}>{leads.length} total</span>
      </div>
      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(80px,1fr))",gap:6,marginBottom:"1.25rem"}}>
        {statuses.map(s=>(
          <div key={s} style={{background:STATUS_STYLE[s].bg,borderRadius:7,padding:"0.5rem",textAlign:"center"}}>
            <div style={{fontSize:"1.4rem",fontWeight:700,color:STATUS_STYLE[s].fg}}>{counts[s]}</div>
            <div style={{fontSize:"0.65rem",color:STATUS_STYLE[s].fg,fontWeight:700}}>{s}</div>
          </div>
        ))}
      </div>
      <div style={{display:"flex",gap:5,flexWrap:"wrap",marginBottom:"1rem"}}>
        {["All",...statuses].map(f=>(
          <button key={f} onClick={()=>setFilter(f)} style={{padding:"0.3rem 0.8rem",borderRadius:20,border:"none",cursor:"pointer",fontSize:"0.77rem",fontWeight:700,background:filter===f?C.green:C.lightGray,color:filter===f?C.white:C.gray}}>{f}</button>
        ))}
      </div>
      {visible.length===0?(
        <div style={{textAlign:"center",padding:"3rem 1rem",color:C.gray}}>
          <p style={{fontSize:"2rem",margin:"0 0 0.5rem"}}>📋</p>
          <p style={{fontSize:"0.88rem"}}>No requests yet.</p>
        </div>
      ):(
        <div style={{display:"flex",flexDirection:"column",gap:8}}>
          {visible.map(lead=>(
            <div key={lead.id} style={{background:'#D4A017',border:`1px solid ${C.rule}`,borderRadius:9,padding:"1rem 1.1rem"}}>
              <div style={{display:"flex",alignItems:"flex-start",justifyContent:"space-between",gap:"0.75rem",flexWrap:"wrap"}}>
                <div style={{flex:1,minWidth:180}}>
                  <div style={{fontWeight:800,color:C.black,fontSize:"0.93rem"}}>{lead.name}</div>
                  <div style={{fontSize:"0.8rem",color:C.gray}}>{lead.phone}{lead.email?` · ${lead.email}`:""}</div>
                  <div style={{fontSize:"0.8rem",color:C.gray}}>{lead.area}{lead.propType?` · ${lead.propType}`:""}</div>
                  <div style={{fontSize:"0.8rem",color:C.gray}}>{lead.lotSize}</div>
                  <div style={{fontSize:"0.82rem",color:C.green,fontWeight:800,marginTop:"0.2rem"}}>{lead.service}</div>
                  {lead.estimatedQuote&&<div style={{fontSize:"0.82rem",color:C.black,fontWeight:700,marginTop:"0.15rem"}}>Est: {lead.estimatedQuote}</div>}
                  {lead.hasPhoto&&<div style={{fontSize:"0.78rem",color:C.green,marginTop:"0.15rem"}}>📸 Photo submitted</div>}
                  {lead.details&&<div style={{fontSize:"0.79rem",color:C.gray,marginTop:"0.3rem",fontStyle:"italic",lineHeight:1.5}}>"{lead.details.length>80?lead.details.slice(0,80)+"…":lead.details}"</div>}
                  <div style={{fontSize:"0.72rem",color:"#ccc",marginTop:"0.3rem"}}>via {lead.source||"Unknown"} · {new Date(lead.at).toLocaleDateString()}</div>
                </div>
                <div style={{display:"flex",flexDirection:"column",gap:5,alignItems:"flex-end"}}>
                  <span style={{padding:"0.22rem 0.65rem",borderRadius:20,fontSize:"0.7rem",fontWeight:700,background:STATUS_STYLE[lead.status]?.bg||C.lightGray,color:STATUS_STYLE[lead.status]?.fg||C.gray}}>{lead.status}</span>
                  <select value={lead.status} onChange={e=>{setStatus(lead.id,e.target.value);refresh();}} style={{fontSize:"0.76rem",padding:"0.28rem 0.45rem",borderRadius:5,border:`1px solid ${C.rule}`,background:C.lightGray,color:C.black,cursor:"pointer"}}>
                    {statuses.map(s=><option key={s}>{s}</option>)}
                  </select>
                  <a href={`tel:${lead.phone}`} style={{fontSize:"0.76rem",color:C.green,fontWeight:700,textDecoration:"none"}}>Call →</a>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Main App ──────────────────────────────────────────────────────────────
export default function App() {
  const [view, setView] = useState("landing");

  const collection = [
    { icon:"🪖", name:"General Meyer Military Cut", type:"Precision Lawn Service", items:["Sharp mowing patterns","Clean edging","Grass clipping removal","Professional finish"], quote:"Inspection-ready every time.", tag:"Precise. Sharp. Clean. No Frags." },
    { icon:"⚓", name:"Algiers Pointee", type:"Edges & Trimming Detail Service", items:["Sidewalk edging","Driveway edging","Tree ring cleanup","Shrub & perimeter trimming"], quote:"Where the details make the difference.", tag:"" },
    { icon:"✂️", name:"The Cut Off", type:"Hedge Trimming & Yard Cleanup", items:["Hedge shaping","Bush trimming","Leaf removal","Debris cleanup","Property refresh"], quote:"When it's time to cut it off and clean it up.", tag:"" },
    { icon:"💨", name:"The Levee Wind Finish", type:"Signature Finishing Touch", items:["Detailed blow-off after every cut","Clean sidewalks","Clean driveway","Clean curb line"], quote:"The finish that separates good from great.", tag:"" },
  ];

  return (
    <div style={{minHeight:"100vh",background:'#D4A017',fontFamily:"'Inter',system-ui,sans-serif"}}>

      {/* Nav */}
      <nav style={{background:C.black,padding:"0.85rem 1.25rem 0.6rem",display:"flex",alignItems:"flex-start",justifyContent:"space-between"}}>
        <div style={{display:"flex",flexDirection:"column",alignItems:"center",flex:1}}>
          <div style={{display:"flex",alignItems:"center",gap:"0.65rem",justifyContent:"center"}}>
            <div style={{width:38,height:38,borderRadius:6,background:C.green,flexShrink:0,display:"flex",alignItems:"center",justifyContent:"center",fontWeight:900,color:C.black,fontSize:"0.85rem",letterSpacing:"-0.5px"}}>
              EL
            </div>
            <div style={{textAlign:"center"}}>
              <div style={{color:C.white,fontWeight:900,fontSize:"0.95rem",letterSpacing:"0.04em",textTransform:"uppercase"}}>Algiers Lawn Care</div>
              <div style={{color:C.green,fontSize:"0.65rem",letterSpacing:"0.06em",fontWeight:700,textTransform:"uppercase"}}>Eric Landry Jr.</div>
            </div>
          </div>
          <div style={{color:"#9ca3af",fontSize:"0.68rem",fontWeight:600,letterSpacing:"0.08em",textTransform:"uppercase",marginTop:"0.3rem",textAlign:"center"}}>
            Algiers · West Bank · New Orleans
          </div>
        </div>
        <button onClick={()=>setView("dashboard")} style={{background:"none",border:"none",color:C.gray,fontSize:"0.72rem",cursor:"pointer",letterSpacing:"0.04em",marginLeft:"0.75rem",marginTop:"0.2rem",whiteSpace:"nowrap"}}>Admin</button>
      </nav>
      <div style={{height:4,background:C.green}} />

      <div style={{maxWidth:540,margin:"0 auto",padding:"0 1.1rem 3rem"}}>

        {view==="dashboard" && (
          <div style={{background:'#D4A017',borderRadius:12,padding:"1.5rem",marginTop:"1.5rem",boxShadow:"0 2px 16px #0000000d"}}>
            <Dashboard onBack={()=>setView("landing")} />
          </div>
        )}

        {view==="form" && (
          <div style={{background:'#D4A017',borderRadius:12,padding:"1.75rem 1.5rem",marginTop:"1.5rem",boxShadow:"0 4px 20px #00000012"}}>
            <button onClick={()=>setView("landing")} style={{background:"none",border:"none",color:C.gray,cursor:"pointer",fontSize:"0.82rem",padding:"0 0 1rem",display:"block"}}>← Back</button>
            <h2 style={{fontFamily:"Georgia,serif",fontSize:"1.55rem",color:C.black,margin:"0 0 0.4rem"}}>Get a Free Estimate</h2>
            <p style={{margin:"0 0 1.75rem",color:C.gray,fontSize:"0.9rem",lineHeight:1.6}}>No shortcuts. No excuses. Just results.</p>
            <IntakeForm />
          </div>
        )}

        {view==="landing" && (
          <>
            
            <div style={{position:"relative",width:"100%",height:"420px",overflow:"hidden",marginBottom:"1.5rem",borderRadius:"0 0 12px 12px",backgroundImage:"url(https://i.imgur.com/oKxVUus.jpeg)",backgroundSize:"cover",backgroundPosition:"center"}}>
              <div style={{position:"absolute",inset:0,background:"linear-gradient(to bottom, rgba(0,0,0,0.4) 0%, rgba(0,0,0,0.72) 100%)"}} />
              <div style={{position:"absolute",inset:0,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",textAlign:"center",padding:"1.5rem"}}>
                <div style={{display:"inline-block",background:C.green,borderRadius:4,padding:"0.25rem 0.85rem",fontSize:"0.7rem",fontWeight:800,color:C.white,letterSpacing:"0.12em",textTransform:"uppercase",marginBottom:"1rem"}}>
                  Algiers · West Bank · New Orleans
                </div>
                <h1 style={{margin:"0 0 0.5rem",fontFamily:"Georgia,serif",fontSize:"clamp(2rem,7vw,2.8rem)",color:C.white,lineHeight:1.1,fontStyle:"italic",textShadow:"0 2px 12px rgba(0,0,0,0.6)"}}>
                  No Shortcuts.<br/>No Excuses.<br/><span style={{color:C.green,fontStyle:"normal"}}>Just Results.</span>
                </h1>
                <p style={{color:"rgba(255,255,255,0.85)",fontSize:"0.95rem",margin:"0 0 1.5rem",fontWeight:600}}>
                  We don't cut corners. We build yards.
                </p>
                <button onClick={()=>setView("form")}
                  style={{background:C.green,color:C.white,border:"none",padding:"1rem 2.25rem",borderRadius:6,fontSize:"1rem",fontWeight:900,cursor:"pointer",textTransform:"uppercase",boxShadow:`0 4px 20px ${C.green}70`}}>
                  Get a Free Estimate
                </button>
                <a href={`tel:${PHONE}`} style={{color:"rgba(255,255,255,0.75)",fontSize:"0.82rem",marginTop:"0.75rem",textDecoration:"none",fontWeight:600}}>or call {PHONE}</a>
              </div>
            </div>

            {/* Menu */}
            <div style={{textAlign:"center",marginBottom:"1.25rem"}}>
              <div style={{fontSize:"0.72rem",fontWeight:800,letterSpacing:"0.14em",textTransform:"uppercase",color:C.gray,marginBottom:"0.3rem"}}>The</div>
              <div style={{fontSize:"1.6rem",fontWeight:900,color:C.black,letterSpacing:"0.05em",textTransform:"uppercase",lineHeight:1}}>Menu</div>
              <div style={{width:40,height:3,background:C.green,borderRadius:2,margin:"0.6rem auto 0"}} />
            </div>

            <div style={{display:"flex",flexDirection:"column",gap:12,marginBottom:"1.75rem"}}>
              {collection.map(s=>(
                <div key={s.name} style={{background:'#D4A017',border:`1.5px solid ${C.rule}`,borderRadius:10,overflow:"hidden",boxShadow:"0 1px 6px #0000000a"}}>
                  <div style={{background:C.black,padding:"0.85rem 1.1rem",display:"flex",alignItems:"center",gap:"0.75rem"}}>
                    <span style={{fontSize:"1.4rem"}}>{s.icon}</span>
                    <div>
                      <div style={{color:C.white,fontWeight:900,fontSize:"0.92rem"}}>{s.name}</div>
                      <div style={{color:C.green,fontSize:"0.72rem",fontWeight:700,textTransform:"uppercase",letterSpacing:"0.05em"}}>{s.type}</div>
                    </div>
                  </div>
                  <div style={{padding:"0.85rem 1.1rem"}}>
                    {s.tag&&<p style={{margin:"0 0 0.6rem",fontSize:"0.8rem",fontWeight:700,color:C.green}}>{s.tag}</p>}
                    <ul style={{margin:"0 0 0.75rem",paddingLeft:"1.1rem"}}>
                      {s.items.map(i=><li key={i} style={{fontSize:"0.88rem",color:C.black,fontWeight:700,lineHeight:1.9}}>{i}</li>)}
                    </ul>
                  </div>
                </div>
              ))}
            </div>

            {/* About Eric — split layout with photo */}
            <div style={{background:C.black,borderRadius:10,overflow:"hidden",marginBottom:"1.5rem",display:"flex",alignItems:"stretch"}}>
              {/* Photo left */}
              <div style={{width:"42%",flexShrink:0,backgroundImage:"url(https://i.postimg.cc/CL4W8Q2S/Screenshot-(17).png)",backgroundSize:"cover",backgroundPosition:"center top",minHeight:200}} />
              {/* Text right */}
              <div style={{padding:"1.25rem 1.1rem",flex:1}}>
                <p style={{margin:"0 0 0.4rem",fontSize:"0.68rem",fontWeight:800,letterSpacing:"0.12em",textTransform:"uppercase",color:C.green}}>About</p>
                <p style={{margin:"0 0 0.5rem",color:C.white,fontWeight:900,fontSize:"1rem",lineHeight:1.2}}>Eric Landry Jr.</p>
                <div style={{width:24,height:2,background:C.green,borderRadius:1,marginBottom:"0.65rem"}} />
                <p style={{margin:0,color:"#d1d5db",fontSize:"0.82rem",lineHeight:1.8}}>
                  Born and raised in Algiers. O. Perry Walker graduate. Competitive bodybuilder. No shortcuts. No excuses. Just results — in the gym and in your yard.
                </p>
              </div>
            </div>

            {/* Stats */}
            <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:8,marginBottom:"1.75rem"}}>
              {[{stat:"5,600+",label:"Followers"},{stat:"100%",label:"Satisfaction"},{stat:"24hr",label:"Response"}].map(s=>(
                <div key={s.label} style={{background:'#D4A017',border:`1.5px solid ${C.rule}`,borderRadius:8,padding:"0.85rem 0.5rem",textAlign:"center"}}>
                  <div style={{fontSize:"1.3rem",fontWeight:900,color:C.green,lineHeight:1}}>{s.stat}</div>
                  <div style={{fontSize:"0.7rem",color:C.gray,fontWeight:700,marginTop:"0.25rem",textTransform:"uppercase",letterSpacing:"0.06em"}}>{s.label}</div>
                </div>
              ))}
            </div>

            {/* CTA */}
            <div style={{background:C.green,borderRadius:10,padding:"1.5rem",textAlign:"center"}}>
              <p style={{fontFamily:"Georgia,serif",fontSize:"1.1rem",color:C.white,margin:"0 0 0.3rem",fontStyle:"italic"}}>"Trust Me With Your Yard.<br/>I'll Handle The Rest."</p>
              <p style={{color:"#d1fae5",fontSize:"0.8rem",margin:"0 0 1.25rem"}}>— Eric Landry Jr.</p>
              <button onClick={()=>setView("form")} style={{background:C.black,color:C.white,border:"none",padding:"0.9rem 2rem",borderRadius:6,fontSize:"0.95rem",fontWeight:900,cursor:"pointer",width:"100%",marginBottom:"0.75rem",textTransform:"uppercase"}}>
                Get a Free Estimate →
              </button>
              <a href={`tel:${PHONE}`} style={{display:"block",color:"#d1fae5",fontWeight:700,fontSize:"0.9rem",textDecoration:"none"}}>Or call {PHONE}</a>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
