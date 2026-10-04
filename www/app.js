/* ============================================================
   RuhRank — Practice • Compete • Rank
   Made with ♥ by Hasnain
   ============================================================ */
"use strict";

// AI Explain key (injected at build time)
const GEMINI_API_KEY = "%%GEMINI_KEY%%";

// ---------- helpers ----------
const $ = id => document.getElementById(id);
const $$ = (s, r) => Array.from((r || document).querySelectorAll(s));
const store = {
  get(k, d) { try { const v = localStorage.getItem("rr_" + k); return v === null ? d : JSON.parse(v); } catch (e) { return d; } },
  set(k, v) { try { localStorage.setItem("rr_" + k, JSON.stringify(v)); } catch (e) {} }
};
const esc = s => String(s == null ? "" : s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
const shuffle = a => { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); const t = a[i]; a[i] = a[j]; a[j] = t; } return a; };
// Deterministic shuffle — same seed => same order for every participant (live battle)
function seededShuffle(arr, seedStr) {
  let h = 2166136261; const s = String(seedStr);
  for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); }
  let a = h >>> 0;
  const rnd = () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
  const o = arr.slice();
  for (let i = o.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); const t = o[i]; o[i] = o[j]; o[j] = t; }
  return o;
}
const todayKey = () => new Date().toISOString().slice(0, 10);
function hashStr(s) { let h = 0; for (let i = 0; i < s.length; i++) { h = (h * 31 + s.charCodeAt(i)) | 0; } return Math.abs(h); }
function seededPick(arr, seed, n) { const out = []; const used = new Set(); let h = hashStr(seed); for (let k = 0; k < n && out.length < arr.length; k++) { h = (h * 1103515245 + 12345) & 0x7fffffff; const i = h % arr.length; if (!used.has(i)) { used.add(i); out.push(arr[i]); } } return out; }

// ---------- subjects ----------
const SUBJECTS = {
  gk:       { name: "General Knowledge", icon: "🌍" },
  maths:    { name: "Maths",             icon: "🔢" },
  reasoning:{ name: "Reasoning",         icon: "🧩" },
  english:  { name: "English",           icon: "🔤" },
  bihar:    { name: "Bihar GK",          icon: "🏛️" },
  ca:       { name: "Current Affairs",   icon: "📰" }
};

// ---------- exam configs (mock engine patterns) ----------
const EXAMS = {
  "ssc-cgl":  { name: "SSC CGL",    cat: "SSC",     icon: "🏛️", total: 100, mins: 60,  marks: 2, neg: 0.5,  sections: { gk: 25, maths: 25, reasoning: 25, english: 25 } },
  "ssc-chsl": { name: "SSC CHSL",   cat: "SSC",     icon: "🏛️", total: 100, mins: 60,  marks: 2, neg: 0.5,  sections: { gk: 25, maths: 25, reasoning: 25, english: 25 } },
  "ssc-mts":  { name: "SSC MTS",    cat: "SSC",     icon: "🏛️", total: 90,  mins: 90,  marks: 3, neg: 0,    sections: { gk: 25, maths: 25, reasoning: 25, english: 15 } },
  "ssc-gd":   { name: "SSC GD",     cat: "SSC",     icon: "🏛️", total: 80,  mins: 60,  marks: 2, neg: 0.25, sections: { gk: 20, maths: 20, reasoning: 20, english: 20 } },
  "rrb-ntpc": { name: "RRB NTPC",   cat: "Railway", icon: "🚂", total: 100, mins: 90,  marks: 1, neg: 0.33, sections: { gk: 40, maths: 30, reasoning: 30 } },
  "rrb-groupd":{ name: "Group D",   cat: "Railway", icon: "🚂", total: 100, mins: 90,  marks: 1, neg: 0.33, sections: { gk: 25, maths: 25, reasoning: 30, english: 20 } },
  "rrb-alp":  { name: "ALP",        cat: "Railway", icon: "🚂", total: 75,  mins: 60,  marks: 1, neg: 0.33, sections: { gk: 20, maths: 20, reasoning: 25, english: 10 } },
  "bihar-police": { name: "Bihar Police", cat: "Bihar", icon: "🚔", total: 100, mins: 120, marks: 1, neg: 0, sections: { gk: 50, bihar: 25, maths: 15, reasoning: 10 } },
  "bihar-si": { name: "Bihar SI",   cat: "Bihar",   icon: "🚔", total: 100, mins: 120, marks: 2, neg: 0.2,  sections: { gk: 40, bihar: 20, maths: 20, reasoning: 20 } },
  "bpsc":     { name: "BPSC",       cat: "Bihar",   icon: "🏛️", total: 150, mins: 120, marks: 1, neg: 0,    sections: { gk: 80, bihar: 30, maths: 20, reasoning: 20 } },
  "ibps":     { name: "IBPS",       cat: "Banking", icon: "🏦", total: 100, mins: 60,  marks: 1, neg: 0.25, sections: { gk: 20, maths: 35, reasoning: 35, english: 10 } },
  "sbi":      { name: "SBI PO/Clerk", cat: "Banking", icon: "🏦", total: 100, mins: 60, marks: 1, neg: 0.25, sections: { gk: 20, maths: 35, reasoning: 35, english: 10 } },
  "nda":      { name: "NDA",        cat: "Defence", icon: "🎖️", total: 120, mins: 150, marks: 2.5, neg: 0.83, sections: { maths: 60, gk: 40, english: 20 } },
  "cds":      { name: "CDS",        cat: "Defence", icon: "🎖️", total: 100, mins: 120, marks: 1, neg: 0.33, sections: { gk: 50, maths: 30, english: 20 } },
  "agniveer": { name: "Agniveer",   cat: "Defence", icon: "🎖️", total: 50,  mins: 60,  marks: 4, neg: 1,    sections: { gk: 15, maths: 15, reasoning: 10, english: 10 } },
  "ctet":     { name: "CTET",       cat: "Teaching", icon: "📚", total: 150, mins: 150, marks: 1, neg: 0,    sections: { gk: 30, reasoning: 30, english: 30, maths: 30, ca: 30 } },
  "stet":     { name: "STET",       cat: "Teaching", icon: "📚", total: 150, mins: 150, marks: 1, neg: 0,    sections: { gk: 50, bihar: 20, reasoning: 30, english: 25, maths: 25 } }
};
const EXAM_CATS = ["SSC", "Railway", "Bihar", "Banking", "Defence", "Teaching"];

// ---------- question bank (defensive load; other agents fill these) ----------
var QB = [];
try {
  QB = [].concat(
    window.RR_QB_GK || [], window.RR_QB_MATHS || [], window.RR_QB_REASONING || [],
    window.RR_QB_ENGLISH || [], window.RR_QB_BIHAR || [], window.RR_QB_CA || []
  );
} catch (e) { QB = []; }

// built-in sample bank (fallback so app works standalone)
const RR_SAMPLE = [
 {id:"s-gk-01",exam:["ssc-cgl","rrb-ntpc","bpsc"],subject:"gk",topic:"History",lang:"hi",q:"भारत में 'ग्रैंड ट्रंक रोड' का निर्माण किस शासक ने करवाया था?",opts:["अकबर","शेरशाह सूरी","बाबर","अशोक"],ans:1,exp:"शेरशाह सूरी ने सड़क-ए-आज़म (ग्रैंड ट्रंक रोड) बनवाई थी।"},
 {id:"s-gk-02",exam:["ssc-cgl","bihar-police"],subject:"gk",topic:"Polity",lang:"hi",q:"भारतीय संविधान का कौन-सा अनुच्छेद 'समानता के अधिकार' से संबंधित है?",opts:["अनुच्छेद 14-18","अनुच्छेद 19-22","अनुच्छेद 25-28","अनुच्छेद 32"],ans:0,exp:"अनुच्छेद 14 से 18 तक समानता का अधिकार देते हैं।"},
 {id:"s-gk-03",exam:["rrb-ntpc","ssc-chsl"],subject:"gk",topic:"Geography",lang:"hi",q:"भारत की सबसे लंबी नदी कौन-सी है?",opts:["यमुना","गोदावरी","गंगा","ब्रह्मपुत्र"],ans:2,exp:"गंगा भारत की सबसे लंबी नदी है (लगभग 2525 किमी)।"},
 {id:"s-gk-04",exam:["bpsc","ssc-cgl"],subject:"gk",topic:"Science",lang:"hi",q:"प्रकाश संश्लेषण (Photosynthesis) पौधे के किस भाग में होता है?",opts:["जड़","तना","पत्ती","फूल"],ans:2,exp:"पत्तियों में क्लोरोफिल की मदद से प्रकाश संश्लेषण होता है।"},
 {id:"s-m-01",exam:["ssc-cgl","ibps"],subject:"maths",topic:"Percentage",lang:"hi",q:"200 का 35% कितना होगा?",opts:["60","70","75","80"],ans:1,exp:"200 × 35/100 = 70"},
 {id:"s-m-02",exam:["rrb-ntpc","bihar-police"],subject:"maths",topic:"Average",lang:"hi",q:"5, 10, 15, 20, 25 का औसत क्या है?",opts:["12","15","18","20"],ans:1,exp:"योग = 75, औसत = 75/5 = 15"},
 {id:"s-m-03",exam:["ssc-chsl","sbi"],subject:"maths",topic:"Ratio",lang:"hi",q:"यदि A:B = 2:3 और B:C = 4:5 हो, तो A:C क्या होगा?",opts:["8:15","2:5","8:5","4:15"],ans:0,exp:"A:C = (2×4):(3×5) = 8:15"},
 {id:"s-m-04",exam:["ibps","nda"],subject:"maths",topic:"Interest",lang:"hi",q:"₹10000 पर 10% वार्षिक दर से 2 वर्ष का साधारण ब्याज कितना होगा?",opts:["₹1500","₹2000","₹2100","₹2500"],ans:1,exp:"SI = 10000×10×2/100 = ₹2000"},
 {id:"s-r-01",exam:["ssc-cgl","rrb-ntpc"],subject:"reasoning",topic:"Series",lang:"hi",q:"श्रृंखला पूरी करें: 2, 6, 12, 20, 30, ?",opts:["40","42","44","36"],ans:1,exp:"अंतर: 4, 6, 8, 10, 12 → अगला 30+12 = 42"},
 {id:"s-r-02",exam:["ibps","bihar-si"],subject:"reasoning",topic:"Coding",lang:"hi",q:"यदि CAT = 24 हो, तो DOG = ?",opts:["26","24","28","30"],ans:0,exp:"C(3)+A(1)+T(20) = 24; D(4)+O(15)+G(7) = 26"},
 {id:"s-r-03",exam:["ssc-gd","rrb-groupd"],subject:"reasoning",topic:"Blood Relation",lang:"hi",q:"राम का भाई श्याम है। श्याम की माँ गीता है। गीता का राम से क्या संबंध है?",opts:["बुआ","माँ","दादी","चाची"],ans:1,exp:"श्याम और राम भाई हैं, दोनों की माँ गीता है।"},
 {id:"s-r-04",exam:["nda","cds"],subject:"reasoning",topic:"Direction",lang:"hi",q:"एक व्यक्ति उत्तर की ओर 5 किमी चलकर दाएँ मुड़ता है और 3 किमी चलता है। वह प्रारंभिक बिंदु से किस दिशा में है?",opts:["उत्तर-पूर्व","दक्षिण-पूर्व","उत्तर-पश्चिम","दक्षिण-पश्चिम"],ans:0,exp:"उत्तर फिर पूर्व = उत्तर-पूर्व दिशा।"},
 {id:"s-e-01",exam:["ssc-cgl","ibps"],subject:"english",topic:"Synonym",lang:"en",q:"Choose the synonym of ABANDON:",opts:["Keep","Leave","Hold","Cherish"],ans:1,exp:"Abandon means to leave completely."},
 {id:"s-e-02",exam:["cds","nda"],subject:"english",topic:"Antonym",lang:"en",q:"Choose the antonym of BRAVE:",opts:["Bold","Coward","Heroic","Fearless"],ans:1,exp:"Brave ka opposite Coward hota hai."},
 {id:"s-e-03",exam:["ssc-chsl","sbi"],subject:"english",topic:"Idiom",lang:"en",q:"'To bite the dust' means:",opts:["To eat quickly","To fail / be defeated","To work hard","To rest"],ans:1,exp:"Bite the dust = haar jana / fail hona."},
 {id:"s-e-04",exam:["ibps","ctet"],subject:"english",topic:"Grammar",lang:"en",q:"Choose the correct sentence:",opts:["He don't like tea.","He doesn't likes tea.","He doesn't like tea.","He not like tea."],ans:2,exp:"He ke saath 'doesn't + base verb' aata hai."},
 {id:"s-b-01",exam:["bihar-police","bpsc"],subject:"bihar",topic:"History",lang:"hi",q:"बिहार का प्राचीन नाम क्या था?",opts:["मगध","विदेह","अंग","वज्जि"],ans:0,exp:"बिहार क्षेत्र प्राचीन काल में मगध के नाम से प्रसिद्ध था।"},
 {id:"s-b-02",exam:["bpsc","bihar-si"],subject:"bihar",topic:"Geography",lang:"hi",q:"बिहार की राजधानी पटना किस नदी के तट पर स्थित है?",opts:["यमुना","गंगा","कोसी","गंडक"],ans:1,exp:"पटना गंगा नदी के दक्षिणी तट पर स्थित है।"},
 {id:"s-b-03",exam:["bihar-police","stet"],subject:"bihar",topic:"Culture",lang:"hi",q:"छठ पूजा मुख्य रूप से किस देवता को समर्पित है?",opts:["शिव","विष्णु","सूर्य","गणेश"],ans:2,exp:"छठ में सूर्य देव और छठी मैया की पूजा होती है।"},
 {id:"s-b-04",exam:["bpsc","ctet"],subject:"bihar",topic:"Polity",lang:"hi",q:"बिहार विधानसभा में कुल कितनी सीटें हैं?",opts:["243","245","240","250"],ans:0,exp:"बिहार विधानसभा में 243 सीटें हैं।"},
 {id:"s-ca-01",exam:["ssc-cgl","ibps","bpsc"],subject:"ca",topic:"National",lang:"hi",q:"भारत के वर्तमान मुख्य चुनाव आयुक्त (CEC) कौन हैं? (2026)",opts:["राजीव कुमार","ज्ञानेश कुमार","सुशील चंद्रा","ओम प्रकाश रावत"],ans:1,exp:"2026 तक की जानकारी के अनुसार ज्ञानेश कुमार CEC हैं।"},
 {id:"s-ca-02",exam:["rrb-ntpc","sbi"],subject:"ca",topic:"Sports",lang:"hi",q:"2026 में भारत ने किस खेल आयोजन की मेज़बानी की तैयारी तेज़ की?",opts:["ओलंपिक 2036 बोली","फीफा विश्व कप","राष्ट्रमंडल खेल 2030","एशियाई खेल"],ans:0,exp:"भारत 2036 ओलंपिक की मेज़बानी की बोली पर काम कर रहा है।"}
];
if (QB.length === 0) QB = RR_SAMPLE.slice();

// ============================================================
// USER STATE
// ============================================================
const U = {
  get profile() { return store.get("profile", { name: "", username: "", exam: null, lang: "hi", dark: true, notif: true, priv: false }); },
  set profile(v) { store.set("profile", v); }
};
function getXP() { return store.get("xp", 0); }
function addXP(n) {
  const x = getXP() + n; store.set("xp", x);
  checkAchievements();
  if (FB.on) fbPushScore();
  return x;
}
function getStreak() {
  const s = store.get("streak", { count: 0, last: "" });
  const t = todayKey();
  if (s.last === t) return s.count;
  const y = new Date(Date.now() - 864e5).toISOString().slice(0, 10);
  if (s.last === y) return s.count; // streak alive, not yet extended today
  return 0;
}
function bumpStreak() {
  const s = store.get("streak", { count: 0, last: "" });
  const t = todayKey();
  if (s.last !== t) {
    const y = new Date(Date.now() - 864e5).toISOString().slice(0, 10);
    s.count = (s.last === y) ? s.count + 1 : 1;
    s.last = t; store.set("streak", s);
    addXP(Math.min(s.count, 30) * 2); // streak bonus
    checkAchievements();
  }
  return s.count;
}
function logAttempt(rec) {
  const h = store.get("history", []);
  h.unshift(Object.assign({ ts: Date.now(), date: todayKey() }, rec));
  store.set("history", h.slice(0, 500));
  bumpStreak();
}
function topicStats() {
  // accuracy per subject+topic from history details
  const agg = {};
  (store.get("history", [])).forEach(h => {
    (h.details || []).forEach(d => {
      const k = d.subject + "|" + d.topic;
      agg[k] = agg[k] || { att: 0, ok: 0, subject: d.subject, topic: d.topic };
      agg[k].att++; if (d.ok) agg[k].ok++;
    });
  });
  return Object.keys(agg).map(k => Object.assign({ key: k, acc: agg[k].att ? Math.round(agg[k].ok / agg[k].att * 100) : 0 }, agg[k]));
}
function weakTopics(n) {
  return topicStats().filter(t => t.att >= 3 && t.acc < 60).sort((a, b) => a.acc - b.acc).slice(0, n || 5);
}

// ---------- achievements ----------
const ACH = [
  { id: "first",   icon: "🥉", name: "First Test",    desc: "पहला टेस्ट पूरा करें",        check: () => store.get("history", []).length >= 1 },
  { id: "q100",    icon: "🥈", name: "100 Questions", desc: "100 प्रश्न हल करें",        check: () => totalSolved() >= 100 },
  { id: "q1000",   icon: "🥇", name: "1,000 Questions", desc: "1000 प्रश्न हल करें",     check: () => totalSolved() >= 1000 },
  { id: "streak7", icon: "🔥", name: "7-Day Streak",  desc: "लगातार 7 दिन अभ्यास",          check: () => getStreak() >= 7 },
  { id: "streak30",icon: "🔥", name: "30-Day Streak", desc: "लगातार 30 दिन अभ्यास",         check: () => getStreak() >= 30 },
  { id: "acc90",   icon: "🎯", name: "90% Accuracy",  desc: "किसी टेस्ट में 90%+ एक्यूरेसी",      check: () => store.get("history", []).some(h => h.acc >= 90 && h.total >= 10) },
  { id: "top100",  icon: "🏆", name: "Top 100",       desc: "लीडरबोर्ड में टॉप 100",          check: () => myLocalRank().rank <= 100 },
  { id: "top10",   icon: "👑", name: "Top 10",        desc: "लीडरबोर्ड में टॉप 10",           check: () => myLocalRank().rank <= 10 }
];
function totalSolved() { return store.get("history", []).reduce((s, h) => s + (h.total || 0), 0); }
function checkAchievements() {
  const got = store.get("ach", []);
  let changed = false;
  ACH.forEach(a => { if (got.indexOf(a.id) < 0) { try { if (a.check()) { got.push(a.id); changed = true; notify("🏅 उपलब्धि: " + a.name, a.desc); } } catch (e) {} } });
  if (changed) store.set("ach", got);
}

// ============================================================
// FIREBASE (ready; local mode if no config)
// ============================================================
const FB = { on: false, db: null, uid: null };
function fbInit() {
  try {
    const cfg = window.RR_FIREBASE_CONFIG;
    if (!cfg || !window.firebase) { console.log("RuhRank: local mode (no Firebase config)"); return; }
    firebase.initializeApp(cfg);
    FB.db = firebase.firestore();
    const auth = firebase.auth();
    // Auth state listener — login/logout pe profile sync
    auth.onAuthStateChanged(u => { if (u && FB.on) syncProfileFromAuth(u); });
    // 1. Pehle redirect result (Google login se wapas aaye hon to)
    auth.getRedirectResult().then(handleRedirectResult).catch(e => {
      console.log("redirect result:", e && e.code);
      if (e && e.code === "auth/credential-already-in-use") toast("❌ यह Google account पहले से किसी अन्य ID से जुड़ा है");
    }).finally(() => {
      // 2. Phir anonymous sign-in (agar koi user nahi hai)
      const cur = auth.currentUser;
      if (cur) { FB.uid = cur.uid; FB.on = true; syncProfileFromAuth(cur); fbPullAll(); }
      else auth.signInAnonymously().then(c => { FB.uid = c.user.uid; FB.on = true; fbPullAll(); })
        .catch(e => console.log("FB auth fail, local mode", e));
    });
  } catch (e) { console.log("FB init fail, local mode", e); }
}
// Google redirect se wapas aane pe — anonymous account link ho chuka hota hai (same UID)
function handleRedirectResult(res) {
  if (!res || !res.user) return;
  FB.uid = res.user.uid; FB.on = true;
  syncProfileFromAuth(res.user);
  fbPushScore();
  toast("✅ Google से लॉगिन हो गया!");
  try { if (navStack[navStack.length - 1] === "scr-profile") renderProfile(); } catch (e) {}
}
function syncProfileFromAuth(u) {
  try {
    const p = U.profile; let ch = false;
    if (u.displayName && !p.name) { p.name = u.displayName; ch = true; }
    if (u.photoURL && !p.photo) { p.photo = u.photoURL; ch = true; }
    if (u.email && !p.email) { p.email = u.email; ch = true; }
    const prov = u.isAnonymous ? "anonymous" : ((u.providerData && u.providerData[0] && u.providerData[0].providerId) || "linked");
    if (p.provider !== prov) { p.provider = prov; ch = true; }
    if (ch) U.profile = p;
  } catch (e) {}
}

// ============================================================
// LOGIN — Google (redirect) + Email/Password
// ============================================================
function authErrorMsg(e) {
  const c = (e && e.code) || "";
  const M = {
    "auth/invalid-email": "❌ ईमेल पता सही नहीं है",
    "auth/user-not-found": "❌ इस ईमेल से कोई account नहीं है — नया account बनाएँ",
    "auth/wrong-password": "❌ पासवर्ड गलत है",
    "auth/email-already-in-use": "❌ यह ईमेल पहले से registered है — लॉगिन करें",
    "auth/weak-password": "❌ पासवर्ड कम से कम 6 अक्षर का रखें",
    "auth/network-request-failed": "❌ इंटरनेट उपलब्ध नहीं है",
    "auth/credential-already-in-use": "❌ यह account पहले से किसी अन्य ID से जुड़ा है",
    "auth/too-many-requests": "❌ बहुत प्रयास हुए — कुछ देर बाद पुनः प्रयास करें",
    "auth/operation-not-allowed": "❌ यह login विधि अभी चालू नहीं है",
    "auth/user-disabled": "❌ यह account बंद कर दिया गया है"
  };
  return M[c] || "❌ लॉगिन में समस्या हुई — पुनः प्रयास करें";
}
function afterLoginUser(u, how) {
  FB.uid = u.uid; FB.on = true;
  const p = U.profile;
  if (u.displayName) p.name = u.displayName;
  if (u.photoURL) p.photo = u.photoURL;
  if (u.email) p.email = u.email;
  p.provider = how; U.profile = p;
  fbPushScore();
  toast("✅ लॉगिन सफल!");
  try { renderProfile(); } catch (e) {}
}
// Google login — anonymous account se LINK (UID, XP, streak sab bana rahta hai)
window.doGoogleLogin = function () {
  if (!FB.on || !window.firebase) { toast("🌐 लॉगिन के लिए इंटरनेट आवश्यक है"); return; }
  try {
    const auth = firebase.auth();
    const user = auth.currentUser;
    const provider = new firebase.auth.GoogleAuthProvider();
    if (user && user.isAnonymous) {
      user.linkWithRedirect(provider); // purana data bana rahega
    } else if (user) {
      toast("✅ आप पहले से लॉगिन हैं");
    } else {
      auth.signInWithRedirect(provider);
    }
  } catch (e) { toast("❌ लॉगिन शुरू नहीं हो सका"); }
};
// Email/Password — mode: "login" ya "signup"
window.doEmailAuth = function (mode) {
  if (!FB.on || !window.firebase) { toast("🌐 लॉगिन के लिए इंटरनेट आवश्यक है"); return; }
  const em = ($("loginEmail") || {}).value || "";
  const pw = ($("loginPass") || {}).value || "";
  const email = em.trim();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { toast("❌ सही ईमेल पता लिखें"); return; }
  if (pw.length < 6) { toast("❌ पासवर्ड कम से कम 6 अक्षर का रखें"); return; }
  const auth = firebase.auth();
  const user = auth.currentUser;
  toast("⏳ कृपया प्रतीक्षा करें…");
  if (mode === "signup") {
    const cred = firebase.auth.EmailAuthProvider.credential(email, pw);
    const done = u => afterLoginUser(u, "password");
    if (user && user.isAnonymous) {
      user.linkWithCredential(cred).then(r => done(r.user)).catch(e => toast(authErrorMsg(e)));
    } else {
      auth.createUserWithEmailAndPassword(email, pw).then(r => done(r.user)).catch(e => toast(authErrorMsg(e)));
    }
  } else {
    auth.signInWithEmailAndPassword(email, pw).then(r => afterLoginUser(r.user, "password"))
      .catch(e => toast(authErrorMsg(e)));
  }
};
window.doLogout = function () {
  if (!window.firebase) { toast("❌ उपलब्ध नहीं है"); return; }
  const auth = firebase.auth();
  auth.signOut().then(() => {
    const pp = U.profile;
    pp.name = ""; pp.photo = ""; pp.email = ""; pp.provider = "anonymous"; U.profile = pp;
    return auth.signInAnonymously();
  }).then(c => {
    FB.uid = c.user.uid; FB.on = true;
    try { renderProfile(); } catch (e) {}
    toast("✅ लॉगआउट हो गया");
  }).catch(() => toast("❌ लॉगआउट में समस्या हुई"));
};
function isLoggedIn(pp) {
  const p = pp || U.profile;
  return !!(p.provider && p.provider !== "anonymous");
}
function loginSectionHTML(p) {
  if (!FB.on) return `<div class="glass card" style="text-align:center">
    <div style="font-size:36px">🌐</div><b>लॉगिन हेतु इंटरनेट आवश्यक</b>
    <div style="color:var(--mut);font-size:13px">ऑनलाइन आते ही Google/Email से लॉगिन कर पाएँगे।</div></div>`;
  if (isLoggedIn()) {
    const badge = p.provider === "google.com" ? "🔵 Google" : p.provider === "password" ? "📧 Email" : "🔗 Linked";
    return `<div class="glass card gold-border" style="text-align:center">
      ${p.photo ? `<img src="${esc(p.photo)}" class="login-av" alt="">` : `<div style="font-size:52px">👤</div>`}
      <h2 style="margin:8px 0 2px">${esc(p.name || p.username || "Student")}</h2>
      <div style="color:var(--mut);font-size:13px">${esc(p.email || "")} • ${badge} से जुड़ा है</div>
      <button class="btn ghost sm" style="margin-top:10px" onclick="doLogout()">🚪 लॉगआउट</button>
    </div>`;
  }
  return `<div class="glass card gold-border" style="text-align:center">
    <b>🔐 लॉगिन करें</b>
    <div style="color:var(--mut);font-size:13px;margin:4px 0 10px">आपका XP, स्ट्रीक और डेटा सुरक्षित रहेगा।<br>बिना लॉगिन भी पूरा app चलेगा।</div>
    <button class="btn gold" onclick="doGoogleLogin()">🔵 Google से लॉगिन</button>
    <div style="display:flex;align-items:center;gap:8px;margin:12px 0;color:var(--mut);font-size:12px">
      <div style="flex:1;height:1px;background:rgba(255,255,255,.12)"></div>या<div style="flex:1;height:1px;background:rgba(255,255,255,.12)"></div>
    </div>
    <input id="loginEmail" class="searchbox" type="email" placeholder="ईमेल पता" autocomplete="email">
    <input id="loginPass" class="searchbox" type="password" placeholder="पासवर्ड (कम से कम 6 अक्षर)" autocomplete="current-password" style="margin-top:8px">
    <div class="row2" style="margin-top:10px">
      <button class="btn gold" onclick="doEmailAuth('login')">➡️ लॉगिन</button>
      <button class="btn ghost" onclick="doEmailAuth('signup')">📝 नया account बनाएँ</button>
    </div>
  </div>`;
}
function fbPushScore() {
  if (!FB.on) return;
  try {
    const p = U.profile;
    FB.db.collection("leaderboard").doc(FB.uid).set({
      name: p.priv ? (p.username || "Student") : (p.name || p.username || "Student"),
      photo: p.photo || "",
      xp: getXP(), streak: getStreak(), exam: p.exam, ts: Date.now()
    }, { merge: true });
  } catch (e) {}
}
function fbPullAll() {
  if (!FB.on) return;
  try {
    fbWatchCompetitions();
    FB.db.collection("notifications").orderBy("ts", "desc").limit(20).get()
      .then(s => { const n = []; s.forEach(d => n.push(Object.assign({ id: d.id }, d.data()))); store.set("fb_notif", n); renderNotifDot(); });
  } catch (e) {}
}
// Real-time competitions listener (live battle ke liye zaroori)
let compUnsub = null;
function fbWatchCompetitions() {
  if (!FB.on || compUnsub) return;
  try {
    compUnsub = FB.db.collection("competitions").orderBy("startTs", "desc").limit(10)
      .onSnapshot(s => {
        const c = []; s.forEach(d => c.push(Object.assign({ id: d.id }, d.data())));
        store.set("fb_comp", c);
        try { renderHomeLive(); } catch (e) {}
        try { if (navStack[navStack.length - 1] === "scr-competition") renderComp(); } catch (e) {}
      }, () => {});
  } catch (e) {}
}

// ============================================================
// REMOTE CONTENT (questions-remote.json, graceful)
// ============================================================
function fetchRemoteQB() {
  if (!navigator.onLine) return;
  try {
    const ctl = new AbortController();
    const to = setTimeout(() => ctl.abort(), 8000);
    fetch("https://raw.githubusercontent.com/Ruhvibes/ruhrank/main/www/questions-remote.json", { signal: ctl.signal })
      .then(r => { clearTimeout(to); if (!r.ok) throw 0; return r.json(); })
      .then(j => {
        if (j && Array.isArray(j.questions) && j.questions.length) {
          const ids = new Set(QB.map(q => q.id));
          j.questions.forEach(q => { if (q.id && !ids.has(q.id)) { QB.push(q); ids.add(q.id); } });
          console.log("RuhRank: remote questions merged:", j.questions.length);
        }
      }).catch(() => {});
  } catch (e) {}
}

// ============================================================
// ROUTER + NAV
// ============================================================
const NAV_SCREENS = ["scr-home", "scr-practice-setup", "scr-mock-setup", "scr-leaderboard", "scr-profile"];
let navStack = [];
function showScreen(id, push) {
  // Guard: session-bound screens need an active session; else redirect (no dead screens)
  if (id === "scr-practice" && !PR) id = "scr-practice-setup";
  if (id === "scr-mock" && !MK) id = "scr-mock-setup";
  if (id === "scr-result" && !$("resultBody").innerHTML.trim()) id = "scr-home";
  // Live battle cleanup jab screen chhodte hain
  if (id !== "scr-competition" && typeof compTick !== "undefined" && compTick) { clearInterval(compTick); compTick = null; }
  if (id !== "scr-mock") { try { stopLiveWatch(); } catch (e) {} const lb = $("mkLiveBoard"); if (lb) lb.classList.add("hidden"); }
  if (id === "scr-mock") {
    const mlb = $("mkLiveBtn");
    if (mlb) mlb.style.display = (typeof MK !== "undefined" && MK && MK.liveId) ? "" : "none";
  }
  $$(".screen").forEach(s => s.classList.remove("on"));
  const el = $(id); if (!el) return;
  el.classList.add("on");
  if (push !== false) { if (navStack[navStack.length - 1] !== id) navStack.push(id); }
  $$("#bottomNav button").forEach(b => b.classList.toggle("on", b.dataset.go === id));
  const R = {
    "scr-home": renderHome, "scr-leaderboard": renderLB, "scr-challenge": renderChallenge,
    "scr-competition": renderComp, "scr-performance": renderPerf, "scr-ca": renderCA,
    "scr-bookmarks": renderBookmarks, "scr-achievements": renderAch, "scr-profile": renderProfile,
    "scr-notifications": renderNotifs, "scr-practice-setup": renderPracticeSetup, "scr-mock-setup": renderMockSetup,
    "scr-search": renderSearch, "scr-pyq": renderPYQScreen
  };
  if (R[id]) try { R[id](); } catch (e) { console.log(e); }
  el.querySelector(".scroll") && (el.querySelector(".scroll").scrollTop = 0);
}
function goBack() {
  if (!$("aiModal").classList.contains("hidden")) { $("aiModal").classList.add("hidden"); return; }
  if (!$("genModal").classList.contains("hidden")) { $("genModal").classList.add("hidden"); return; }
  if (navStack.length > 1) { navStack.pop(); showScreen(navStack[navStack.length - 1], false); }
  else showScreen("scr-home", false);
}
// Android hardware back — called from MainActivity; false on home = exit app
window.androidBack = function () {
  const cur = navStack[navStack.length - 1];
  if (cur && cur !== "scr-home" && cur !== "scr-onboard") { goBack(); return true; }
  return false;
};
document.addEventListener("click", e => {
  const g = e.target.closest("[data-go]"); if (g) { showScreen(g.dataset.go); return; }
  if (e.target.closest("[data-back]")) { goBack(); return; }
});
document.addEventListener("backbutton", () => { if (!window.androidBack()) { try { Android.exitApp(); } catch (e) {} } }, false);

// ============================================================
// INTERNET GATE (practice works offline; online features gated)
// ============================================================
function netBanner(show) { /* slim banner hook */ }
function requireNet() {
  if (navigator.onLine) return true;
  openGen("📡 इंटरनेट आवश्यक है", "<p style='color:var(--mut)'>यह सुविधा ऑनलाइन है — लीडरबोर्ड, प्रतियोगिता और नए अपडेट के लिए इंटरनेट चालू करें, फिर पुनः प्रयास करें।</p><button class='btn gold' onclick=\"document.getElementById('genModal').classList.add('hidden')\">समझ गया</button>");
  return false;
}
function checkNet() {
  if (!navigator.onLine) $("offlineOverlay").classList.remove("hidden");
  else $("offlineOverlay").classList.add("hidden");
}
window.addEventListener("online", checkNet);
window.addEventListener("offline", checkNet);

// ============================================================
// UPDATE CHECKER
// ============================================================
const VJSON = "https://raw.githubusercontent.com/Ruhvibes/ruhrank/main/version.json";
function checkUpdate(manual) {
  if (!navigator.onLine) { if (manual) toast("इंटरनेट नहीं है"); return; }
  fetch(VJSON + "?t=" + Date.now()).then(r => r.json()).then(j => {
    let vc = 0;
    try { vc = (typeof Android !== "undefined" && Android.getVersionCode) ? Android.getVersionCode() : 0; } catch (e) {}
    if (j && j.versionCode > vc) {
      $("updateNotes").textContent = (j.notes_hi || "नया अपडेट आ गया है!") + " (v" + j.versionName + ")";
      $("updateDialog").classList.remove("hidden");
      $("btnDoUpdate").onclick = () => { try { Android.downloadApk(j.apk); } catch (e) { window.open(j.apk, "_blank"); } $("updateDialog").classList.add("hidden"); };
    } else if (manual) toast("सब कुछ नवीनतम है ✅");
    store.set("upd_check", todayKey());
  }).catch(() => { if (manual) toast("जाँच नहीं हो पाई"); });
}

// ============================================================
// NOTIFICATIONS (local + firebase)
// ============================================================
function notify(title, body) {
  const n = store.get("notifs", []);
  n.unshift({ title, body, ts: Date.now(), read: false });
  store.set("notifs", n.slice(0, 50));
  renderNotifDot();
}
function renderNotifDot() {
  const unread = store.get("notifs", []).some(n => !n.read) || (store.get("fb_notif", []).length > 0);
  const d = $("notifDot"); if (d) d.classList.toggle("hidden", !unread);
}
function toast(msg) {
  const t = document.createElement("div");
  t.textContent = msg;
  t.style.cssText = "position:fixed;bottom:90px;left:50%;transform:translateX(-50%);background:#1c2350;border:1px solid var(--gold);color:var(--txt);padding:10px 18px;border-radius:99px;z-index:99;font-size:14px";
  document.body.appendChild(t); setTimeout(() => t.remove(), 2200);
}
function openGen(title, html) {
  $("genTitle").textContent = title; $("genBody").innerHTML = html;
  $("genModal").classList.remove("hidden");
}

// ============================================================
// ONBOARD — target exam select
// ============================================================
function examCardHTML(id, sel) {
  const e = EXAMS[id];
  return `<button class="exam ${sel === id ? "sel" : ""}" data-exam="${id}">
    <div class="e-ico">${e.icon}</div><b>${esc(e.name)}</b><small>${esc(e.cat)} • ${e.total} प्रश्न</small></button>`;
}
function renderOnboard() {
  $("onboardExams").innerHTML = EXAM_CATS.map(c =>
    `<div style="grid-column:1/-1" class="sec-title">${c}</div>` +
    Object.keys(EXAMS).filter(id => EXAMS[id].cat === c).map(id => examCardHTML(id)).join("")
  ).join("");
  $$("#onboardExams .exam").forEach(b => b.onclick = () => {
    const p = U.profile; p.exam = b.dataset.exam; U.profile = p;
    store.set("onboard", true);
    showScreen("scr-home");
    toast("🎯 लक्ष्य तय: " + EXAMS[p.exam].name);
  });
}

// ============================================================
// HOME
// ============================================================
function renderHome() {
  const p = U.profile;
  const ex = EXAMS[p.exam];
  // target card
  $("homeTargetCard").innerHTML = `
    <div class="t-ico">${ex ? ex.icon : "🎯"}</div>
    <div style="flex:1"><small>लक्ष्य परीक्षा</small><h3>${ex ? esc(ex.name) : "चुनें"}</h3>
    <small>${ex ? ex.total + " प्रश्न • " + ex.mins + " मिनट • -" + ex.neg : ""}</small></div>
    <button class="btn sm gold" style="width:auto" data-go="scr-onboard">बदलें</button>`;
  // weak / personalized practice card
  const wt = weakTopics(3);
  const wc = $("homeWeakCard");
  if (wt.length) {
    wc.style.display = "";
    wc.innerHTML = `<b>🤖 ${esc(p.name || "आपके")} लिए आज ${wt.reduce((s, t) => s + Math.min(t.att, 10), 0)} कमज़ोर टॉपिक के प्रश्न तैयार हैं</b>
      <div style="color:var(--mut);font-size:13px;margin:6px 0">${wt.map(t => "⚠️ " + esc(t.topic) + " (" + t.acc + "%)").join("<br>")}</div>
      <button class="btn gold" id="btnWeakGo">▶️ कमज़ोर टॉपिक अभ्यास</button>`;
    $("btnWeakGo").onclick = () => startPractice({ mode: "weak", count: 25 });
  } else wc.style.display = "none";
  // challenge card
  const chDone = store.get("ch_done", "") === todayKey();
  $("homeChallengeCard").innerHTML = `
    <div style="display:flex;justify-content:space-between;align-items:center">
      <div><b>🔥 आज की चुनौती</b><br><small style="color:var(--mut)">10 प्रश्न • 5 मिनट • दिन ${dayNum()}</small></div>
      <span class="streak">🔥 ${getStreak()} day</span></div>
    <button class="btn ${chDone ? "ghost" : "gold"}" style="margin-top:10px" data-go="scr-challenge">${chDone ? "✅ आज पूर्ण!" : "▶️ चुनौती शुरू करें"}</button>`;
  renderHomeExtras();
  // quick test + live
  $("homeQuickCard").innerHTML = `<div class="m-ico">🧪</div><b>क्विक टेस्ट</b><small style="color:var(--mut)">10/20/50 प्रश्न</small>`;
  $("homeQuickCard").onclick = () => showScreen("scr-mock-setup");
  renderHomeLive();
  // rank card
  const r = myLocalRank();
  $("homeRankCard").innerHTML = `
    <div style="display:flex;justify-content:space-between;align-items:center">
      <div><small style="color:var(--mut)">मेरी रैंक</small><div class="rank-num">#${r.rank}</div>
      <small style="color:var(--mut)">शीर्ष ${r.pct}% विद्यार्थियों में • ${getXP()} XP</small></div>
      <button class="btn sm gold" style="width:auto" data-go="scr-leaderboard">रैंक →</button></div>`;
  // popular exams
  $("homeExams").innerHTML = Object.keys(EXAMS).slice(0, 8).map(id => examCardHTML(id, p.exam)).join("");
  $$("#homeExams .exam").forEach(b => b.onclick = () => {
    const pp = U.profile; pp.exam = b.dataset.exam; U.profile = pp; renderHome();
  });
}
function dayNum() {
  const start = Date.UTC(2026, 0, 1);
  return Math.floor((Date.now() - start) / 864e5) + 1;
}

// ============================================================
// PRACTICE SETUP + ENGINE
// ============================================================
let PS = { subject: "gk", topic: "all", count: 10, mode: "practice" };
function renderPracticeSetup() {
  $("psSubjects").innerHTML = Object.keys(SUBJECTS).map(s =>
    `<button class="chip ${PS.subject === s ? "on" : ""}" data-s="${s}">${SUBJECTS[s].icon} ${SUBJECTS[s].name}</button>`).join("");
  $$("#psSubjects .chip").forEach(c => c.onclick = () => { PS.subject = c.dataset.s; PS.topic = "all"; renderPracticeSetup(); });
  const topics = ["all"].concat(Array.from(new Set(QB.filter(q => q.subject === PS.subject).map(q => q.topic))));
  $("psTopics").innerHTML = topics.map(t =>
    `<button class="chip ${PS.topic === t ? "on" : ""}" data-t="${esc(t)}">${t === "all" ? "सभी टॉपिक" : esc(t)}</button>`).join("");
  $$("#psTopics .chip").forEach(c => c.onclick = () => { PS.topic = c.dataset.t; renderPracticeSetup(); });
  $$("#psCounts .chip").forEach(c => c.onclick = () => { $$("#psCounts .chip").forEach(x => x.classList.remove("on")); c.classList.add("on"); PS.count = +c.dataset.n; });
  $$("#psModes .mode").forEach(m => m.onclick = () => { $$("#psModes .mode").forEach(x => x.classList.remove("on")); m.classList.add("on"); PS.mode = m.dataset.m; });
}
function pickQuestions(opts) {
  let pool = QB.slice();
  if (opts.subject && opts.subject !== "all") pool = pool.filter(q => q.subject === opts.subject);
  if (opts.topic && opts.topic !== "all") pool = pool.filter(q => q.topic === opts.topic);
  if (opts.exam) pool = pool.filter(q => !q.exam || q.exam.indexOf(opts.exam) >= 0);
  if (opts.mode === "weak") {
    const wt = weakTopics(8).map(t => t.subject + "|" + t.topic);
    pool = QB.filter(q => wt.indexOf(q.subject + "|" + q.topic) >= 0);
    if (!pool.length) pool = QB.slice();
  }
  if (opts.mode === "random" || opts.mode === "weak") pool = shuffle(pool);
  if (opts.unattempted) {
    const seen = new Set(); (store.get("history", [])).forEach(h => (h.details || []).forEach(d => seen.add(d.qid)));
    const fresh = pool.filter(q => !seen.has(q.id));
    if (fresh.length >= (opts.count || 10)) pool = fresh;
  }
  return pool.slice(0, opts.count || 10);
}
// ---- practice session ----
let PR = null;
function startPractice(opts) {
  const qs = pickQuestions(opts);
  if (!qs.length) { toast("इस फ़िल्टर में प्रश्न नहीं मिले"); return; }
  PR = { qs, i: 0, ans: new Array(qs.length).fill(-1), ok: new Array(qs.length).fill(null), t0: Date.now(), mode: opts.mode || "practice", title: opts.title || "Practice", timed: (opts.mode === "timed") ? 60 * qs.length : 0, timerId: null };
  if (PR.timed) PR.timerId = setInterval(() => {
    PR.timed--;
    const m = Math.floor(PR.timed / 60), s = PR.timed % 60;
    $("prTimer").textContent = "⏱️ " + m + ":" + String(s).padStart(2, "0");
    if (PR.timed <= 0) finishPractice();
  }, 1000);
  $("prTitle").textContent = PR.title;
  showScreen("scr-practice");
  renderPR();
}
function renderPR() {
  const q = PR.qs[PR.i];
  $("prBar").style.width = ((PR.i + 1) / PR.qs.length * 100) + "%";
  $("prCount").textContent = "Q " + (PR.i + 1) + "/" + PR.qs.length;
  $("prTopic").textContent = (SUBJECTS[q.subject] ? SUBJECTS[q.subject].icon + " " + SUBJECTS[q.subject].name : q.subject) + " • " + q.topic;
  $("prQ").textContent = q.q;
  $("prBookmark").textContent = isBookmarked(q.id) ? "🔖" : "📑";
  $("prBookmark").onclick = () => { toggleBookmark(q.id); renderPR(); };
  const box = $("prOpts"); box.innerHTML = "";
  const picked = PR.ans[PR.i];
  q.opts.forEach((o, i) => {
    const b = document.createElement("button");
    b.className = "opt";
    b.innerHTML = `<span class="k">${"ABCD"[i]}</span><span>${esc(o)}</span>`;
    if (PR.mode === "practice" && picked >= 0) {
      if (i === q.ans) b.classList.add("right");
      else if (i === picked) b.classList.add("wrong");
      else b.classList.add("dim");
    } else if (picked === i) b.classList.add("sel");
    b.onclick = () => {
      if (PR.mode === "practice" && PR.ans[PR.i] >= 0) return;
      PR.ans[PR.i] = i;
      PR.ok[PR.i] = (i === q.ans);
      if (PR.mode === "practice") {
        if (i === q.ans) addXP(10);
        showExp(q, i);
      }
      renderPR();
    };
    box.appendChild(b);
  });
  const ex = $("prExp");
  if (PR.mode === "practice" && picked >= 0) { showExp(q, picked); } else ex.classList.add("hidden");
  $("prExplain").onclick = () => aiExplain(q);
}
function showExp(q, picked) {
  const ex = $("prExp");
  ex.classList.remove("hidden");
  ex.innerHTML = (picked === q.ans ? "<b>✅ सही!</b><br>" : "<b>❌ गलत।</b> सही उत्तर: <b>" + esc(q.opts[q.ans]) + "</b><br>") + esc(q.exp || "");
}
function finishPractice() {
  if (PR.timerId) clearInterval(PR.timerId);
  const total = PR.qs.length;
  const correct = PR.ok.filter(Boolean).length;
  const details = PR.qs.map((q, i) => ({ qid: q.id, subject: q.subject, topic: q.topic, ok: PR.ok[i] === true }));
  logAttempt({ kind: "practice", title: PR.title, total, correct, acc: total ? Math.round(correct / total * 100) : 0, secs: Math.round((Date.now() - PR.t0) / 1000), details });
  store.set("last_practice_ts", Date.now());
  checkAchievements();
  PR = null;
  openGen("🎉 अभ्यास पूर्ण", `<div class="score-big">${correct}/${total}</div><div class="score-sub">एक्यूरेसी ${total ? Math.round(correct / total * 100) : 0}% • +${correct * 10} XP</div><button class="btn gold" onclick="document.getElementById('genModal').classList.add('hidden');showScreen('scr-performance')">📈 प्रदर्शन देखें</button>`);
}

// ---- AI Explain ----
function aiExplain(q) {
  $("aiBody").innerHTML = '<div class="spinner"></div><p>समझाया जा रहा है...</p>';
  $("aiModal").classList.remove("hidden");
  if (!GEMINI_API_KEY || GEMINI_API_KEY.indexOf("%%") === 0) {
    $("aiBody").innerHTML = "<p>🤖 AI कुंजी अभी सेट नहीं है। सही उत्तर: <b>" + esc(q.opts[q.ans]) + "</b><br><br>" + esc(q.exp || "एक्सप्लेनेशन जल्द आ रहा है।") + "</p>";
    return;
  }
  if (!navigator.onLine) { $("aiBody").innerHTML = "<p>📡 इंटरनेट नहीं है — AI एक्सप्लेनेशन के लिए इंटरनेट आवश्यक है।</p>"; return; }
  const prompt = "इस प्रतिस्पर्धी परीक्षा के प्रश्न को बहुत सरल हिंदी में समझाएँ (2-4 पंक्तियाँ)। प्रश्न: " + q.q + " विकल्प: " + q.opts.join(" | ") + " सही उत्तर: " + q.opts[q.ans];
  fetch("https://generativelanguage.googleapis.com/v1beta/models/gemini-3-flash-preview:generateContent?key=" + GEMINI_API_KEY, {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
  }).then(r => r.json()).then(j => {
    const t = j && j.candidates && j.candidates[0] && j.candidates[0].content && j.candidates[0].content.parts && j.candidates[0].content.parts[0] && j.candidates[0].content.parts[0].text;
    $("aiBody").innerHTML = t ? "<p>" + esc(t).replace(/\n/g, "<br>") + "</p>" : "<p>AI से उत्तर नहीं मिला। पुनः प्रयास करें।</p>";
  }).catch(() => { $("aiBody").innerHTML = "<p>⚠️ AI से कनेक्ट नहीं हो पाया। इंटरनेट जाँचकर पुनः प्रयास करें।</p>"; });
}

// ============================================================
// MOCK SETUP + ENGINE (real exam interface)
// ============================================================
let MS = { type: "full" };
function renderMockSetup() {
  $$("#msTypes .mode").forEach(m => m.onclick = () => { $$("#msTypes .mode").forEach(x => x.classList.remove("on")); m.classList.add("on"); MS.type = m.dataset.t; renderMockSetup(); });
  const ex = EXAMS[U.profile.exam] || EXAMS["ssc-cgl"];
  $("msPattern").innerHTML = `<b>📋 ${esc(ex.name)} पैटर्न</b><br>
    <small style="color:var(--mut)">${ex.total} प्रश्न • ${ex.mins} मिनट • ${ex.marks} अंक/प्रश्न • नेगेटिव: ${ex.neg === 0 ? "नहीं" : "-" + ex.neg}<br>
    सेक्शन: ${Object.keys(ex.sections).map(s => (SUBJECTS[s] ? SUBJECTS[s].name : s) + " " + ex.sections[s]).join(" • ")}</small>`;
}
function buildMockQuestions() {
  const exId = U.profile.exam || "ssc-cgl";
  const ex = EXAMS[exId];
  let qs = [];
  if (MS.type === "smart") {
    // weak topics + unattempted first
    const wt = weakTopics(10).map(t => t.subject + "|" + t.topic);
    const weak = QB.filter(q => wt.indexOf(q.subject + "|" + q.topic) >= 0);
    const seen = new Set(); (store.get("history", [])).forEach(h => (h.details || []).forEach(d => seen.add(d.qid)));
    const fresh = QB.filter(q => !seen.has(q.id));
    const pool = weak.concat(fresh.filter(q => weak.indexOf(q) < 0)).concat(QB);
    qs = pool.slice(0, ex.total);
    return { qs, title: "🤖 स्मार्ट टेस्ट", ex };
  }
  if (MS.type === "pyq") {
    const pyq = QB.filter(q => q.pyq);
    qs = (pyq.length ? pyq : QB).slice(0, ex.total);
    return { qs, title: "📄 PYQ टेस्ट", ex };
  }
  // full mock: section-wise
  Object.keys(ex.sections).forEach(s => {
    let pool = QB.filter(q => q.subject === s);
    if (!pool.length) pool = QB.slice();
    qs = qs.concat(shuffle(pool).slice(0, ex.sections[s]));
  });
  if (qs.length < ex.total) qs = qs.concat(shuffle(QB).slice(0, ex.total - qs.length));
  return { qs: qs.slice(0, ex.total), title: "🧪 " + ex.name + " मॉक", ex };
}
let MK = null;
function startMock() {
  const b = buildMockQuestions();
  if (!b.qs.length) { toast("प्रश्न नहीं मिले"); return; }
  MK = {
    qs: b.qs, ex: b.ex, title: b.title, i: 0,
    ans: new Array(b.qs.length).fill(-1),
    mark: new Array(b.qs.length).fill(false),
    seen: new Array(b.qs.length).fill(false),
    t0: Date.now(), left: b.ex.mins * 60, timerId: null, qTime: new Array(b.qs.length).fill(0), qT0: Date.now()
  };
  MK.seen[0] = true;
  $("mkTitle").textContent = b.title;
  MK.timerId = setInterval(() => {
    MK.left--;
    const m = Math.floor(MK.left / 60), s = MK.left % 60;
    const t = $("mkTimer");
    t.textContent = m + ":" + String(s).padStart(2, "0");
    t.classList.toggle("low", MK.left < 300);
    if (MK.left <= 0) { toast("⏰ समय समाप्त! ऑटो-सबमिट हो रहा है..."); submitMock(true); }
  }, 1000);
  showScreen("scr-mock");
  renderMK(); renderPalette();
}
function mkStatus(i) {
  if (MK.ans[i] >= 0 && MK.mark[i]) return "ansmark";
  if (MK.ans[i] >= 0) return "ans";
  if (MK.mark[i]) return "mark";
  if (MK.seen[i]) return "skip";
  return "";
}
function renderMK() {
  const q = MK.qs[MK.i];
  MK.seen[MK.i] = true;
  $("mkCount").textContent = "Q " + (MK.i + 1) + "/" + MK.qs.length;
  $("mkSec").textContent = q.subject && SUBJECTS[q.subject] ? SUBJECTS[q.subject].icon + " " + SUBJECTS[q.subject].name : "";
  $("mkQ").textContent = q.q;
  const box = $("mkOpts"); box.innerHTML = "";
  q.opts.forEach((o, i) => {
    const b = document.createElement("button");
    b.className = "opt" + (MK.ans[MK.i] === i ? " sel" : "");
    b.innerHTML = `<span class="k">${"ABCD"[i]}</span><span>${esc(o)}</span>`;
    b.onclick = () => { MK.ans[MK.i] = i; renderMK(); renderPalette(); livePushSoon(); };
    box.appendChild(b);
  });
  $("mkMark").textContent = MK.mark[MK.i] ? "🚩 चिह्न हटाएँ" : "🚩 रिव्यू हेतु चिह्नित करें";
  renderPalette();
}
function renderPalette() {
  const p = $("mkPalette"); p.innerHTML = "";
  MK.qs.forEach((_, i) => {
    const d = document.createElement("div");
    d.className = "pal " + mkStatus(i);
    d.textContent = i + 1;
    d.onclick = () => { MK.qTime[MK.i] += Math.round((Date.now() - MK.qT0) / 1000); MK.qT0 = Date.now(); MK.i = i; renderMK(); };
    p.appendChild(d);
  });
}
function mkNav(d) {
  MK.qTime[MK.i] += Math.round((Date.now() - MK.qT0) / 1000); MK.qT0 = Date.now();
  MK.i = Math.min(MK.qs.length - 1, Math.max(0, MK.i + d));
  renderMK();
}
function submitMock(auto) {
  if (MK.timerId) clearInterval(MK.timerId);
  const liveId = (MK && MK.liveId) || null;
  const liveTitle = liveId ? MK.title : "";
  const ex = MK.ex;
  let correct = 0, wrong = 0, skipped = 0;
  const details = MK.qs.map((q, i) => {
    const a = MK.ans[i];
    let ok = null;
    if (a < 0) skipped++;
    else if (a === q.ans) { correct++; ok = true; } else { wrong++; ok = false; }
    return { qid: q.id, subject: q.subject, topic: q.topic, ok };
  });
  const negMarks = +(wrong * ex.neg).toFixed(2);
  const raw = correct * ex.marks;
  const final = +(raw - negMarks).toFixed(2);
  const total = MK.qs.length;
  const secs = Math.round((Date.now() - MK.t0) / 1000);
  const rec = {
    kind: "mock", title: MK.title, exam: U.profile.exam, total, correct, wrong, skipped,
    acc: total ? Math.round(correct / (correct + wrong || 1) * 100) : 0,
    pct: total ? Math.round(correct / total * 100) : 0,
    negMarks, finalScore: final, maxScore: total * ex.marks,
    secs, avgPerQ: total ? Math.round(secs / total) : 0, details, auto: !!auto
  };
  logAttempt(rec);
  store.set("last_practice_ts", Date.now());
  addXP(correct * 10);
  checkAchievements();
  const resQ = MK.qs.slice(); MK = null;
  try { stopLiveWatch(); } catch (e) {}
  if (liveId) submitLiveFinal(liveId, rec);
  renderResult(rec, resQ);
  showScreen("scr-result");
  if (liveId) {
    const box = document.createElement("div");
    box.className = "glass card"; box.id = "liveFinalBox";
    $("resultBody").prepend(box);
    renderLiveFinalBox(liveId, liveTitle.replace(/^🔴 /, ""), "liveFinalBox");
  }
}
function renderResult(r, qs) {
  const lb = myLocalRank();
  const pct = lb.pct;
  $("resultBody").innerHTML = `
    <div class="glass card gold-border">
      <div class="score-big">${r.finalScore}</div>
      <div class="score-sub">${esc(r.title)} • ${r.pct}% स्कोर</div>
      <div class="stat-grid">
        <div class="stat"><div class="v" style="color:var(--green)">${r.correct}</div><small>✅ सही</small></div>
        <div class="stat"><div class="v" style="color:var(--red)">${r.wrong}</div><small>❌ गलत</small></div>
        <div class="stat"><div class="v">${r.skipped}</div><small>⏭️ छोड़े गए</small></div>
        <div class="stat"><div class="v">${r.acc}%</div><small>🎯 एक्यूरेसी</small></div>
        <div class="stat"><div class="v">${Math.floor(r.secs / 60)}m ${r.secs % 60}s</div><small>⏱️ लिया गया समय</small></div>
        <div class="stat"><div class="v">${r.avgPerQ}s</div><small>औसत / प्रश्न</small></div>
        <div class="stat"><div class="v" style="color:var(--red)">-${r.negMarks}</div><small>नेगेटिव अंक</small></div>
        <div class="stat"><div class="v">+${r.correct * 10}</div><small>अर्जित XP</small></div>
      </div>
    </div>
    <div class="glass card">
      <b>🏆 प्रतियोगिता परिणाम</b>
      <div style="font-size:15px;margin-top:8px">आपकी रैंक: <b style="color:var(--gold)">#${lb.rank}</b></div>
      <div style="color:var(--mut);font-size:13px">आप ${pct}% विद्यार्थियों से बेहतर रहे।</div>
    </div>
    <button class="btn gold" id="resReview">📝 उत्तरों की समीक्षा करें</button>
    <div class="row2">
      <button class="btn ghost" id="resRetry">🔄 टेस्ट पुनः दें</button>
      <button class="btn ghost" id="resShare">📤 स्कोर शेयर करें</button>
    </div>
    <div class="row2">
      <button class="btn ghost" id="resWeak">⚠️ कमज़ोर टॉपिक अभ्यास</button>
    </div>
    <div id="revBox"></div>`;
  $("resRetry").onclick = () => showScreen("scr-mock-setup");
  $("resShare").onclick = () => shareScore(r);
  $("resWeak").onclick = () => startPractice({ mode: "weak", count: 25, title: "कमज़ोर टॉपिक अभ्यास" });
  $("resReview").onclick = () => {
    const rb = $("revBox"); rb.innerHTML = "";
    qs.forEach((q, i) => {
      const d = r.details[i];
      const div = document.createElement("div");
      div.className = "glass card rev-q";
      div.innerHTML = `<div class="rq"><b>Q${i + 1}.</b> ${esc(q.q)} ${d.ok === true ? "✅" : d.ok === false ? "❌" : "⏭️"}</div>
        <div style="font-size:13px;color:var(--mut)">सही: <b style="color:var(--green)">${esc(q.opts[q.ans])}</b></div>
        <div style="font-size:13px;margin-top:4px">${esc(q.exp || "")}</div>
        <button class="btn sm ghost" style="margin-top:8px">🤖 Explain</button>`;
      div.querySelector("button").onclick = () => aiExplain(q);
      rb.appendChild(div);
    });
    rb.scrollIntoView();
  };
}

// ============================================================
// LEADERBOARD (local bots + firebase when configured)
// ============================================================
const BOT_NAMES = ["Rahul", "Aman", "Priya", "Sneha", "Vikash", "Pooja", "Ravi", "Neha", "Suresh", "Kajal", "Amit", "Ritu", "Manoj", "Shalini", "Deepak", "Anjali", "Rohit", "Kavita", "Sanjay", "Meera"];
function botBoard(period) {
  const seed = period + todayKey().slice(0, period === "daily" ? 10 : 7);
  return BOT_NAMES.map((n, i) => {
    const h = hashStr(seed + n);
    const base = { daily: 300, weekly: 1500, monthly: 5000, overall: 20000 }[period];
    return { name: n, xp: base + (h % base), bot: true };
  }).sort((a, b) => b.xp - a.xp);
}
let LB_PERIOD = "daily";
function myLocalRank() {
  const board = botBoard(LB_PERIOD).concat([{ name: "YOU", xp: getXP(), me: true }]).sort((a, b) => b.xp - a.xp);
  const rank = board.findIndex(x => x.me) + 1;
  const pct = Math.round((1 - rank / board.length) * 100);
  return { rank, pct, board };
}
function renderLB() {
  $$("#lbTabs .tab").forEach(t => t.onclick = () => { $$("#lbTabs .tab").forEach(x => x.classList.remove("on")); t.classList.add("on"); LB_PERIOD = t.dataset.p; renderLB(); });
  const p = U.profile;
  const { rank, pct, board } = myLocalRank();
  const dname = p.priv ? (p.username || "Student") : (p.name || p.username || "Student");
  const meAv = (!p.priv && p.photo) ? `<img src="${esc(p.photo)}" class="login-av" style="width:52px;height:52px" alt="">` : "";
  $("lbMe").innerHTML = `<div style="display:flex;justify-content:space-between;align-items:center">
    <div><small style="color:var(--mut)">आपकी रैंक</small><div class="rank-num">#${rank}</div>
    <small style="color:var(--mut)">${esc(dname)} • ${getXP()} XP • शीर्ष ${pct}% • 🔥 ${getStreak()} दिन की स्ट्रीक</small></div>
    ${meAv || `<div style="font-size:40px">${rank <= 3 ? ["🥇", "🥈", "🥉"][rank - 1] : "🏅"}</div>`}</div>`;
  $("privToggle").checked = !!p.priv;
  $("privToggle").onchange = e => { const pp = U.profile; pp.priv = e.target.checked; U.profile = pp; renderLB(); };
  let html = "";
  board.slice(0, 50).forEach((b, i) => {
    const medal = i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : "#" + (i + 1);
    const nm = b.me ? esc(dname) + " (आप)" : esc(b.name);
    html += `<div class="lb-row ${b.me ? "me" : ""}"><div class="lb-pos">${medal}</div>
      <div class="lb-info"><b>${nm}</b><small>${b.me ? "🔥 " + getStreak() + " दिन की स्ट्रीक" : "प्रतियोगी"}</small></div>
      <div class="lb-xp">${b.xp} XP</div></div>`;
  });
  if (FB.on) html = `<div style="color:var(--green);font-size:12px;margin-bottom:8px">🌐 ऑनलाइन लीडरबोर्ड सक्रिय</div>` + html;
  else html = `<div style="color:var(--mut);font-size:12px;margin-bottom:8px">📱 लोकल लीडरबोर्ड — इंटरनेट + Firebase से ऑनलाइन रैंकिंग</div>` + html;
  $("lbList").innerHTML = html;
}

// ============================================================
// DAILY CHALLENGE
// ============================================================
function renderChallenge() {
  const done = store.get("ch_done", "") === todayKey();
  const qs = seededPick(QB, "ch" + todayKey(), 10);
  $("chBody").innerHTML = `
    <div class="glass card gold-border" style="text-align:center">
      <div style="font-size:44px">🔥</div>
      <h2>DAY ${dayNum()}</h2>
      <p style="color:var(--mut)">10 प्रश्न • 5 मिनट</p>
      <div class="streak" style="font-size:18px">🔥 ${getStreak()} दिन की स्ट्रीक</div>
      <div style="display:flex;gap:6px;justify-content:center;margin:12px 0">
        ${[1, 7, 30, 100].map(d => `<div class="stat" style="padding:8px"><div class="v" style="font-size:15px">${getStreak() >= d ? "🔥" : "·"}</div><small>${d} दिन</small></div>`).join("")}
      </div>
      <button class="btn ${done ? "ghost" : "gold"} big" id="btnChGo" ${done ? "disabled" : ""}>${done ? "✅ आज की चुनौती पूर्ण!" : "▶️ चुनौती शुरू करें"}</button>
    </div>`;
  if (!done) $("btnChGo").onclick = () => {
    // 10Q timed practice; on finish mark done
    const oldFinish = finishPractice;
    startPractice({ mode: "timed", count: 10, title: "Daily Challenge" });
    const iv = setInterval(() => {
      if (!PR) { clearInterval(iv); store.set("ch_done", todayKey()); addXP(50); notify("🔥 चुनौती पूर्ण!", "+50 बोनस XP मिले!"); }
    }, 1000);
  };
}

// ============================================================
// COMPETITION
// ============================================================
const COMP_TYPES = [
  { id: "daily-battle", name: "⚔️ दैनिक मुकाबला", desc: "10 प्रश्न • सबसे तेज़", count: 10, mins: 10 },
  { id: "subject-battle", name: "📚 विषय मुकाबला", desc: "25 प्रश्न • एक विषय", count: 25, mins: 25 },
  { id: "exam-battle", name: "🎯 परीक्षा मुकाबला", desc: "50 प्रश्न • परीक्षा पैटर्न", count: 50, mins: 60 },
  { id: "grand-test", name: "👑 ग्रैंड टेस्ट", desc: "100 प्रश्न • परीक्षा पैटर्न", count: 100, mins: 120 }
];
// ============================================================
// HOME EXTRAS — exam countdown, revision reminder, question of the day
// ============================================================
function renderHomeExtras() {
  const p = U.profile;
  // 1. Exam countdown
  const cc = $("homeCountCard");
  if (p.targetDate) {
    const t = new Date(p.targetDate + "T00:00:00").getTime();
    const days = Math.ceil((t - Date.now()) / 864e5);
    const ex = EXAMS[p.exam];
    cc.style.display = "";
    cc.innerHTML = days > 0
      ? `<div style="display:flex;justify-content:space-between;align-items:center">
           <div><small style="color:var(--mut)">🎯 ${ex ? esc(ex.name) : "लक्ष्य"} — परीक्षा में शेष</small>
           <div style="font-size:30px;font-weight:800;color:var(--gold)">${days} <small style="font-size:14px">दिन</small></div></div>
         <div style="font-size:40px">⏳</div></div>`
      : days === 0
        ? `<b>🎯 आज परीक्षा का दिन है!</b><div style="color:var(--mut);font-size:13px">शुभकामनाएँ! शांत मन से सर्वश्रेष्ठ प्रदर्शन करें।</div>`
        : `<b>🎯 लक्ष्य तिथि निकल गई</b><div style="color:var(--mut);font-size:13px">प्रोफ़ाइल में नई तिथि सेट करें।</div>`;
  } else cc.style.display = "none";
  // 2. Revision reminder — weak topics aur 2+ din se koi abhyas nahi
  const rc = $("homeRevCard");
  const wt = weakTopics(3);
  const lastPr = store.get("last_practice_ts", 0);
  if (wt.length && Date.now() - lastPr > 2 * 864e5) {
    rc.style.display = "";
    rc.innerHTML = `<b>🔁 रिवीज़न का समय!</b>
      <div style="color:var(--mut);font-size:13px;margin:6px 0">2+ दिन से अभ्यास नहीं हुआ। कमज़ोर टॉपिक: ${wt.map(t => esc(t.topic)).join(", ")}</div>
      <button class="btn gold" id="btnRevGo">▶️ 5 मिनट रिवीज़न शुरू करें</button>`;
    $("btnRevGo").onclick = () => startPractice({ mode: "weak", count: 10, title: "रिवीज़न अभ्यास" });
  } else rc.style.display = "none";
  // 3. Question of the day
  const qc = $("homeQotdCard");
  const q = seededPick(QB, "qotd" + todayKey(), 1)[0];
  if (q) {
    qc.style.display = "";
    const rev = store.get("qotd_rev", "") === todayKey();
    qc.innerHTML = `<div style="display:flex;justify-content:space-between;align-items:center">
        <b>💡 आज का प्रश्न</b><small style="color:var(--mut)">${SUBJECTS[q.subject] ? SUBJECTS[q.subject].icon : ""}</small></div>
      <div style="margin:8px 0;font-size:15px">${esc(q.q)}</div>
      ${rev
        ? `<div style="font-size:14px">✅ सही उत्तर: <b style="color:var(--green)">${esc(q.opts[q.ans])}</b></div>`
        : `<button class="btn ghost sm" id="btnQotdRev">👁️ उत्तर देखें</button>`}`;
    const br = $("btnQotdRev");
    if (br) br.onclick = () => { store.set("qotd_rev", todayKey()); renderHomeExtras(); };
  } else qc.style.display = "none";
}
// Share score card
function shareScore(r) {
  const txt = `🏆 RuhRank: मैंने "${r.title}" में ${r.finalScore}/${r.maxScore} स्कोर किया! (${r.pct}% स्कोर • ${r.acc}% एक्यूरेसी)\nPractice • Compete • Rank`;
  if (navigator.share) { navigator.share({ title: "RuhRank स्कोर", text: txt }).catch(() => {}); }
  else if (navigator.clipboard) { navigator.clipboard.writeText(txt).then(() => toast("✅ स्कोर कॉपी हो गया!")).catch(() => toast("❌ कॉपी नहीं हो सका")); }
  else toast("❌ शेयर उपलब्ध नहीं है");
}
function renderHomeLive() {  const el = $("homeLiveCard"); if (!el) return;
  const comps = store.get("fb_comp", []);
  const live = comps.find(c => { try { return compStatus(c) === "live"; } catch (e) { return false; } });
  const next = comps.filter(c => { try { return compStatus(c) === "upcoming"; } catch (e) { return false; } })
    .sort((a, b) => a.startTs - b.startTs)[0];
  const c = live || next;
  let sub;
  if (c) sub = live ? "🔴 " + c.title + " — लाइव है!" : "🕐 " + c.title;
  else sub = FB.on ? "जल्द आ रहा है" : "ऑनलाइन आवश्यक";
  el.innerHTML = `<div class="m-ico">🏆</div><b>लाइव प्रतियोगिता</b><small style="color:var(--mut)">${esc(sub)}</small>`;
  el.onclick = () => showScreen("scr-competition");
}
function compStatus(c) {
  const now = Date.now();
  const end = c.endTs || (c.startTs + 3600000);
  if (now < c.startTs) return "upcoming";
  if (now <= end) return "live";
  return "done";
}
function fmtCountdown(ms) {
  ms = Math.max(0, ms);
  const h = Math.floor(ms / 3600000), m = Math.floor(ms % 3600000 / 60000), s = Math.floor(ms % 60000 / 1000);
  return (h > 0 ? h + ":" : "") + String(m).padStart(2, "0") + ":" + String(s).padStart(2, "0");
}
function compDurMins(c) {
  if (c.durationMins) return c.durationMins;
  if (c.endTs && c.startTs) return Math.max(1, Math.round((c.endTs - c.startTs) / 60000));
  return Math.max(1, c.questionCount || 10);
}
let compTick = null;
function renderComp() {
  const body = $("compBody");
  const botHTML = `<h3 class="sec-title">⚔️ अभ्यास मुकाबले (बॉट्स के साथ)</h3>` + COMP_TYPES.map(t =>
    `<div class="glass card"><b>${t.name}</b><br><small style="color:var(--mut)">${t.desc}</small>
    <button class="btn gold" style="margin-top:8px" onclick="startCompBattle('${t.id}')">▶️ प्रतिस्पर्धा करें</button></div>`).join("");
  if (!FB.on) {
    body.innerHTML = `<div class="glass card" style="text-align:center">
      <div style="font-size:40px">🌐</div><b>ऑनलाइन आवश्यक</b>
      <div style="color:var(--mut);font-size:13px;margin-top:6px">लाइव बैटल के लिए इंटरनेट आवश्यक है।<br>अभ्यास मुकाबले ऑफ़लाइन उपलब्ध हैं।</div></div>` + botHTML;
    return;
  }
  const fb = store.get("fb_comp", []);
  const joined = store.get("joined_comp", {});
  let html = "";
  if (fb.length) {
    html += `<h3 class="sec-title">🔴 लाइव बैटल (ऑनलाइन)</h3>` + fb.map(c => {
      const st = compStatus(c);
      const meta = `📝 ${c.questionCount || 10} प्रश्न • ⏱️ ${compDurMins(c)} मिनट`;
      let action = "";
      if (st === "upcoming") {
        action = `<div style="margin:8px 0"><span class="cd">🕐 शुरू होगा: <span data-cd="${esc(c.id)}">${fmtCountdown(c.startTs - Date.now())}</span></span></div>` +
          (joined[c.id]
            ? `<button class="btn ghost" disabled>✅ आप जुड़े हुए हैं</button>`
            : `<button class="btn gold" style="margin-top:8px" onclick="joinLive('${esc(c.id)}')">🤝 बैटल से जुड़ें</button>`);
      } else if (st === "live") {
        action = `<div style="margin:8px 0"><span class="live-dot"></span> <b style="color:var(--red)">LIVE</b></div>
          <button class="btn gold" style="margin-top:8px" onclick="startLiveBattle('${esc(c.id)}')">▶️ बैटल में प्रवेश करें</button>`;
      } else {
        action = `<div style="margin:8px 0;color:var(--mut)">✅ समाप्त</div>
          <button class="btn ghost" style="margin-top:8px" onclick="viewLiveResults('${esc(c.id)}')">🏆 परिणाम देखें</button>`;
      }
      return `<div class="glass card"><b>${esc(c.title || "लाइव बैटल")}</b><br>
        <small style="color:var(--mut)">${esc(c.desc || "")}</small><br>
        <small style="color:var(--mut)">${meta}</small>${action}</div>`;
    }).join("");
  } else {
    html += `<div class="glass card" style="text-align:center"><div style="font-size:36px">🏆</div>
      <b>अभी कोई लाइव बैटल नहीं है</b><div style="color:var(--mut);font-size:13px">नया बैटल शेड्यूल होते ही यहाँ दिखेगा।</div></div>`;
  }
  html += botHTML;
  body.innerHTML = html;
  if (compTick) clearInterval(compTick);
  compTick = setInterval(() => {
    let flip = false;
    document.querySelectorAll("#compBody [data-cd]").forEach(el => {
      const c = store.get("fb_comp", []).find(x => x.id === el.dataset.cd);
      if (!c) return;
      const ms = c.startTs - Date.now();
      if (ms <= 0) flip = true; else el.textContent = fmtCountdown(ms);
    });
    if (flip) renderComp();
  }, 1000);
}
function liveDisplayName() {
  const p = U.profile;
  return p.priv ? (p.username || "Student") : (p.name || p.username || "Student");
}
function joinLiveSilent(id) {
  if (!FB.on) return;
  try {
    FB.db.collection("competitions").doc(id).collection("participants").doc(FB.uid).set({
      name: liveDisplayName(), photo: U.profile.photo || "",
      joinedAt: Date.now(), score: 0, answered: 0, submitted: false
    }, { merge: true }).catch(() => {});
  } catch (e) {}
}
window.joinLive = function (id) {
  if (!FB.on) { toast("🌐 ऑनलाइन आवश्यक है"); return; }
  joinLiveSilent(id);
  const j = store.get("joined_comp", {}); j[id] = 1; store.set("joined_comp", j);
  toast("✅ आप बैटल से जुड़ गए हैं!");
  setTimeout(renderComp, 800);
};
// ---------- live leaderboard ----------
let liveUnsub = null, livePushT = 0;
function stopLiveWatch() { if (liveUnsub) { try { liveUnsub(); } catch (e) {} liveUnsub = null; } }
function liveScoreOf(p) { return (p.submitted && p.finalScore != null) ? p.finalScore : (p.score || 0); }
function sortParts(ps) {
  return ps.sort((a, b) => (liveScoreOf(b) - liveScoreOf(a)) || ((a.timeTaken == null ? 1e15 : a.timeTaken) - (b.timeTaken == null ? 1e15 : b.timeTaken)));
}
function watchLiveBoard(compId) {
  stopLiveWatch();
  if (!FB.on) return;
  try {
    liveUnsub = FB.db.collection("competitions").doc(compId).collection("participants")
      .onSnapshot(s => {
        const ps = []; s.forEach(d => ps.push(Object.assign({ uid: d.id }, d.data())));
        renderLiveBoard(ps);
      }, () => {});
  } catch (e) {}
}
function renderLiveBoard(ps) {
  const box = $("mkLiveBoard"); if (!box) return;
  const sorted = sortParts(ps.slice());
  const myRank = sorted.findIndex(p => p.uid === FB.uid) + 1;
  const rows = sorted.slice(0, 10).map((p, i) =>
    `<div class="lb-row${p.uid === FB.uid ? " me" : ""}"><span>#${i + 1}</span>
     <span>${p.photo ? `<img src="${esc(p.photo)}" class="lb-av" alt="">` : ""}${esc(p.name || "Student")}${p.submitted ? " ✅" : ""}</span>
     <b>${liveScoreOf(p)}</b></div>`).join("");
  box.innerHTML = `<b>🏆 लाइव रैंकिंग</b>
    <div style="color:var(--mut);font-size:13px;margin:4px 0">आपकी रैंक: <b style="color:var(--gold)">#${myRank || "—"}</b> • ${sorted.length} प्रतिभागी</div>
    ${rows || "<small>प्रतिभागियों की प्रतीक्षा…</small>"}`;
}
function livePushSoon() {
  if (!FB.on || !MK || !MK.liveId) return;
  const now = Date.now();
  if (now - livePushT < 5000) return;
  livePushT = now;
  try {
    let correct = 0, answered = 0;
    MK.qs.forEach((q, i) => { if (MK.ans[i] >= 0) { answered++; if (MK.ans[i] === q.ans) correct++; } });
    FB.db.collection("competitions").doc(MK.liveId).collection("participants").doc(FB.uid)
      .set({ score: correct, answered }, { merge: true }).catch(() => {});
  } catch (e) {}
}
window.startLiveBattle = function (id) {
  const c = store.get("fb_comp", []).find(x => x.id === id);
  if (!c) { toast("प्रतियोगिता नहीं मिली"); return; }
  if (compStatus(c) !== "live") { toast("🔴 बैटल अभी लाइव नहीं है"); return; }
  const count = Math.min(c.questionCount || 10, QB.length);
  const qs = seededShuffle(QB, id).slice(0, count);
  if (!qs.length) { toast("प्रश्न नहीं मिले"); return; }
  joinLiveSilent(id);
  const j = store.get("joined_comp", {}); j[id] = 1; store.set("joined_comp", j);
  const mins = Math.max(1, Math.round(((c.endTs || (c.startTs + count * 60000)) - Date.now()) / 60000));
  livePushT = 0;
  MK = {
    qs, ex: { total: qs.length, mins, marks: 1, neg: 0.25, sections: {} },
    title: "🔴 " + (c.title || "लाइव बैटल"), i: 0,
    ans: new Array(qs.length).fill(-1), mark: new Array(qs.length).fill(false),
    seen: new Array(qs.length).fill(false),
    t0: Date.now(), left: mins * 60, timerId: null, qTime: new Array(qs.length).fill(0), qT0: Date.now(),
    comp: true, liveId: id
  };
  MK.seen[0] = true;
  $("mkTitle").textContent = MK.title;
  watchLiveBoard(id);
  MK.timerId = setInterval(() => {
    MK.left--;
    const m = Math.floor(MK.left / 60), s = MK.left % 60;
    $("mkTimer").textContent = m + ":" + String(s).padStart(2, "0");
    if (MK.left <= 0) submitMock(true);
  }, 1000);
  showScreen("scr-mock"); renderMK(); renderPalette();
};
function submitLiveFinal(compId, rec) {
  if (!FB.on) return;
  try {
    FB.db.collection("competitions").doc(compId).collection("participants").doc(FB.uid).set({
      score: rec.finalScore, correct: rec.correct, wrong: rec.wrong,
      timeTaken: rec.secs, submitted: true, submittedAt: Date.now()
    }, { merge: true }).catch(() => {});
  } catch (e) {}
}
function renderLiveFinalBox(compId, title, mountId) {
  const mount = $(mountId); if (!mount || !FB.on || !FB.db) return;
  mount.innerHTML = `<b>🔴 ${esc(title)} — अंतिम रैंकिंग</b><div style="color:var(--mut);font-size:13px">लोड हो रहा है…</div>`;
  FB.db.collection("competitions").doc(compId).collection("participants").get().then(s => {
    const ps = []; s.forEach(d => ps.push(Object.assign({ uid: d.id }, d.data())));
    const sorted = sortParts(ps);
    const myRank = sorted.findIndex(p => p.uid === FB.uid) + 1;
    const winner = sorted[0];
    mount.innerHTML = `<b>🔴 ${esc(title)} — अंतिम रैंकिंग</b>
      ${winner ? `<div style="margin:8px 0;font-size:15px">🏆 <b>विजेता:</b> ${esc(winner.name || "Student")} <b style="color:var(--gold)">${liveScoreOf(winner)} अंक</b></div>` : ""}
      <div style="font-size:15px;margin-bottom:8px">आपकी रैंक: <b style="color:var(--gold)">#${myRank}</b> / ${sorted.length}</div>` +
      sorted.slice(0, 10).map((p, i) =>
        `<div class="lb-row${p.uid === FB.uid ? " me" : ""}"><span>#${i + 1}</span>
         <span>${p.photo ? `<img src="${esc(p.photo)}" class="lb-av" alt="">` : ""}${esc(p.name || "Student")}</span>
         <b>${liveScoreOf(p)}</b></div>`).join("");
  }).catch(() => { mount.innerHTML = `<b>🔴 अंतिम रैंकिंग</b><div style="color:var(--mut)">लोड नहीं हो सका।</div>`; });
}
window.viewLiveResults = function (id) {
  const c = store.get("fb_comp", []).find(x => x.id === id);
  if (!c) { toast("प्रतियोगिता नहीं मिली"); return; }
  $("resultBody").innerHTML = `<div class="glass card" id="vrBox"></div><button class="btn ghost" data-back>← वापस जाएँ</button>`;
  showScreen("scr-result");
  renderLiveFinalBox(id, c.title || "लाइव बैटल", "vrBox");
};
window.startCompBattle = function (id) {
  const t = COMP_TYPES.find(x => x.id === id) || COMP_TYPES[0];
  // time-windowed mock vs bots
  const qs = shuffle(QB).slice(0, t.count);
  if (!qs.length) { toast("प्रश्न नहीं मिले"); return; }
  const saveMS = MS.type; MS.type = "full";
  const b = { qs, title: t.name, ex: { total: qs.length, mins: t.mins, marks: 1, neg: 0.25, sections: {} } };
  MK = {
    qs: b.qs, ex: b.ex, title: b.title, i: 0, ans: new Array(b.qs.length).fill(-1),
    mark: new Array(b.qs.length).fill(false), seen: new Array(b.qs.length).fill(false),
    t0: Date.now(), left: b.ex.mins * 60, timerId: null, qTime: new Array(b.qs.length).fill(0), qT0: Date.now(), comp: true
  };
  MK.seen[0] = true; MS.type = saveMS;
  $("mkTitle").textContent = b.title;
  MK.timerId = setInterval(() => {
    MK.left--;
    const m = Math.floor(MK.left / 60), s = MK.left % 60;
    $("mkTimer").textContent = m + ":" + String(s).padStart(2, "0");
    if (MK.left <= 0) submitMock(true);
  }, 1000);
  showScreen("scr-mock"); renderMK(); renderPalette();
};

// ============================================================
// PERFORMANCE
// ============================================================
function renderPerf() {
  const h = store.get("history", []);
  const tests = h.length, qs = totalSolved();
  const acc = h.length ? Math.round(h.reduce((s, x) => s + (x.acc || 0), 0) / h.length) : 0;
  const avg = h.length ? Math.round(h.reduce((s, x) => s + (x.pct != null ? x.pct : x.acc || 0), 0) / h.length) : 0;
  const best = myLocalRank().rank;
  // subject-wise
  const sub = {};
  h.forEach(x => (x.details || []).forEach(d => {
    sub[d.subject] = sub[d.subject] || { att: 0, ok: 0 };
    sub[d.subject].att++; if (d.ok) sub[d.subject].ok++;
  }));
  const wt = weakTopics(5);
  $("perfBody").innerHTML = `
    <div class="stat-grid">
      <div class="stat"><div class="v">${tests}</div><small>दिए गए टेस्ट</small></div>
      <div class="stat"><div class="v">${qs}</div><small>हल किए गए प्रश्न</small></div>
      <div class="stat"><div class="v">${acc}%</div><small>औसत एक्यूरेसी</small></div>
      <div class="stat"><div class="v">${avg}%</div><small>औसत स्कोर</small></div>
      <div class="stat"><div class="v">#${best}</div><small>वर्तमान रैंक</small></div>
      <div class="stat"><div class="v">🔥${getStreak()}</div><small>दिन की स्ट्रीक</small></div>
    </div>
    <h3 class="sec-title">📊 विषय प्रदर्शन</h3>
    ${Object.keys(sub).length ? Object.keys(sub).map(s => {
      const a = Math.round(sub[s].ok / sub[s].att * 100);
      return `<div class="bar-row"><div class="bl"><span>${SUBJECTS[s] ? SUBJECTS[s].icon + " " + SUBJECTS[s].name : s}</span><span>${a}%</span></div>
        <div class="bar"><div class="${a < 60 ? "low" : ""}" style="width:${a}%"></div></div></div>`;
    }).join("") : "<p style='color:var(--mut)'>अभी कोई टेस्ट नहीं दिया।</p>"}
    <h3 class="sec-title">⚠️ कमज़ोर टॉपिक</h3>
    ${wt.length ? wt.map(t => `<div class="lb-row"><div class="lb-info"><b>⚠️ ${esc(t.topic)}</b><small>${SUBJECTS[t.subject] ? SUBJECTS[t.subject].name : t.subject} • ${t.acc}% एक्यूरेसी (${t.att} प्रयास)</small></div></div>`).join("") +
      `<button class="btn gold" onclick="startPractice({mode:'weak',count:25,title:'कमज़ोर टॉपिक अभ्यास'})">▶️ कमज़ोर टॉपिक अभ्यास</button>`
      : "<p style='color:var(--mut)'>कोई कमज़ोर टॉपिक नहीं — बहुत बढ़िया! 🎉</p>"}
    <h3 class="sec-title">🕘 टेस्ट हिस्ट्री</h3>
    ${h.slice(0, 15).map(x => `<div class="lb-row"><div class="lb-info"><b>${esc(x.title || x.kind)}</b><small>${new Date(x.ts).toLocaleDateString("hi-IN")} • ${x.correct}/${x.total} • ${x.acc}%</small></div><div class="lb-xp">+${(x.correct || 0) * 10} XP</div></div>`).join("") || "<p style='color:var(--mut)'>हिस्ट्री खाली है।</p>"}`;
}

// ============================================================
// CURRENT AFFAIRS
// ============================================================
const CA_ARTICLES = [
  { cat: "Bihar", title: "बिहार: जातीय जनगणना के आंकड़े जारी", body: "बिहार सरकार ने जातीय जनगणना के आंकड़े जारी किए। अति पिछड़ा वर्ग सबसे बड़ा समूह है।" },
  { cat: "National", title: "नई शिक्षा नीति: स्कूली पाठ्यक्रम में बदलाव", body: "NEP 2020 के तहत स्कूली पाठ्यक्रम को कौशल-आधारित बनाने पर ज़ोर दिया जा रहा है।" },
  { cat: "Sports", title: "भारत की ओलंपिक 2036 की बोली", body: "भारत 2036 ओलंपिक खेलों की मेज़बानी की बोली की तैयारी कर रहा है।" },
  { cat: "Economy", title: "UPI लेन-देन ने बनाया रिकॉर्ड", body: "UPI के माध्यम से मासिक लेन-देन ने नया रिकॉर्ड बनाया, डिजिटल इंडिया को बढ़ावा।" },
  { cat: "Awards", title: "पद्म पुरस्कारों की घोषणा", body: "गणतंत्र दिवस की पूर्व संध्या पर पद्म पुरस्कारों की घोषणा की गई।" }
];
const CA_CATS = ["All", "National", "International", "Bihar", "Sports", "Awards", "Appointments", "Government Schemes", "Economy", "Science & Technology"];
let CA_F = "All";
function renderCA() {
  $("caCats").innerHTML = CA_CATS.map(c => `<button class="chip ${CA_F === c ? "on" : ""}" data-c="${c}">${c}</button>`).join("");
  $$("#caCats .chip").forEach(c => c.onclick = () => { CA_F = c.dataset.c; renderCA(); });
  const list = CA_ARTICLES.filter(a => CA_F === "All" || a.cat === CA_F);
  // also CA-subject questions as articles
  const caQs = QB.filter(q => q.subject === "ca").slice(0, 10);
  $("caList").innerHTML =
    list.map((a, i) => `<div class="glass card"><small style="color:var(--gold2)">${esc(a.cat)}</small><b style="display:block;margin:6px 0">${esc(a.title)}</b>
      <p style="color:var(--mut);font-size:14px">${esc(a.body)}</p>
      <button class="btn sm gold" onclick="caQuiz(${i})">📝 क्विज़ दें — 5 प्रश्न</button></div>`).join("") +
    (caQs.length ? `<div class="glass card"><b>📰 CA Question Bank</b><br><small style="color:var(--mut)">${caQs.length} प्रश्न</small>
      <button class="btn gold" style="margin-top:8px" onclick="startPractice({subject:'ca',topic:'all',count:10,mode:'practice',title:'CA अभ्यास'})">▶️ अभ्यास करें</button></div>` : "");
}
window.caQuiz = function (i) {
  const qs = seededPick(QB.filter(q => q.subject === "ca").concat(QB), "ca" + i + todayKey(), 5);
  if (!qs.length) { toast("क्विज़ के प्रश्न नहीं मिले"); return; }
  startPractice({ mode: "practice", count: 5, title: "CA Quiz" });
  // override picked set
  PR.qs = qs; PR.ans = new Array(qs.length).fill(-1); PR.ok = new Array(qs.length).fill(null); renderPR();
};

// ============================================================
// PYQ
// ============================================================
let PYQ = { exam: "bihar-police", year: "2024", sub: "gk" };
const PYQ_YEARS = ["2025", "2024", "2023", "2022", "2021", "2020"];
function renderPYQScreen() {
  $("pyqExams").innerHTML = Object.keys(EXAMS).map(id => `<button class="chip ${PYQ.exam === id ? "on" : ""}" data-e="${id}">${EXAMS[id].icon} ${esc(EXAMS[id].name)}</button>`).join("");
  $$("#pyqExams .chip").forEach(c => c.onclick = () => { PYQ.exam = c.dataset.e; renderPYQScreen(); });
  $("pyqYears").innerHTML = PYQ_YEARS.map(y => `<button class="chip ${PYQ.year === y ? "on" : ""}" data-y="${y}">${y}</button>`).join("");
  $$("#pyqYears .chip").forEach(c => c.onclick = () => { PYQ.year = c.dataset.y; renderPYQScreen(); });
  $("pyqSubs").innerHTML = Object.keys(SUBJECTS).map(s => `<button class="chip ${PYQ.sub === s ? "on" : ""}" data-s="${s}">${SUBJECTS[s].icon}</button>`).join("");
  $$("#pyqSubs .chip").forEach(c => c.onclick = () => { PYQ.sub = c.dataset.s; renderPYQScreen(); });
  const n = QB.filter(q => (!q.exams || q.exams.indexOf(PYQ.exam) >= 0) && q.subject === PYQ.sub).length;
  $("pyqInfo").innerHTML = `<b>${esc(EXAMS[PYQ.exam].name)} ${PYQ.year}</b> — ${SUBJECTS[PYQ.sub].name}<br><small style="color:var(--mut)">${n} प्रश्न उपलब्ध</small>`;
}
function pyqGo(mockMode) {
  let qs = QB.filter(q => (!q.exams || q.exams.indexOf(PYQ.exam) >= 0) && q.subject === PYQ.sub);
  if (!qs.length) qs = QB.filter(q => q.subject === PYQ.sub);
  if (!qs.length) qs = QB.slice();
  if (mockMode) {
    const ex = EXAMS[PYQ.exam];
    MK = { qs: qs.slice(0, ex.total), ex, title: "📄 " + ex.name + " " + PYQ.year + " पैटर्न", i: 0, ans: new Array(Math.min(qs.length, ex.total)).fill(-1), mark: [], seen: [], t0: Date.now(), left: ex.mins * 60, timerId: null, qTime: [], qT0: Date.now() };
    MK.mark = new Array(MK.qs.length).fill(false); MK.seen = new Array(MK.qs.length).fill(false); MK.seen[0] = true; MK.qTime = new Array(MK.qs.length).fill(0);
    $("mkTitle").textContent = MK.title;
    MK.timerId = setInterval(() => { MK.left--; const m = Math.floor(MK.left / 60), s = MK.left % 60; $("mkTimer").textContent = m + ":" + String(s).padStart(2, "0"); if (MK.left <= 0) submitMock(true); }, 1000);
    showScreen("scr-mock"); renderMK(); renderPalette();
  } else {
    startPractice({ subject: PYQ.sub, topic: "all", count: Math.min(qs.length, 50), mode: "practice", title: "पैटर्न " + PYQ.year + " अभ्यास" });
  }
}

// ============================================================
// BOOKMARKS
// ============================================================
function isBookmarked(qid) { return store.get("bm", []).indexOf(qid) >= 0; }
function toggleBookmark(qid) {
  let b = store.get("bm", []);
  if (b.indexOf(qid) >= 0) { b = b.filter(x => x !== qid); toast("🔖 हटाया गया"); }
  else { b.push(qid); toast("🔖 सेव हो गया!"); }
  store.set("bm", b);
}
function renderBookmarks() {
  const b = store.get("bm", []);
  const qs = b.map(id => QB.find(q => q.id === id)).filter(Boolean);
  $("bmBody").innerHTML = qs.length ? qs.map(q =>
    `<div class="glass card rev-q"><div class="rq"><b>${esc(q.topic)}</b> — ${esc(q.q)}</div>
     <div style="font-size:13px;color:var(--green)">सही: ${esc(q.opts[q.ans])}</div>
     <div class="qacts"><button class="btn sm ghost" onclick="aiExplainById('${q.id}')">🤖 Explain</button>
     <button class="btn sm ghost" onclick="toggleBookmark('${q.id}');renderBookmarks()">🗑️ हटाएँ</button></div></div>`
  ).join("") : "<p style='color:var(--mut);text-align:center;margin-top:40px'>🔖<br>कोई बुकमार्क नहीं।<br>प्रश्न पर 📑 दबाकर सेव करें।</p>";
}
window.aiExplainById = function (id) { const q = QB.find(x => x.id === id); if (q) aiExplain(q); };

// ============================================================
// ACHIEVEMENTS
// ============================================================
function renderAch() {
  const got = store.get("ach", []);
  $("achBody").innerHTML = `<div class="ach-grid">` + ACH.map(a =>
    `<div class="ach ${got.indexOf(a.id) >= 0 ? "got" : ""}"><div class="a-ico">${a.icon}</div><b>${a.name}</b><small>${a.desc}</small></div>`
  ).join("") + `</div>`;
}

// ============================================================
// PROFILE + SETTINGS
// ============================================================
function renderProfile() {
  const p = U.profile;
  const ex = EXAMS[p.exam];
  const r = myLocalRank();
  const headCard = isLoggedIn() ? "" : `
    <div class="glass card gold-border" style="text-align:center">
      <div style="font-size:52px">👤</div>
      <h2>${esc(p.name || p.username || "Student")}</h2>
      <p style="color:var(--mut)">${ex ? "🎯 " + esc(ex.name) : ""} • #${r.rank} रैंक • ${getXP()} XP</p>
      <div class="streak">🔥 ${getStreak()} day streak</div>
      <button class="btn ghost sm" style="margin-top:10px" id="pfEdit">✏️ नाम / लक्ष्य बदलें</button>
    </div>`;
  $("profBody").innerHTML = loginSectionHTML(p) + headCard + `
    <div class="set-row"><span>🌐 भाषा</span><button class="chip ${p.lang === "hi" ? "on" : ""}" id="langTgl">${p.lang === "hi" ? "हिंदी" : "English"}</button></div>
    <div class="set-row"><span>🔔 नोटिफिकेशन</span><button class="switch ${p.notif ? "on" : ""}" id="notifTgl"></button></div>
    <div class="set-row"><span>🔒 प्राइवेसी मोड</span><button class="switch ${p.priv ? "on" : ""}" id="privTgl"></button></div>
    <button class="btn ghost" data-go="scr-performance">📈 प्रदर्शन</button>
    <button class="btn ghost" data-go="scr-bookmarks">🔖 मेरे बुकमार्क</button>
    <button class="btn ghost" data-go="scr-achievements">🏅 उपलब्धियाँ</button>
    <button class="btn ghost" data-go="scr-search">🔍 खोजें</button>
    <button class="btn gold" id="btnUpdCheck">🔄 अपडेट चेक करें</button>
    <div class="glass card" style="text-align:center">
      <b>💬 फ़ीडबैक / संपर्क</b><br>
      <small style="color:var(--mut)">khanmdhasnain378@gmail.com<br>
      <a href="https://ig.me/m/ruhvibes1" style="color:var(--gold2)">Instagram: @ruhvibes1</a></small>
      <div class="foot-note">Made with ♥ by Hasnain<br>RuhRank 1.0</div>
    </div>`;
  const pfE = $("pfEdit");
  if (pfE) pfE.onclick = () => {
    openGen("✏️ प्रोफ़ाइल", `
      <label style="font-size:13px;color:var(--mut)">नाम</label>
      <input id="fName" class="searchbox" value="${esc(p.name || "")}" placeholder="आपका नाम">
      <label style="font-size:13px;color:var(--mut)">यूज़रनेम</label>
      <input id="fUser" class="searchbox" value="${esc(p.username || "")}" placeholder="यूज़रनेम">
      <label style="font-size:13px;color:var(--mut)">लक्ष्य परीक्षा तिथि</label>
      <input id="fTarget" type="date" class="searchbox" value="${esc(p.targetDate || "")}">
      <button class="btn gold" id="fSave">सेव करें</button>`);
    $("fSave").onclick = () => {
      const pp = U.profile;
      pp.name = $("fName").value.trim(); pp.username = $("fUser").value.trim() || "student" + Math.floor(Math.random() * 9999);
      pp.targetDate = $("fTarget").value || "";
      U.profile = pp; $("genModal").classList.add("hidden"); renderProfile(); toast("✅ सेव हो गया!");
    };
  };
  $("langTgl").onclick = () => { const pp = U.profile; pp.lang = pp.lang === "hi" ? "en" : "hi"; U.profile = pp; renderProfile(); };
  $("notifTgl").onclick = e => { const pp = U.profile; pp.notif = !pp.notif; U.profile = pp; e.target.classList.toggle("on", pp.notif); };
  $("privTgl").onclick = e => { const pp = U.profile; pp.priv = !pp.priv; U.profile = pp; e.target.classList.toggle("on", pp.priv); };
  $("btnUpdCheck").onclick = () => checkUpdate(true);
}

// ============================================================
// SEARCH
// ============================================================
function renderSearch() {
  const box = $("searchBox");
  const doSearch = () => {
    const s = box.value.trim().toLowerCase();
    if (!s) { $("searchRes").innerHTML = ""; return; }
    let html = "";
    const exHit = Object.keys(EXAMS).filter(id => EXAMS[id].name.toLowerCase().includes(s));
    if (exHit.length) html += `<h3 class="sec-title">Exams</h3>` + exHit.map(id => `<div class="lb-row"><div class="lb-info"><b>${EXAMS[id].icon} ${esc(EXAMS[id].name)}</b><small>${EXAMS[id].total} प्रश्न • ${EXAMS[id].mins} मिनट</small></div></div>`).join("");
    const qHit = QB.filter(q => q.q.toLowerCase().includes(s) || (q.topic || "").toLowerCase().includes(s)).slice(0, 15);
    if (qHit.length) html += `<h3 class="sec-title">Questions (${qHit.length})</h3>` + qHit.map(q =>
      `<div class="glass card rev-q"><div class="rq">${esc(q.q)}</div><div style="font-size:13px;color:var(--green)">सही: ${esc(q.opts[q.ans])}</div>
       <div class="qacts"><button class="btn sm ghost" onclick="aiExplainById('${q.id}')">🤖 Explain</button>
       <button class="btn sm ghost" onclick="toggleBookmark('${q.id}')">🔖 सेव करें</button></div></div>`).join("");
    const tHit = Array.from(new Set(QB.map(q => q.topic))).filter(t => t.toLowerCase().includes(s)).slice(0, 10);
    if (tHit.length) html += `<h3 class="sec-title">Topics</h3><div class="chip-row">` + tHit.map(t => `<button class="chip" onclick="startPractice({topic:'${esc(t)}',subject:'all',count:10,mode:'practice',title:'${esc(t)}'})">${esc(t)}</button>`).join("") + `</div>`;
    $("searchRes").innerHTML = html || "<p style='color:var(--mut)'>कुछ नहीं मिला।</p>";
  };
  box.oninput = doSearch;
}

// ============================================================
// NOTIFICATIONS SCREEN
// ============================================================
function renderNotifs() {
  const local = store.get("notifs", []);
  const fb = store.get("fb_notif", []);
  const all = fb.map(n => ({ title: n.title, body: n.body, ts: n.ts, fb: true }))
    .concat(local).sort((a, b) => b.ts - a.ts);
  // mark read
  const l = store.get("notifs", []); l.forEach(n => n.read = true); store.set("notifs", l);
  renderNotifDot();
  $("notifBody").innerHTML = all.length ? all.map(n =>
    `<div class="notif"><b>${esc(n.title)}${n.fb ? ' <small style="color:var(--green)">🌐</small>' : ""}</b><br>
     <small>${esc(n.body || "")}</small><br><small style="color:var(--mut)">${new Date(n.ts).toLocaleString("hi-IN")}</small></div>`
  ).join("") : "<p style='color:var(--mut);text-align:center;margin-top:40px'>🔔<br>कोई नोटिफिकेशन नहीं।</p>";
}

// ============================================================
// WIRING + BOOT
// ============================================================
function wire() {
  $("btnRetryNet").onclick = checkNet;
  $("btnOfflineGo").onclick = () => $("offlineOverlay").classList.add("hidden");
  $("btnLaterUpdate").onclick = () => $("updateDialog").classList.add("hidden");
  $("aiClose").onclick = () => $("aiModal").classList.add("hidden");
  $("genClose").onclick = () => $("genModal").classList.add("hidden");
  $("btnStartPractice").onclick = () => startPractice({ subject: PS.subject, topic: PS.topic, count: PS.count, mode: PS.mode, title: "अभ्यास" });
  $("prPrev").onclick = () => { if (PR && PR.i > 0) { PR.i--; renderPR(); } };
  $("prNext").onclick = () => { if (PR) { if (PR.i < PR.qs.length - 1) { PR.i++; renderPR(); } else finishPractice(); } };
  $("prFinish").onclick = () => { if (PR && confirm("अभ्यास समाप्त करें?")) finishPractice(); };
  $("btnStartMock").onclick = startMock;
  $("mkPrev").onclick = () => mkNav(-1);
  $("mkNext").onclick = () => mkNav(1);
  $("mkClear").onclick = () => { if (MK) { MK.ans[MK.i] = -1; renderMK(); } };
  $("mkMark").onclick = () => { if (MK) { MK.mark[MK.i] = !MK.mark[MK.i]; renderMK(); } };
  const mlb = $("mkLiveBtn");
  if (mlb) mlb.onclick = () => { const b = $("mkLiveBoard"); if (b) b.classList.toggle("hidden"); };
  $("mkSubmit").onclick = () => {
    if (!MK) return;
    const un = MK.ans.filter(a => a < 0).length;
    openGen("✅ टेस्ट सबमिट करें?", `<p style="color:var(--mut)">उत्तर दिए: ${MK.qs.length - un}/${MK.qs.length} • अनुत्तरित: ${un}</p>
      <button class="btn gold" id="cfYes">हाँ, सबमिट करें</button>
      <button class="btn ghost" onclick="document.getElementById('genModal').classList.add('hidden')">अभी नहीं</button>`);
    $("cfYes").onclick = () => { $("genModal").classList.add("hidden"); submitMock(false); };
  };
  $("pyqPractice").onclick = () => pyqGo(false);
  $("pyqMock").onclick = () => pyqGo(true);
  // seed welcome notifs
  if (!store.get("seeded", false)) {
    store.set("seeded", true);
    notify("🎉 RuhRank में स्वागत है!", "अपना लक्ष्य परीक्षा चुनें और अभ्यास शुरू करें।");
    notify("🔥 दैनिक चुनौती लाइव है!", "रोज़ 10 प्रश्न, 5 मिनट — स्ट्रीक बनाएँ!");
  }
}
function boot() {
  wire();
  fbInit();
  fetchRemoteQB();
  checkNet();
  renderOnboard();
  if (store.get("onboard", false) && U.profile.exam) { navStack = []; showScreen("scr-home"); }
  else { navStack = []; showScreen("scr-onboard", true); }
  // daily update check
  if (store.get("upd_check", "") !== todayKey()) setTimeout(() => checkUpdate(false), 5000);
  renderNotifDot();
}
document.addEventListener("DOMContentLoaded", boot);
