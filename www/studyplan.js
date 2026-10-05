/* ============================================================
   RuhRank — 30-Day Study Plan generator (Phase 2)
   Existing SYLLABUS data (app.js) se 30 din ka day-wise plan
   banata hai: har din 3-4 topics, subject-wise distributed.
   ============================================================ */
"use strict";

// Plan wali exams — har exam apne SYLLABUS key se topics leti hai
const STUDY_PLAN_EXAMS = [
  { id: "daroga",  name: "बिहार दरोगा",        icon: "🚔", syl: "bpssc-mains" },
  { id: "ssc",     name: "SSC (CGL/CHSL/GD)",  icon: "🏛️", syl: "ssc-cgl" },
  { id: "railway", name: "Railway (NTPC/Gr-D)", icon: "🚂", syl: "rrb-ntpc" },
  { id: "bpsc",    name: "BPSC",               icon: "🏛️", syl: "bpsc" }
];

// Generic fallback topics (agar SYLLABUS load na hua ho to)
const PLAN_FALLBACK = [
  { sec: "GK",        topic: "इतिहास — प्राचीन भारत" },
  { sec: "GK",        topic: "राजव्यवस्था — संविधान" },
  { sec: "GK",        topic: "भूगोल — भारत" },
  { sec: "GK",        topic: "सामान्य विज्ञान" },
  { sec: "Maths",     topic: "प्रतिशत / अनुपात" },
  { sec: "Maths",     topic: "लाभ-हानि / ब्याज" },
  { sec: "Reasoning", topic: "श्रृंखला" },
  { sec: "Reasoning", topic: "कोडिंग-डिकोडिंग" },
  { sec: "English",   topic: "Vocabulary" },
  { sec: "करेंट",      topic: "राष्ट्रीय करेंट अफेयर्स" }
];

// 30 din ka plan generate karo. Har din 4 topics (subject-wise round-robin),
// har 7vaan din saptahik revision, day 30 grand revision.
function genStudyPlan(sylKey) {
  let flat = [];
  try {
    const SYL = (typeof SYLLABUS !== "undefined") ? SYLLABUS : null;
    const syl = SYL && SYL[sylKey];
    if (syl && Array.isArray(syl.sections)) {
      // sections ko interleave karo taaki roz alag-alag subject mile
      const per = syl.sections.map(sec => (sec.topics || []).map(t => ({ sec: sec.name, topic: t })));
      let more = true;
      while (more) {
        more = false;
        per.forEach(list => {
          if (list.length) { flat.push(list.shift()); more = true; }
        });
      }
    }
  } catch (e) {}
  if (!flat.length) flat = PLAN_FALLBACK.slice();

  const days = [];
  let idx = 0;
  for (let d = 1; d <= 30; d++) {
    const items = [];
    for (let k = 0; k < 4; k++) { items.push(flat[idx % flat.length]); idx++; }
    let label = "📅 Day " + d, note = "";
    if (d === 30) {
      label = "🏆 Day 30 — ग्रैंड रिवीज़न";
      note = "पूरे सिलेबस का रिवीज़न करें और एक फुल मॉक टेस्ट अवश्य दें।";
    } else if (d % 7 === 0) {
      label = "🔁 Day " + d + " — साप्ताहिक रिवीज़न";
      note = "इस सप्ताह पढ़े सभी टॉपिक दोहराएँ + 1 प्रैक्टिस सेट हल करें।";
    }
    days.push({ day: d, label: label, items: items, note: note });
  }
  return days;
}
