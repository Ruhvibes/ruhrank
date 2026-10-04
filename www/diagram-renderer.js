/* ============================================================
   RuhRank — SVG Diagram Renderer (standalone snippet)
   - Koi external dependency nahi, sirf string building.
   - Usage: renderDiagram(d) -> SVG string, ya '' (invalid input).
   - Kabhi throw nahi karta; unknown t / galat numbers / null -> ''.
   - XSS-safe: numbers Number() se sanitize, labels me <>&" escape.
   - Theme: transparent bg, gold #d4af37 strokes, light labels.
   ============================================================ */

var DG_GOLD = '#d4af37';
var DG_GOLD2 = '#ffd75e';
var DG_GOLDD = '#8a6d1f';
var DG_TXT = '#eef1ff';
var DG_MUT = '#9aa3c7';
var DG_FONT = 'font-family="system-ui,\'Segoe UI\',Roboto,\'Noto Sans Devanagari\',\'Mangal\',sans-serif"';

/* ---------- sanitizers ---------- */
function dg_esc(s) {
  return String(s === null || s === undefined ? '' : s)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;')
    .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}
function dg_num(v) {           /* strictly positive number, ya null */
  var n = Number(v);
  return (typeof n === 'number' && isFinite(n) && n > 0) ? n : null;
}
function dg_fin(v) {           /* koi bhi finite number, ya null */
  var n = Number(v);
  return (typeof n === 'number' && isFinite(n)) ? n : null;
}
function dg_fmt(v) {           /* 5 -> "5", 3.14159 -> "3.14" */
  var n = Math.round(Number(v) * 100) / 100;
  return String(n);
}
function dg_trunc(s, n) {
  s = String(s === null || s === undefined ? '' : s);
  return s.length > n ? s.slice(0, n - 1) + '…' : s;
}

/* ---------- svg scaffolding ---------- */
function dg_svg(vb, inner) {
  return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="' + vb + '"' +
    ' style="max-width:100%;height:auto;display:block" ' + DG_FONT + '>' + inner + '</svg>';
}
function dg_t(x, y, s, sz, fill, anchor, bold) {
  return '<text x="' + x + '" y="' + y + '" font-size="' + sz + '" fill="' + (fill || DG_TXT) +
    '" text-anchor="' + (anchor || 'middle') + '"' + (bold ? ' font-weight="700"' : '') + '>' +
    dg_esc(s) + '</text>';
}
function dg_line(x1, y1, x2, y2, w, col) {
  return '<line x1="' + x1 + '" y1="' + y1 + '" x2="' + x2 + '" y2="' + y2 +
    '" stroke="' + (col || DG_GOLD) + '" stroke-width="' + (w || 2) + '" stroke-linecap="round"/>';
}
var DG_ARROW_DEF = '<defs><marker id="dgArr" viewBox="0 0 10 10" refX="8" refY="5" ' +
  'markerWidth="7" markerHeight="7" orient="auto-start-reverse">' +
  '<path d="M0,0 L10,5 L0,10 z" fill="' + DG_GOLD + '"/></marker></defs>';

/* ==================== 2D SHAPES ==================== */

function dg_tri(d) {
  var a = dg_num(d.a), b = dg_num(d.b), c = dg_num(d.c);
  /* alias: base+h (samkon trikon) -> karn nikaalo */
  if (a === null && d.base !== undefined && d.h !== undefined) {
    var bs = dg_num(d.base), hh = dg_num(d.h);
    if (bs !== null && hh !== null) { a = bs; b = hh; c = Math.sqrt(bs * bs + hh * hh); }
  }
  if (a === null || b === null || c === null) return '';
  if (!(a + b > c && b + c > a && a + c > b)) return '';   /* triangle inequality */
  var sc = 165 / Math.max(a, b, c);
  var Ax = 47, Ay = 146, Bx = 47 + c * sc, By = 146;
  var rel = (b * b + c * c - a * a) / (2 * c);             /* C ka x (A se) */
  var h2 = b * b - rel * rel;
  if (h2 <= 0) return '';
  var Cx = 47 + rel * sc, Cy = 146 - Math.sqrt(h2) * sc;
  var pts = Ax + ',' + Ay + ' ' + Bx + ',' + By + ' ' + Cx + ',' + Cy;
  var gx = (Ax + Bx + Cx) / 3, gy = (Ay + By + Cy) / 3;   /* centroid: labels bahar */
  function midLbl(px, py, qx, qy, txt) {
    var mx = (px + qx) / 2, my = (py + qy) / 2;
    var dx = mx - gx, dy = my - gy, L = Math.sqrt(dx * dx + dy * dy) || 1;
    return dg_t(Math.round(mx + dx / L * 13), Math.round(my + dy / L * 13 + 4), txt, 11, DG_GOLD2);
  }
  function vtx(px, py, lx, ly, ch) {
    return '<circle cx="' + px + '" cy="' + py + '" r="3" fill="' + DG_GOLD + '"/>' +
      dg_t(px + lx, py + ly, ch, 13, DG_TXT, 'middle', true);
  }
  var s = '<polygon points="' + pts + '" fill="rgba(212,175,55,.12)" stroke="' + DG_GOLD + '" stroke-width="2" stroke-linejoin="round"/>';
  s += vtx(Ax, Ay, -12, 5, 'A') + vtx(Bx, By, 12, 5, 'B') + vtx(Cx, Cy, 0, -10, 'C');
  s += midLbl(Bx, By, Cx, Cy, 'a = ' + dg_fmt(a));
  s += midLbl(Cx, Cy, Ax, Ay, 'b = ' + dg_fmt(b));
  s += midLbl(Ax, Ay, Bx, By, 'c = ' + dg_fmt(c));
  return dg_svg('0 0 260 180', s);
}

function dg_rect(d, square) {
  /* aliases: l/b (Hindi "lambai/chaudai") -> w/h ; sq me p (parimap) -> s */
  var w = dg_num(d.w !== undefined ? d.w : d.l), h = dg_num(d.h !== undefined ? d.h : d.b);
  if (square) {
    var s0 = dg_num(d.s);
    if (s0 === null) { var pp = dg_num(d.p); if (pp === null) return ''; s0 = pp / 4; }
    w = s0; h = s0;
  }
  if (w === null || h === null) return '';
  var sc = Math.min(196 / w, 112 / h);
  var W = w * sc, H = h * sc, x0 = (260 - W) / 2, y0 = (180 - H) / 2;
  var s = '<rect x="' + x0 + '" y="' + y0 + '" width="' + W + '" height="' + H +
    '" fill="rgba(212,175,55,.10)" stroke="' + DG_GOLD + '" stroke-width="2" rx="2"/>';
  s += dg_t(260 / 2, y0 + H + 20, 'w = ' + dg_fmt(w), 12, DG_GOLD2);
  s += dg_t(x0 - 8, y0 + H / 2 + 4, 'h = ' + dg_fmt(h), 12, DG_GOLD2, 'end');
  return dg_svg('0 0 260 180', s);
}

function dg_circle(d) {
  var r = dg_num(d.r), dd = null;
  if (r === null) { dd = dg_num(d.d); if (dd !== null) r = dd / 2; }
  if (r === null) return '';
  var cx = 130, cy = 88, R = 62;
  var ex = cx + R * 0.72, ey = cy - R * 0.69;              /* ~44° radius line */
  var s = '<circle cx="' + cx + '" cy="' + cy + '" r="' + R + '" fill="rgba(212,175,55,.10)" stroke="' + DG_GOLD + '" stroke-width="2"/>';
  s += '<circle cx="' + cx + '" cy="' + cy + '" r="3.5" fill="' + DG_GOLD + '"/>';
  s += dg_line(cx, cy, ex, ey, 2);
  s += dg_t((cx + ex) / 2 + 6, (cy + ey) / 2 - 8, 'त्रिज्या = ' + dg_fmt(r), 12, DG_GOLD2);
  if (dd !== null) s += dg_t(cx, cy + R + 22, 'व्यास = ' + dg_fmt(dd), 12, DG_MUT);
  return dg_svg('0 0 260 180', s);
}

/* ==================== 3D SHAPES ==================== */

function dg_cube(d) {
  var s0 = dg_num(d.s);
  if (s0 === null) return '';
  var F = 80, x0 = 66, y0 = 62, ox = 40, oy = -34;        /* front square + offset back */
  var x1 = x0 + F, y1 = y0 + F;
  var s = '<rect x="' + (x0 + ox) + '" y="' + (y0 + oy) + '" width="' + F + '" height="' + F +
    '" fill="rgba(212,175,55,.05)" stroke="' + DG_GOLD + '" stroke-width="1.5"/>';
  s += dg_line(x0, y0, x0 + ox, y0 + oy, 1.5) + dg_line(x1, y0, x1 + ox, y0 + oy, 1.5) +
       dg_line(x0, y1, x0 + ox, y1 + oy, 1.5) + dg_line(x1, y1, x1 + ox, y1 + oy, 1.5);
  s += '<rect x="' + x0 + '" y="' + y0 + '" width="' + F + '" height="' + F +
    '" fill="rgba(212,175,55,.12)" stroke="' + DG_GOLD + '" stroke-width="2"/>';
  s += dg_t(x0 + F / 2, y1 + 22, 's = ' + dg_fmt(s0), 12, DG_GOLD2);
  return dg_svg('0 0 260 180', s);
}

function dg_cuboid(d) {
  var l = dg_num(d.l), w = dg_num(d.w !== undefined ? d.w : d.b), h = dg_num(d.h);
  if (l === null || w === null || h === null) return '';
  var sc = Math.min(150 / l, 96 / h);
  var lw = l * sc, lh = h * sc;
  var dw = Math.min(56, w * sc);                          /* depth chhota rakho */
  var dx = dw * 0.62, dy = dw * 0.5;
  var x0 = 52, y0 = 58, x1 = x0 + lw, y1 = y0 + lh;
  var s = '<rect x="' + (x0 + dx) + '" y="' + (y0 - dy) + '" width="' + lw + '" height="' + lh +
    '" fill="rgba(212,175,55,.05)" stroke="' + DG_GOLD + '" stroke-width="1.5"/>';
  s += dg_line(x0, y0, x0 + dx, y0 - dy, 1.5) + dg_line(x1, y0, x1 + dx, y0 - dy, 1.5) +
       dg_line(x0, y1, x0 + dx, y1 - dy, 1.5) + dg_line(x1, y1, x1 + dx, y1 - dy, 1.5);
  s += '<rect x="' + x0 + '" y="' + y0 + '" width="' + lw + '" height="' + lh +
    '" fill="rgba(212,175,55,.12)" stroke="' + DG_GOLD + '" stroke-width="2"/>';
  s += dg_t(x0 + lw / 2, y1 + 20, 'l = ' + dg_fmt(l), 12, DG_GOLD2);
  s += dg_t(x0 - 8, y0 + lh / 2 + 4, 'h = ' + dg_fmt(h), 12, DG_GOLD2, 'end');
  s += dg_t(x1 + dx / 2 + 10, y0 - dy / 2 - 6, 'w = ' + dg_fmt(w), 12, DG_GOLD2);
  return dg_svg('0 0 260 180', s);
}

function dg_cyl(d) {
  var r = dg_num(d.r), h = dg_num(d.h);
  if (r === null || h === null) return '';
  var cx = 130, rx = 58, ry = 13, ty = 52, by = 140;
  var s = '<ellipse cx="' + cx + '" cy="' + by + '" rx="' + rx + '" ry="' + ry +
    '" fill="rgba(212,175,55,.06)" stroke="' + DG_GOLD + '" stroke-width="2"/>';
  s += dg_line(cx - rx, ty, cx - rx, by, 2) + dg_line(cx + rx, ty, cx + rx, by, 2);
  s += '<ellipse cx="' + cx + '" cy="' + ty + '" rx="' + rx + '" ry="' + ry +
    '" fill="rgba(212,175,55,.14)" stroke="' + DG_GOLD + '" stroke-width="2"/>';
  s += dg_line(cx, ty, cx + rx, ty, 1.5, DG_GOLD2);
  s += dg_t(cx + rx / 2, ty - 10, 'r = ' + dg_fmt(r), 12, DG_GOLD2);
  s += dg_t(cx - rx - 8, (ty + by) / 2 + 4, 'h = ' + dg_fmt(h), 12, DG_GOLD2, 'end');
  return dg_svg('0 0 260 180', s);
}

/* ==================== CHARTS ==================== */

function dg_bar(d) {
  var L = d.labels, V = d.data;
  if (!Array.isArray(L) || !Array.isArray(V) || L.length !== V.length) return '';
  var n = L.length;
  if (n < 1 || n > 8) return '';
  var vals = [], max = 0, i, v;
  for (i = 0; i < n; i++) {
    v = dg_fin(V[i]);
    if (v === null || v < 0) return '';
    vals.push(v); if (v > max) max = v;
  }
  if (max <= 0) return '';
  var top = 16, bot = 148, left = 22, right = 254, slot = (right - left) / n;
  var bw = Math.min(44, slot * 0.62), s = '';
  for (i = 0; i < n; i++) {
    var bh = (vals[i] / max) * (bot - top - 24);
    var x = left + i * slot + (slot - bw) / 2, y = bot - bh;
    s += '<rect x="' + x.toFixed(1) + '" y="' + y.toFixed(1) + '" width="' + bw.toFixed(1) +
      '" height="' + bh.toFixed(1) + '" rx="3" fill="' + DG_GOLD + '" stroke="' + DG_GOLDD + '" stroke-width="1"/>';
    s += dg_t(x + bw / 2, y - 6, dg_fmt(vals[i]), 11, DG_GOLD2, 'middle', true);
    s += dg_t(x + bw / 2, bot + 15, dg_trunc(L[i], 8), 10, DG_TXT);
  }
  s += dg_line(left - 6, bot, right, bot, 1.5, DG_MUT);
  return dg_svg('0 0 260 180', s);
}

function dg_pie(d) {
  var L = d.labels, V = d.data;
  if (!Array.isArray(L) || !Array.isArray(V) || L.length !== V.length) return '';
  var n = L.length;
  if (n < 1) return '';
  var vals = [], labs = [], i, v, sum = 0;
  for (i = 0; i < n && i < 6; i++) {
    v = dg_fin(V[i]);
    if (v === null || v < 0) return '';
    vals.push(v); labs.push(L[i]); sum += v;
  }
  if (n > 6) {                                            /* baaki "अन्य" me */
    var rest = 0;
    for (i = 6; i < n; i++) { v = dg_fin(V[i]); if (v === null || v < 0) return ''; rest += v; }
    vals.push(rest); labs.push('अन्य'); sum += rest;
  }
  if (sum <= 0) return '';
  var cols = [DG_GOLD, '#f0c93f', DG_GOLD2, '#a8842c', '#7a5f1e', '#cfd6f2', '#9aa3c7'];
  var cx = 84, cy = 92, R = 56, ang = -Math.PI / 2, s = '';
  for (i = 0; i < vals.length; i++) {
    var a1 = ang, a2 = ang + (vals[i] / sum) * Math.PI * 2, mid = (a1 + a2) / 2;
    var x1 = cx + R * Math.cos(a1), y1 = cy + R * Math.sin(a1);
    var x2 = cx + R * Math.cos(a2), y2 = cy + R * Math.sin(a2);
    var large = (a2 - a1) > Math.PI ? 1 : 0;
    s += '<path d="M' + cx + ',' + cy + ' L' + x1.toFixed(1) + ',' + y1.toFixed(1) +
      ' A' + R + ',' + R + ' 0 ' + large + ' 1 ' + x2.toFixed(1) + ',' + y2.toFixed(1) +
      ' Z" fill="' + cols[i % cols.length] + '" stroke="#0b1030" stroke-width="1.5"/>';
    var pct = Math.round(vals[i] / sum * 100);
    if (pct >= 10) {
      s += dg_t(cx + R * 0.62 * Math.cos(mid), cy + R * 0.62 * Math.sin(mid) + 4,
        pct + '%', 11, '#0b1030', 'middle', true);
    }
    ang = a2;
  }
  for (i = 0; i < vals.length; i++) {                      /* legend */
    var ly = 34 + i * 20, pct2 = Math.round(vals[i] / sum * 100);
    s += '<rect x="152" y="' + (ly - 9) + '" width="10" height="10" rx="2" fill="' + cols[i % cols.length] + '"/>';
    s += dg_t(168, ly, dg_trunc(labs[i], 9) + ' ' + pct2 + '%', 10, DG_TXT, 'start');
  }
  return dg_svg('0 0 260 180', s);
}

/* ==================== COMPASS ==================== */

function dg_compass() {
  var cx = 100, cy = 100, s = DG_ARROW_DEF;
  s += '<circle cx="' + cx + '" cy="' + cy + '" r="88" fill="rgba(212,175,55,.05)" stroke="' + DG_GOLD + '" stroke-width="2"/>';
  s += '<circle cx="' + cx + '" cy="' + cy + '" r="70" fill="none" stroke="' + DG_GOLD + '" stroke-width="1" opacity=".45"/>';
  var k, ang, len, wd, x1, y1, x2, y2, x3, y3;
  for (k = 0; k < 8; k++) {                               /* 8-point rose */
    ang = k * Math.PI / 4;
    var main = (k % 2 === 0);
    len = main ? 60 : 38; wd = main ? 9 : 5.5;
    x1 = cx + len * Math.sin(ang); y1 = cy - len * Math.cos(ang);
    x2 = cx + wd * Math.sin(ang + Math.PI / 2); y2 = cy - wd * Math.cos(ang + Math.PI / 2);
    x3 = cx + wd * Math.sin(ang - Math.PI / 2); y3 = cy - wd * Math.cos(ang - Math.PI / 2);
    s += '<polygon points="' + x1.toFixed(1) + ',' + y1.toFixed(1) + ' ' +
      x2.toFixed(1) + ',' + y2.toFixed(1) + ' ' + x3.toFixed(1) + ',' + y3.toFixed(1) +
      '" fill="' + (k === 0 ? DG_GOLD2 : (main ? DG_GOLD : 'rgba(212,175,55,.4)')) + '"/>';
  }
  s += '<circle cx="' + cx + '" cy="' + cy + '" r="6" fill="' + DG_GOLD + '" stroke="' + DG_GOLD2 + '" stroke-width="1.5"/>';
  s += dg_t(cx, 16, 'उत्तर', 13, DG_GOLD2, 'middle', true);
  s += dg_t(cx, 196, 'दक्षिण', 13, DG_TXT, 'middle', true);
  s += dg_t(190, cy + 5, 'पूर्व', 13, DG_TXT, 'middle', true);
  s += dg_t(10, cy + 5, 'पश्चिम', 13, DG_TXT, 'middle', true);
  return dg_svg('0 0 200 200', s);
}

/* ==================== NAYE TYPES (7) ==================== */

/* Venn: 2 ya 3 overlapping circles (syllogism) */
function dg_venn(d) {
  var L = d.labels;
  if (!Array.isArray(L) || (L.length !== 2 && L.length !== 3)) return '';
  var s = '', i, c;
  var fill = 'rgba(212,175,55,.13)';
  if (L.length === 2) {
    c = [[102, 88, 54], [158, 88, 54]];
    for (i = 0; i < 2; i++)
      s += '<circle cx="' + c[i][0] + '" cy="' + c[i][1] + '" r="' + c[i][2] +
        '" fill="' + fill + '" stroke="' + DG_GOLD + '" stroke-width="2"/>';
    s += dg_t(102, 162, dg_trunc(L[0], 10), 12, DG_GOLD2, 'middle', true);
    s += dg_t(158, 162, dg_trunc(L[1], 10), 12, DG_GOLD2, 'middle', true);
  } else {
    c = [[130, 66, 48], [86, 116, 48], [174, 116, 48]];
    var lp = [[130, 40], [62, 134], [198, 134]];
    for (i = 0; i < 3; i++)
      s += '<circle cx="' + c[i][0] + '" cy="' + c[i][1] + '" r="' + c[i][2] +
        '" fill="' + fill + '" stroke="' + DG_GOLD + '" stroke-width="2"/>';
    for (i = 0; i < 3; i++)
      s += dg_t(lp[i][0], lp[i][1], dg_trunc(L[i], 8), 12, DG_GOLD2, 'middle', true);
  }
  return dg_svg('0 0 260 180', s);
}

/* Tree: horizontal chain — boxes me members, arrows pe relation (blood relation) */
function dg_tree(d) {
  /* chain format adapter: rel:["A — भाई — B", ...], ask:"..." (res=answer, diagram me nahi dikhate) */
  var askTxt = '';
  if ((!d.members || !d.members.length) && Array.isArray(d.rel) && d.rel.length) {
    var members = [], links = [];
    d.rel.forEach(function (entry) {
      var parts = String(entry).split('—').map(function (x) { return x.trim(); });
      if (parts.length >= 3) {
        var A = parts[0], Rl = parts[1], B = parts.slice(2).join(' — ');
        if (A && members.indexOf(A) < 0) members.push(A);
        if (B && members.indexOf(B) < 0) members.push(B);
        if (A && B) links.push([A, B, Rl]);
      }
    });
    if (!members.length) return '';
    askTxt = d.ask ? String(d.ask) : '';
    d = { members: members, links: links };
  } else if (d.ask) { askTxt = String(d.ask); }
  var M = d.members, LK = d.links;
  if (!Array.isArray(M) || M.length < 1 || M.length > 6) return '';
  if (LK !== undefined && LK !== null && !Array.isArray(LK)) return '';
  var n = M.length, bw = 58, bh = 32, y = 74;
  var gap = n > 1 ? Math.min(34, Math.max(16, (260 - 30 - n * bw) / (n - 1))) : 0;
  var x0 = (260 - (n * bw + (n - 1) * gap)) / 2;
  var s = DG_ARROW_DEF, i, bx;
  function relFor(a, b) {
    if (!Array.isArray(LK)) return '';
    for (var j = 0; j < LK.length; j++) {
      var lk = LK[j];
      if (Array.isArray(lk) && String(lk[0]) === String(a) && String(lk[1]) === String(b))
        return lk[2];
    }
    return '';
  }
  for (i = 0; i < n; i++) {
    bx = x0 + i * (bw + gap);
    s += '<rect x="' + bx.toFixed(1) + '" y="' + y + '" width="' + bw + '" height="' + bh +
      '" rx="9" fill="rgba(212,175,55,.10)" stroke="' + DG_GOLD + '" stroke-width="2"/>';
    s += dg_t(bx + bw / 2, y + 21, dg_trunc(M[i], 8), 12, DG_TXT, 'middle', true);
    if (i < n - 1) {
      var x1 = bx + bw, x2 = bx + bw + gap;
      s += '<line x1="' + x1.toFixed(1) + '" y1="90" x2="' + (x2 - 2).toFixed(1) +
        '" y2="90" stroke="' + DG_GOLD + '" stroke-width="2" marker-end="url(#dgArr)"/>';
      var rel = relFor(M[i], M[i + 1]);
      if (rel) s += dg_t((x1 + x2) / 2, 62, dg_trunc(rel, 14), 10, DG_GOLD2);
    }
  }
  return dg_svg('0 0 260 180', s + (askTxt ? dg_t(130, 168, dg_trunc(askTxt, 42), 11, DG_MUT, 'middle') : ''));
}

/* Seating: circle me ya ek row me arrangement */
function dg_seating(d) {
  var L = d.labels, shape = d.shape;
  if (!Array.isArray(L) || L.length < 2 || L.length > 10) return '';
  if (shape !== 'circle' && shape !== 'row') return '';
  var n = L.length, s = '', i;
  function node(x, y, r, label) {
    return '<circle cx="' + x.toFixed(1) + '" cy="' + y.toFixed(1) + '" r="' + r +
      '" fill="rgba(212,175,55,.14)" stroke="' + DG_GOLD + '" stroke-width="2"/>' +
      dg_t(x, y + 4, dg_trunc(label, 6), 11, DG_TXT, 'middle', true);
  }
  if (shape === 'circle') {
    var cx = 130, cy = 90, R = 60, nr = n > 6 ? 13 : 16;
    s += '<circle cx="' + cx + '" cy="' + cy + '" r="' + R + '" fill="none" stroke="' +
      DG_GOLD + '" stroke-width="1" stroke-dasharray="5,5" opacity=".6"/>';
    for (i = 0; i < n; i++) {
      var a = -Math.PI / 2 + i * Math.PI * 2 / n;
      s += node(cx + R * Math.cos(a), cy + R * Math.sin(a), nr, L[i]);
    }
  } else {
    var x0 = 30, x1 = 230, nr2 = 16;
    s += dg_line(x0 - 14, 90, x1 + 14, 90, 1.5, DG_MUT);
    for (i = 0; i < n; i++) {
      var x = n === 1 ? 130 : x0 + i * (x1 - x0) / (n - 1);
      s += node(x, 90, nr2, L[i]);
    }
  }
  return dg_svg('0 0 260 180', s);
}

/* Timeline: horizontal line, dots, saal upar + label neeche (max 6) */
function dg_timeline(d) {
  var E = d.events;
  if (!Array.isArray(E) || E.length < 1) return '';
  E = E.slice(0, 6);
  var n = E.length, s = '', i;
  s += dg_line(16, 92, 244, 92, 2.5);
  for (i = 0; i < n; i++) {
    var ev = E[i];
    if (!Array.isArray(ev)) return '';
    var x = n === 1 ? 130 : 16 + i * (228 / (n - 1));
    s += dg_line(x, 84, x, 100, 2);
    s += '<circle cx="' + x.toFixed(1) + '" cy="92" r="5.5" fill="' + DG_GOLD +
      '" stroke="' + DG_GOLD2 + '" stroke-width="1.5"/>';
    s += dg_t(x, 68, ev[0], 11, DG_GOLD2, 'middle', true);
    s += dg_t(x, 122, dg_trunc(ev[1], 10), 10, DG_TXT);
  }
  return dg_svg('0 0 260 180', s);
}

/* Simplified India outline + optional marker */
var DG_INDIA_PATH = 'M130,6 L120,16 L112,28 L104,40 L94,50 L88,58 L96,64 L104,62 ' +
  'L100,74 L106,88 L112,104 L120,122 L128,142 L134,158 L138,172 ' +
  'L144,156 L150,138 L156,120 L162,104 L168,90 L164,78 L158,68 ' +
  'L150,62 L142,58 L132,54 L124,50 L118,42 L116,32 L122,22 L126,12 Z';
var DG_INDIA_NE = 'M168,58 L180,54 L188,60 L184,70 L172,68 Z';

function dg_map_india(d) {
  var s = '<path d="' + DG_INDIA_PATH + '" fill="rgba(212,175,55,.08)" stroke="' +
    DG_GOLD + '" stroke-width="2" stroke-linejoin="round"/>';
  s += '<path d="' + DG_INDIA_NE + '" fill="rgba(212,175,55,.08)" stroke="' +
    DG_GOLD + '" stroke-width="1.5" stroke-linejoin="round"/>';
  if (d.mark !== undefined && d.mark !== null && String(d.mark).trim() !== '') {
    s += '<circle cx="148" cy="62" r="5" fill="' + DG_GOLD + '" stroke="' + DG_GOLD2 + '" stroke-width="1.5"/>';
    s += dg_t(148, 86, dg_trunc(d.mark, 12), 11, DG_GOLD2, 'middle', true);
  }
  return dg_svg('0 0 260 180', s);
}

/* Simplified Bihar outline + optional marker */
var DG_BIHAR_PATH = 'M40,70 L80,52 L130,48 L180,46 L215,52 L228,68 L218,88 ' +
  'L222,105 L200,118 L165,132 L120,128 L85,120 L50,105 L36,88 Z';

function dg_map_bihar(d) {
  var s = '<path d="' + DG_BIHAR_PATH + '" fill="rgba(212,175,55,.08)" stroke="' +
    DG_GOLD + '" stroke-width="2" stroke-linejoin="round"/>';
  if (d.mark !== undefined && d.mark !== null && String(d.mark).trim() !== '') {
    s += '<circle cx="120" cy="86" r="5" fill="' + DG_GOLD + '" stroke="' + DG_GOLD2 + '" stroke-width="1.5"/>';
    s += dg_t(120, 110, dg_trunc(d.mark, 12), 11, DG_GOLD2, 'middle', true);
  }
  return dg_svg('0 0 260 180', s);
}

/* Number line: ticks + mark pe gold dot */
function dg_numline(d) {
  var from = dg_fin(d.from), to = dg_fin(d.to);
  if (from === null || to === null || !(from < to) || (to - from) > 40) return '';
  var x = function (v) { return 20 + (v - from) / (to - from) * 220; };
  var s = DG_ARROW_DEF;
  s += '<line x1="14" y1="92" x2="246" y2="92" stroke="' + DG_GOLD +
    '" stroke-width="2" marker-start="url(#dgArr)" marker-end="url(#dgArr)"/>';
  var i0 = Math.ceil(from), i1 = Math.floor(to), i, step = 1;
  if (i1 - i0 > 12) step = 2;
  for (i = i0; i <= i1; i += step) {
    s += dg_line(x(i), 85, x(i), 99, 1.5, DG_MUT);
    s += dg_t(x(i), 118, i, 10, DG_TXT);
  }
  var m = dg_fin(d.mark);
  if (m !== null && m >= from && m <= to) {
    s += '<circle cx="' + x(m).toFixed(1) + '" cy="92" r="6" fill="' + DG_GOLD +
      '" stroke="' + DG_GOLD2 + '" stroke-width="1.5"/>';
    s += dg_t(x(m), 66, dg_fmt(m), 11, DG_GOLD2, 'middle', true);
  }
  return dg_svg('0 0 260 180', s);
}

/* ==================== DISPATCH ==================== */

/* Right triangle with right-angle marker (tri3): a,b = legs, c = hypotenuse (optional) */
function dg_tri3(d) {
  var a = dg_num(d.a), b = dg_num(d.b), c = dg_num(d.c);
  if (a === null || b === null) return '';
  if (c === null) c = Math.sqrt(a * a + b * b);
  var sc = Math.min(170 / a, 105 / b);
  var W = a * sc, H = b * sc, x0 = (260 - W) / 2, y1 = 148, y0 = y1 - H;
  var s = '<polygon points="' + x0 + ',' + y1 + ' ' + x0 + ',' + y0 + ' ' + (x0 + W) + ',' + y1 +
    '" fill="rgba(212,175,55,.12)" stroke="' + DG_GOLD + '" stroke-width="2" stroke-linejoin="round"/>';
  var m = 11;
  s += '<path d="M' + x0 + ',' + (y1 - m) + ' h' + m + ' v' + m + '" fill="none" stroke="' + DG_GOLD2 + '" stroke-width="2"/>';
  s += '<circle cx="' + x0 + '" cy="' + y1 + '" r="3" fill="' + DG_GOLD + '"/>' +
       '<circle cx="' + x0 + '" cy="' + y0 + '" r="3" fill="' + DG_GOLD + '"/>' +
       '<circle cx="' + (x0 + W) + '" cy="' + y1 + '" r="3" fill="' + DG_GOLD + '"/>';
  s += dg_t(x0 - 10, (y0 + y1) / 2 + 4, 'b = ' + dg_fmt(b), 12, DG_GOLD2, 'end');
  s += dg_t((2 * x0 + W) / 2, y1 + 18, 'a = ' + dg_fmt(a), 12, DG_GOLD2);
  s += dg_t((2 * x0 + W) / 2 + 16, (y0 + y1) / 2 - 6, 'c = ' + dg_fmt(c), 12, DG_GOLD2);
  return dg_svg('0 0 260 180', s);
}

/* Cone (shanku): r = aadhar trijya, h = unchai */
function dg_cone(d) {
  var r = dg_num(d.r), h = dg_num(d.h);
  if (r === null || h === null) return '';
  var cx = 130, rx = 58, ry = 13, by = 138, ty = 52;
  var s = '<ellipse cx="' + cx + '" cy="' + by + '" rx="' + rx + '" ry="' + ry +
    '" fill="rgba(212,175,55,.06)" stroke="' + DG_GOLD + '" stroke-width="2"/>';
  s += dg_line(cx - rx, by, cx, ty, 2) + dg_line(cx + rx, by, cx, ty, 2);
  s += '<circle cx="' + cx + '" cy="' + ty + '" r="3" fill="' + DG_GOLD + '"/>';
  s += dg_t(cx + rx / 2, by + 24, 'r = ' + dg_fmt(r), 12, DG_GOLD2);
  s += dg_t(cx - rx - 8, (ty + by) / 2 + 4, 'h = ' + dg_fmt(h), 12, DG_GOLD2, 'end');
  return dg_svg('0 0 260 180', s);
}

/* Rhombus (samchaturbhuj): d1, d2 = vikarn */
function dg_rhombus(d) {
  var d1 = dg_num(d.d1), d2 = dg_num(d.d2);
  if (d1 === null || d2 === null) return '';
  var sc = Math.min(190 / d1, 120 / d2);
  var W = d1 * sc, H = d2 * sc, cx = 125, cy = 88;
  var s = '<polygon points="' + cx + ',' + (cy - H / 2) + ' ' + (cx + W / 2) + ',' + cy + ' ' +
    cx + ',' + (cy + H / 2) + ' ' + (cx - W / 2) + ',' + cy +
    '" fill="rgba(212,175,55,.12)" stroke="' + DG_GOLD + '" stroke-width="2" stroke-linejoin="round"/>';
  s += dg_line(cx, cy - H / 2, cx, cy + H / 2, 1.5, DG_GOLD2) +
       dg_line(cx - W / 2, cy, cx + W / 2, cy, 1.5, DG_GOLD2);
  s += dg_t(cx + 10, cy - H / 2 + 16, 'd1 = ' + dg_fmt(d1), 11, DG_GOLD2);
  s += dg_t(cx + W / 2 + 8, cy + 4, 'd2 = ' + dg_fmt(d2), 11, DG_GOLD2);
  return dg_svg('0 0 260 180', s);
}

/* Trapezium (samlamb): a,b = samantar bhujaein, h = unchai */
function dg_trap(d) {
  var a = dg_num(d.a), b = dg_num(d.b), h = dg_num(d.h);
  if (a === null || b === null || h === null) return '';
  var top = Math.min(a, b), bot = Math.max(a, b);
  var sc = Math.min(190 / bot, 105 / h);
  var TW = top * sc, BW = bot * sc, H = h * sc, cx = 130, y0 = 42, y1 = y0 + H;
  var s = '<polygon points="' + (cx - TW / 2) + ',' + y0 + ' ' + (cx + TW / 2) + ',' + y0 + ' ' +
    (cx + BW / 2) + ',' + y1 + ' ' + (cx - BW / 2) + ',' + y1 +
    '" fill="rgba(212,175,55,.12)" stroke="' + DG_GOLD + '" stroke-width="2" stroke-linejoin="round"/>';
  s += dg_line(cx - TW / 2 - 16, y0, cx - TW / 2 - 16, y1, 1.5, DG_GOLD2);
  s += dg_t(cx - TW / 2 - 22, (y0 + y1) / 2 + 4, 'h = ' + dg_fmt(h), 11, DG_GOLD2, 'end');
  s += dg_t(cx, y0 - 10, 'a = ' + dg_fmt(a), 11, DG_GOLD2);
  s += dg_t(cx, y1 + 18, 'b = ' + dg_fmt(b), 11, DG_GOLD2);
  return dg_svg('0 0 260 180', s);
}

function renderDiagram(d) {
  try {
    if (!d || typeof d !== 'object' || typeof d.t !== 'string') return '';
    switch (d.t) {
      case 'tri':     return dg_tri(d);
      case 'tri3':    return dg_tri3(d);
      case 'rect':    return dg_rect(d, false);
      case 'sq':      return dg_rect(d, true);
      case 'circle':  return dg_circle(d);
      case 'cube':    return dg_cube(d);
      case 'cuboid':  return dg_cuboid(d);
      case 'cyl':     return dg_cyl(d);
      case 'cylinder':return dg_cyl(d);
      case 'cone':    return dg_cone(d);
      case 'rhombus': return dg_rhombus(d);
      case 'trap':    return dg_trap(d);
      case 'bar':     return dg_bar(d);
      case 'pie':     return dg_pie(d);
      case 'compass': return dg_compass();
      case 'venn':    return dg_venn(d);
      case 'tree':    return dg_tree(d);
      case 'seating': return dg_seating(d);
      case 'timeline':return dg_timeline(d);
      case 'map-india': return dg_map_india(d);
      case 'map-bihar': return dg_map_bihar(d);
      case 'numline': return dg_numline(d);
      default: return '';
    }
  } catch (e) {
    return '';   /* kabhi crash/throw nahi — hamesha string */
  }
}

/* node test ke liye (browser me harmless) */
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { renderDiagram: renderDiagram };
}
