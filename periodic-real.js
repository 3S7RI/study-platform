/* =====================================================================
 * periodic-real.js — «الشكل الحقيقي للمادة» لكل الـ118 عنصر
 * مجسّم 3D على Canvas بدون أي مكتبات: بيعرض العنصر زي ما بنشوفه فعلًا في الحياة
 * (سبيكة ذهب، سلك نحاس، علبة ألومنيوم، زئبق سائل، لمبة نيون، بالون هيليوم ...).
 * العناصر اللي ملهاش عينة مرئية (المشعة والمُصنَّعة) بتظهر بمجسّم تخيّلي مع تنبيه صريح.
 * ===================================================================== */
(function (G) {
'use strict';
var PI = Math.PI;

/* ---------- أدوات رياضية ---------- */
function hex(h) { h = h.replace('#', ''); return [parseInt(h.substr(0, 2), 16), parseInt(h.substr(2, 2), 16), parseInt(h.substr(4, 2), 16)]; }
function nrm(v) { var l = Math.hypot(v[0], v[1], v[2]) || 1; return [v[0] / l, v[1] / l, v[2] / l]; }
function crs(a, b) { return [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]]; }
function sub(a, b) { return [a[0] - b[0], a[1] - b[1], a[2] - b[2]]; }
function dot(a, b) { return a[0] * b[0] + a[1] * b[1] + a[2] * b[2]; }
function shade(c, k) { return [Math.min(255, c[0] * k), Math.min(255, c[1] * k), Math.min(255, c[2] * k)]; }
function rot(p, rx, ry, rz) {
    var x = p[0], y = p[1], z = p[2], c, s, t;
    if (rz) { c = Math.cos(rz); s = Math.sin(rz); t = x * c - y * s; y = x * s + y * c; x = t; }
    if (rx) { c = Math.cos(rx); s = Math.sin(rx); t = y * c - z * s; z = y * s + z * c; y = t; }
    if (ry) { c = Math.cos(ry); s = Math.sin(ry); t = x * c + z * s; z = -x * s + z * c; x = t; }
    return [x, y, z];
}
function rng(seed) { return function () { seed |= 0; seed = seed + 0x6D2B79F5 | 0; var t = Math.imul(seed ^ seed >>> 15, 1 | seed); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
function rgb(r, g, b) { return 'rgb(' + (r < 0 ? 0 : r > 255 ? 255 : r | 0) + ',' + (g < 0 ? 0 : g > 255 ? 255 : g | 0) + ',' + (b < 0 ? 0 : b > 255 ? 255 : b | 0) + ')'; }

/* ---------- أدوات إضافية للواقعية ---------- */
function hsh(k) { k = Math.imul(k ^ (k >>> 15), 0x2c1b3c6d); k = Math.imul(k ^ (k >>> 12), 0x297a2d39); return ((k ^ (k >>> 15)) >>> 0) / 4294967296; }
function hsv(h, s, v) {
    h = ((h % 6) + 6) % 6; var i = Math.floor(h), f = h - i, p = v * (1 - s), q = v * (1 - s * f), t = v * (1 - s * (1 - f)), r, g, b;
    switch (i) { case 0: r = v; g = t; b = p; break; case 1: r = q; g = v; b = p; break; case 2: r = p; g = v; b = t; break; case 3: r = p; g = q; b = v; break; case 4: r = t; g = p; b = v; break; default: r = v; g = p; b = q; }
    return [r * 255, g * 255, b * 255];
}
function parseOpts(s) {
    var o = {}; if (!s) return o;
    String(s).split(',').forEach(function (kv) {
        var p = kv.split('='); if (!p[0]) return;
        var v = p.length > 1 ? p.slice(1).join('=') : '1';
        o[p[0].trim()] = /^-?[\d.]+$/.test(v) ? +v : v;
    });
    return o;
}

/* ---------- المجسّمات (Meshes) ---------- */
function mk(v, f, c) { return { v: v, f: f, c: c || [0, 0, 0] }; }

function ico(sd, fn, sph, sharp) {
    var t = (1 + Math.sqrt(5)) / 2;
    var v = [[-1, t, 0], [1, t, 0], [-1, -t, 0], [1, -t, 0], [0, -1, t], [0, 1, t], [0, -1, -t], [0, 1, -t], [t, 0, -1], [t, 0, 1], [-t, 0, -1], [-t, 0, 1]].map(nrm);
    var f = [[0,11,5],[0,5,1],[0,1,7],[0,7,10],[0,10,11],[1,5,9],[5,11,4],[11,10,2],[10,7,6],[7,1,8],[3,9,4],[3,4,2],[3,2,6],[3,6,8],[3,8,9],[4,9,5],[2,4,11],[6,2,10],[8,6,7],[9,8,1]];
    for (var s = 0; s < sd; s++) {
        var cache = {}, nf = [];
        var mid = function (a, b) {
            var k = a < b ? a + '_' + b : b + '_' + a;
            if (cache[k] !== undefined) return cache[k];
            v.push(nrm([(v[a][0] + v[b][0]) / 2, (v[a][1] + v[b][1]) / 2, (v[a][2] + v[b][2]) / 2]));
            return (cache[k] = v.length - 1);
        };
        f.forEach(function (tr) {
            var a = tr[0], b = tr[1], c = tr[2], ab = mid(a, b), bc = mid(b, c), ca = mid(c, a);
            nf.push([a, ab, ca], [b, bc, ab], [c, ca, bc], [ab, bc, ca]);
        });
        f = nf;
    }
    if (fn) v = v.map(fn);
    var m = mk(v, f.map(function (i) { return { i: i }; }));
    m.sph = !!sph;
    m.smooth = !!fn && !sph && !sharp;
    return m;
}
function lump(seed, amp, sx, sy, sz) {
    return function (p) {
        var n = Math.sin(p[0] * 2.9 + seed) * Math.sin(p[1] * 3.3 + seed * 1.7) * Math.sin(p[2] * 3.1 + seed * 0.6) + 0.5 * Math.sin(p[0] * 6.1 + seed * 2) * Math.sin(p[2] * 5.7 + seed);
        var r = 1 + amp * n;
        return [p[0] * r * (sx || 1), p[1] * r * (sy || 1), p[2] * r * (sz || 1)];
    };
}
function cyl(r, h, seg, r2, open) {
    if (r2 == null) r2 = r;
    var v = [], f = [], i, a, hh = h / 2;
    for (i = 0; i < seg; i++) { a = i / seg * 2 * PI; v.push([Math.cos(a) * r, -hh, Math.sin(a) * r]); }
    for (i = 0; i < seg; i++) { a = i / seg * 2 * PI; v.push([Math.cos(a) * r2, hh, Math.sin(a) * r2]); }
    for (i = 0; i < seg; i++) {
        var j = (i + 1) % seg, am = (i + 0.5) / seg * 2 * PI;
        f.push({ i: [i, j, seg + j, seg + i], n: nrm([Math.cos(am) * h, r - r2, Math.sin(am) * h]) });
    }
    if (!open) {
        var bt = [], tp = [];
        for (i = 0; i < seg; i++) { bt.push(i); tp.push(seg + i); }
        f.push({ i: bt, n: [0, -1, 0] }); f.push({ i: tp, n: [0, 1, 0] });
    }
    return mk(v, f);
}
function bipyr(n, rr, ht, hb) {
    var v = [], f = [], i;
    for (i = 0; i < n; i++) { var a = i / n * 2 * PI; v.push([Math.cos(a) * rr, 0, Math.sin(a) * rr]); }
    v.push([0, ht, 0]); v.push([0, -hb, 0]);
    for (i = 0; i < n; i++) { var j = (i + 1) % n; f.push({ i: [i, j, n] }); f.push({ i: [j, i, n + 1] }); }
    return mk(v, f);
}
function prismPt(n, r, h, tip) {
    var v = [], f = [], i, a;
    for (i = 0; i < n; i++) { a = i / n * 2 * PI; v.push([Math.cos(a) * r, 0, Math.sin(a) * r]); }
    for (i = 0; i < n; i++) { a = i / n * 2 * PI; v.push([Math.cos(a) * r, h, Math.sin(a) * r]); }
    v.push([0, h + tip, 0]);
    for (i = 0; i < n; i++) { var j = (i + 1) % n; f.push({ i: [i, j, n + j, n + i] }); f.push({ i: [n + i, n + j, 2 * n] }); }
    var bt = []; for (i = 0; i < n; i++) bt.push(i); f.push({ i: bt });
    return mk(v, f, [0, (h + tip) / 2, 0]);
}
function bar(wb, db, wt, dt, h) {
    var y0 = -h / 2, y1 = h / 2;
    var v = [[-wb/2,y0,-db/2],[wb/2,y0,-db/2],[wb/2,y0,db/2],[-wb/2,y0,db/2],[-wt/2,y1,-dt/2],[wt/2,y1,-dt/2],[wt/2,y1,dt/2],[-wt/2,y1,dt/2]];
    return mk(v, [[0,1,2,3],[4,5,6,7],[0,1,5,4],[1,2,6,5],[2,3,7,6],[3,0,4,7]].map(function (i) { return { i: i }; }));
}
function brilliant() {
    var n = 8, v = [], f = [], i, a;
    for (i = 0; i < n; i++) { a = i / n * 2 * PI; v.push([Math.cos(a), 0, Math.sin(a)]); }
    for (i = 0; i < n; i++) { a = (i + 0.5) / n * 2 * PI; v.push([Math.cos(a) * 0.55, 0.4, Math.sin(a) * 0.55]); }
    v.push([0, -0.85, 0]);
    for (i = 0; i < n; i++) {
        var j = (i + 1) % n;
        f.push({ i: [i, j, n + i] });
        f.push({ i: [j, n + j, n + i] });
        f.push({ i: [j, i, 2 * n] });
    }
    var tb = []; for (i = 0; i < n; i++) tb.push(n + i); f.push({ i: tb });
    return mk(v, f, [0, 0, 0]);
}
function tubeMesh(path, r, sides, up) {
    var v = [], f = [], dirs = [], k, j, n = path.length;
    for (k = 0; k < n; k++) {
        var T = nrm(sub(path[Math.min(n - 1, k + 1)], path[Math.max(0, k - 1)]));
        var B = nrm(crs(T, up)), N = crs(B, T), dd = [];
        for (j = 0; j < sides; j++) {
            var a = j / sides * 2 * PI, ca = Math.cos(a), sa = Math.sin(a);
            var d = [ca * N[0] + sa * B[0], ca * N[1] + sa * B[1], ca * N[2] + sa * B[2]];
            dd.push(d); v.push([path[k][0] + d[0] * r, path[k][1] + d[1] * r, path[k][2] + d[2] * r]);
        }
        dirs.push(dd);
    }
    for (k = 0; k < n - 1; k++) for (j = 0; j < sides; j++) {
        var j2 = (j + 1) % sides, d0 = dirs[k][j], d1 = dirs[k][j2], d2 = dirs[k + 1][j], d3 = dirs[k + 1][j2];
        f.push({ i: [k * sides + j, k * sides + j2, (k + 1) * sides + j2, (k + 1) * sides + j], n: nrm([d0[0] + d1[0] + d2[0] + d3[0], d0[1] + d1[1] + d2[1] + d3[1], d0[2] + d1[2] + d2[2] + d3[2]]) });
    }
    return mk(v, f);
}

/* ---------- المشهد ---------- */
function Scene() { this.V = []; this.F = []; this.S = []; this.tick = null; }
Scene.prototype.add = function (m, o) {
    o = o || {};
    var sc = o.sc || [1, 1, 1], ps = o.pos || [0, 0, 0], rt = o.rot || [0, 0, 0], mat = o.mat, base = this.V.length, V = this.V, F = this.F, F0 = this.F.length;
    function tp(p) { var q = rot([p[0] * sc[0], p[1] * sc[1], p[2] * sc[2]], rt[0], rt[1], rt[2]); return [q[0] + ps[0], q[1] + ps[1], q[2] + ps[2]]; }
    function tn(n) { return nrm(rot([n[0] / sc[0], n[1] / sc[1], n[2] / sc[2]], rt[0], rt[1], rt[2])); }
    var W = m.v.map(tp), cc = tp(m.c);
    m.f.forEach(function (f, fi) {
        var n, k, ids = f.i.map(function (i) { return base + i; });
        if (f.n) n = tn(f.n);
        else if (m.sph) {
            var s = [0, 0, 0];
            f.i.forEach(function (i) { s[0] += m.v[i][0]; s[1] += m.v[i][1]; s[2] += m.v[i][2]; });
            n = tn(s);
        } else {
            n = nrm(crs(sub(W[f.i[1]], W[f.i[0]]), sub(W[f.i[2]], W[f.i[0]])));
            var md = [0, 0, 0];
            for (k = 0; k < f.i.length; k++) { md[0] += W[f.i[k]][0]; md[1] += W[f.i[k]][1]; md[2] += W[f.i[k]][2]; }
            md = [md[0] / f.i.length, md[1] / f.i.length, md[2] / f.i.length];
            if (dot(n, sub(md, cc)) < 0) n = [-n[0], -n[1], -n[2]];
        }
        var r1 = hsh(base * 131 + fi * 3 + 1), ns = n;
        if (mat && mat.nj && !m.sph) ns = nrm([n[0] + (r1 - 0.5) * 2 * mat.nj, n[1] + (hsh(base * 131 + fi * 3 + 2) - 0.5) * 2 * mat.nj, n[2] + (hsh(base * 131 + fi * 3 + 3) - 0.5) * 2 * mat.nj]);
        F.push({ i: ids, n: n, s: ns, m: mat, h: r1 });
    });
    /* تنعيم الظل: لكل رأس متوسط أنظمة الأوجه المحيطة به، فيظهر السطح الصخري ناعماً بدل مضلّعات مسطّحة */
    if (m.smooth) {
        var VN = {}, q, fq, id, k;
        for (q = F0; q < F.length; q++) { fq = F[q]; for (k = 0; k < fq.i.length; k++) { id = fq.i[k]; var a0 = VN[id] || (VN[id] = [0, 0, 0]); a0[0] += fq.n[0]; a0[1] += fq.n[1]; a0[2] += fq.n[2]; } }
        for (q = F0; q < F.length; q++) {
            fq = F[q]; var sm = [0, 0, 0];
            for (k = 0; k < fq.i.length; k++) { var vv = VN[fq.i[k]]; sm[0] += vv[0]; sm[1] += vv[1]; sm[2] += vv[2]; }
            sm = nrm(sm);
            var cxs = 0, cys = 0, czs = 0;
            for (k = 0; k < fq.i.length; k++) { var pw = W[fq.i[k] - base]; cxs += pw[0]; cys += pw[1]; czs += pw[2]; }
            cxs /= fq.i.length; cys /= fq.i.length; czs /= fq.i.length;
            var pn = 0.5 + 0.28 * Math.sin(cxs * 2.3 + base) * Math.cos(cys * 2.1 + base * 0.7) + 0.22 * Math.sin(czs * 2.7 + cxs * 1.3 + base * 0.3) + 0.12 * Math.sin(cys * 5.1 + czs * 4.3 + cxs * 3.7);
            fq.g = fq.h; fq.h = Math.max(0, Math.min(1, 0.5 + (pn - 0.5) * 1.9)); fq.sm = true;
            var nj2 = mat && mat.nj ? mat.nj * 0.16 : 0;
            if (nj2) sm = nrm([sm[0] + (hsh(base * 131 + q * 5 + 1) - 0.5) * 2 * nj2, sm[1] + (hsh(base * 131 + q * 5 + 2) - 0.5) * 2 * nj2, sm[2] + (hsh(base * 131 + q * 5 + 3) - 0.5) * 2 * nj2]);
            fq.s = sm;
        }
    }
    W.forEach(function (p) { V.push(p); });
    return this;
};
Scene.prototype.spr = function (p, r, c, a, add) { var o = { p: p, r: r, c: c, a: a, add: !!add }; this.S.push(o); return o; };
Scene.prototype.fin = function () {
    var V = this.V, mn = [1e9, 1e9, 1e9], mx = [-1e9, -1e9, -1e9], i, k;
    V.forEach(function (p) { for (k = 0; k < 3; k++) { if (p[k] < mn[k]) mn[k] = p[k]; if (p[k] > mx[k]) mx[k] = p[k]; } });
    if (!V.length) { mn = [-1, -1, -1]; mx = [1, 1, 1]; }
    var off = [(mn[0] + mx[0]) / 2, (mn[1] + mx[1]) / 2, (mn[2] + mx[2]) / 2], R = 1.1, rs = 0.8;
    V.forEach(function (p) {
        var d = Math.hypot(p[0] - off[0], p[1] - off[1], p[2] - off[2]); if (d > R) R = d;
        var e = Math.hypot(p[0] - off[0], p[2] - off[2]); if (e > rs) rs = e;
    });
    this.off = off; this.R = R; this.rs = rs; this.fy = mn[1] - off[1];
    this._n = -1;
};

/* ---------- الخامات ---------- */
function mMetal(c, mt, sp, sh, rough) { return { col: c, metal: mt == null ? 0.9 : mt, sp: sp == null ? 0.5 : sp, sh: sh || 45, rough: rough || 0 }; }
function mPlastic(c, sp, sh) { return { col: c, metal: 0, sp: sp == null ? 0.4 : sp, sh: sh || 36 }; }
var GLASS = { glass: true, alpha: 0.5 };

/* ---------- بناة المشاهد لكل نوع ---------- */
var SCN = {};

SCN.ingot = function (c) {
    var s = new Scene(), m = mMetal(c, 0.92, 0.6, 55), m2 = mMetal(shade(c, 0.86), 0.92, 0.6, 55);
    [[-0.62, 0, 0.05], [0.62, 0, -0.04], [0, 0.6, 0.12]].forEach(function (p, i) {
        s.add(bar(2.2, 1.1, 1.8, 0.82, 0.6), { pos: [i === 2 ? 0 : (i ? 0.1 : -0.1), p[1], p[0]], rot: [0, p[2], 0], mat: m });
        s.add(bar(1.25, 0.5, 1.1, 0.42, 0.05), { pos: [i === 2 ? 0 : (i ? 0.1 : -0.1), p[1] + 0.325, p[0]], rot: [0, p[2], 0], mat: m2 });
    });
    return s;
};
function lumps(c, metal, seed, sd, amp, polish) {
    var s = new Scene(), mat = metal ? mMetal(c, polish ? 0.95 : 0.8, polish ? 0.7 : 0.45, polish ? 60 : 35, polish ? 0 : 0.25) : mPlastic(c, 0.1, 10);
    s.add(ico(sd, lump(seed, amp, 1.3, 0.9, 1.05)), { mat: mat });
    s.add(ico(sd, lump(seed + 4, amp, 0.9, 0.65, 0.8)), { pos: [1.3, -0.25, 0.3], rot: [0, 1, 0], mat: mat });
    s.add(ico(sd, lump(seed + 9, amp, 0.7, 0.5, 0.6)), { pos: [-0.95, -0.4, 0.85], rot: [0, 2, 0], mat: mat });
    return s;
}
SCN.chunk = function (c, z) { return lumps(c, true, 3 + (z || 0) % 7, 1, 0.3, false); };
SCN.rock = function (c, z) { return lumps(c, false, 5 + (z || 0) % 5, 1, 0.3, false); };
SCN.nugget = function (c, z) { return lumps(c, true, 2 + (z || 0) % 5, 2, 0.2, true); };

SCN.disc = function (c) {
    var s = new Scene(), m = mMetal(c, 0.92, 0.6, 55), m2 = mMetal(shade(c, 0.86), 0.92, 0.6, 55);
    [0, 1, 2].forEach(function (i) {
        var p = [(i - 1) * 0.05, i * 0.13 - 0.13, (1 - i) * 0.04], ry = i * 0.9;
        s.add(cyl(1, 0.12, 56), { pos: p, rot: [0, ry, 0], mat: m });
        s.add(cyl(0.8, 0.02, 56), { pos: [p[0], p[1] + 0.065, p[2]], rot: [0, ry, 0], mat: m2 });
    });
    return s;
};
SCN.wafer = function (c) {
    var s = new Scene();
    s.add(cyl(1.4, 0.06, 72), { rot: [0.0, 0, 0], mat: mMetal(c, 0.95, 0.8, 70) });
    s.add(cyl(1.2, 0.01, 72), { pos: [0, 0.035, 0], mat: mMetal(shade(c, 0.6), 0.7, 0.4, 30) });
    var r = rng(11);
    for (var i = -3; i <= 3; i++) for (var j = -3; j <= 3; j++) {
        if (Math.hypot(i, j) > 3.2) continue;
        s.add(bar(0.28, 0.28, 0.28, 0.28, 0.012), { pos: [i * 0.34, 0.045, j * 0.34], mat: mMetal(shade(c, 0.75 + r() * 0.5), 0.9, 0.7, 60) });
    }
    return s;
};
SCN.rods = function (c, z, acc, o) {
    var s = new Scene(), seg = o.hex ? 6 : 30, m = o.hex ? mMetal(c, 0.55, 0.45, 30, 0.2) : mMetal(c, 0.88, 0.55, 45, 0.1), rr = 0.3;
    s.add(cyl(rr, 2.4, seg), { rot: [0, 0, PI / 2], pos: [0, -0.26, -0.31], mat: m });
    s.add(cyl(rr, 2.4, seg), { rot: [0, 0, PI / 2], pos: [0.1, -0.26, 0.31], mat: m });
    s.add(cyl(rr, 2.4, seg), { rot: [0, 0, PI / 2], pos: [-0.15, 0.27, 0], mat: m });
    return s;
};
SCN.nails = function (c) {
    var s = new Scene(), m = mMetal(c, 0.85, 0.5, 40, 0.2), r = rng(7), i;
    for (i = 0; i < 9; i++) {
        var ang = r() * PI, x = (r() - 0.5) * 1.5, zz = (r() - 0.5) * 1.2, y = i < 6 ? 0 : 0.15, rt = [0, ang, PI / 2];
        var e = rot([0, 0.97, 0], rt[0], rt[1], rt[2]);
        s.add(cyl(0.1, 1.9, 10), { pos: [x, y, zz], rot: rt, mat: m });
        s.add(cyl(0.28, 0.08, 14), { pos: [x + e[0], y + e[1], zz + e[2]], rot: rt, mat: m });
        var t2 = rot([0, -0.97, 0], rt[0], rt[1], rt[2]);
        s.add(cyl(0.1, 0.2, 10, 0.01, false), { pos: [x + t2[0] * 1.03, y + t2[1], zz + t2[2] * 1.03], rot: [rt[0], rt[1], rt[2] + PI], mat: m });
    }
    return s;
};
SCN.can = function (c) {
    var s = new Scene(), m = mMetal(c, 0.92, 0.6, 50), m2 = mMetal(shade(c, 0.8), 0.92, 0.6, 50);
    s.add(cyl(0.6, 1.4, 44), { pos: [-0.7, 0, 0], mat: m });
    s.add(cyl(0.62, 0.06, 44), { pos: [-0.7, 0.73, 0], mat: m2 });
    s.add(cyl(0.5, 0.02, 44), { pos: [-0.7, 0.77, 0], mat: m2 });
    s.add(cyl(0.6, 1.4, 44), { pos: [0.95, -0.1, 0.1], rot: [PI / 2, 0.5, 0], mat: m });
    return s;
};
SCN.coil = function (c) {
    var s = new Scene(), path = [], k, turns = 4.5, per = 26, R = 0.55;
    for (k = 0; k <= turns * per; k++) { var a = k / per * 2 * PI; path.push([k / per * 0.27 - turns * 0.135, Math.cos(a) * R, Math.sin(a) * R]); }
    s.add(tubeMesh(path, 0.1, 8, [1, 0, 0]), { rot: [0.5, 0.35, 0], mat: mMetal(c, 0.95, 0.7, 60) });
    return s;
};
SCN.drop = function (c) {
    var s = new Scene(), m = mMetal(c, 0.95, 0.9, 90, 0.25);
    s.add(ico(3, null, true), { sc: [1.3, 0.5, 1.3], mat: m });
    [[1.55, 0.3, 0.3, 0.3], [-1.3, 0.55, 0.3, 0.26], [0.25, 1.3, 0.25, 0.22], [-0.3, -1.25, 0.28, 0.24], [1.0, -1.0, 0.18, 0.15]].forEach(function (b) {
        s.add(ico(2, null, true), { sc: [b[3], b[3] * 0.85, b[3]], pos: [b[0], -0.5 + b[3] * 0.85, b[1]], mat: m });
    });
    return s;
};
SCN.vial = function (c) {
    var s = new Scene();
    s.add(cyl(0.62, 2.0, 40), { mat: GLASS });
    s.add(cyl(0.55, 1.1, 40), { pos: [0, -0.42, 0], mat: { col: c, metal: 0, sp: 0.7, sh: 40 } });
    s.add(cyl(0.64, 0.3, 40), { pos: [0, 1.15, 0], mat: mPlastic([30, 30, 36], 0.4, 30) });
    var r = rng(5), vs = [];
    for (var i = 0; i < 16; i++) vs.push(s.spr([(r() - 0.5) * 0.8, 0.2 + r() * 0.7, (r() - 0.5) * 0.8], 0.28, c, 0.16, false));
    s.tick = function (dt, t) { vs.forEach(function (p, i) { p.p[1] = 0.15 + ((t * 0.08 + i * 0.37) % 1) * 0.8; p.p[0] += Math.sin(t + i) * 0.002; }); };
    return s;
};
SCN.gas = function (c) {
    var s = new Scene(), r = rng(3), P = [], i;
    s.add(cyl(0.8, 2.1, 48), { mat: GLASS });
    s.add(cyl(0.85, 0.22, 48), { pos: [0, 1.16, 0], mat: mMetal([70, 74, 82], 0.8, 0.5, 40) });
    s.add(cyl(0.86, 0.12, 48), { pos: [0, -1.1, 0], mat: mMetal([70, 74, 82], 0.8, 0.5, 40) });
    for (i = 0; i < 70; i++) {
        var o = s.spr([0, 0, 0], 0.12 + r() * 0.06, c, 0.6, false);
        o.x = (r() - 0.5) * 1.1; o.y = (r() - 0.5) * 1.7; o.z = (r() - 0.5) * 1.1;
        o.vx = (r() - 0.5) * 0.7; o.vy = (r() - 0.5) * 0.7; o.vz = (r() - 0.5) * 0.7; P.push(o);
    }
    s.tick = function (dt) {
        P.forEach(function (o) {
            o.x += o.vx * dt; o.y += o.vy * dt; o.z += o.vz * dt;
            if (Math.hypot(o.x, o.z) > 0.62) { o.vx = -o.vx; o.vz = -o.vz; o.x *= 0.97; o.z *= 0.97; }
            if (o.y > 0.9 || o.y < -0.9) { o.vy = -o.vy; o.y = Math.max(-0.9, Math.min(0.9, o.y)); }
            o.p[0] = o.x; o.p[1] = o.y; o.p[2] = o.z;
        });
    };
    s.tick(0);
    return s;
};
SCN.tube = function (c) {
    var s = new Scene(), path = [], i;
    for (i = 0; i <= 44; i++) { var x = -1.75 + i * 3.5 / 44; path.push([x, 0.5 * Math.sin(x * 2.1), 0]); }
    s.add(tubeMesh(path, 0.17, 10, [0, 0, 1]), { mat: { emis: true, col: c } });
    s.add(bar(4, 0.6, 4, 0.6, 0.08), { pos: [0, -0.85, 0], mat: mPlastic([26, 28, 36], 0.3, 20) });
    [-1.75, 1.75].forEach(function (x) { s.add(cyl(0.2, 0.3, 14), { pos: [x, 0.5 * Math.sin(x * 2.1) - 0.05, 0], rot: [0, 0, PI / 2 * (x < 0 ? 1 : -1)], mat: mMetal([90, 94, 102], 0.8, 0.5, 40) }); });
    for (i = 0; i <= 44; i += 3) s.spr([path[i][0], path[i][1], 0], 0.6, c, 0.2, true);
    return s;
};
SCN.balloon = function (c) {
    var s = new Scene(), m = { col: c, metal: 0.25, sp: 0.9, sh: 60 }, path = [], i;
    s.add(ico(3, null, true), { sc: [1, 1.12, 1], pos: [0, 0.9, 0], mat: m });
    s.add(bipyr(6, 0.13, 0.04, 0.18), { pos: [0, -0.4, 0], mat: m });
    for (i = 0; i <= 14; i++) path.push([Math.sin(i * 0.7) * 0.1, -0.55 - i * 0.1, Math.cos(i * 0.5) * 0.08]);
    s.add(tubeMesh(path, 0.014, 4, [1, 0, 0]), { mat: { emis: true, col: [235, 235, 235] } });
    s.add(ico(2, null, true), { sc: [0.2, 0.2, 0.2], pos: [path[14][0], path[14][1] - 0.18, path[14][2]], mat: mMetal([210, 170, 60], 0.9, 0.6, 50) });
    return s;
};
SCN.crystal = function (c, z, acc, o) {
    var s = new Scene(), r = rng(21 + (z || 0)), i, mt = o.metal ? 0.6 : 0;
    s.add(ico(1, lump(4, 0.25, 1.1, 0.3, 0.9), false, true), { pos: [0, -0.62, 0], mat: mPlastic([52, 56, 66], 0.05, 8) });
    for (i = 0; i < 8; i++) {
        var a = r() * 2 * PI, d = 0.1 + r() * 0.6, sz = 0.8 + r() * 0.7, col = shade(c, 0.8 + r() * 0.4);
        s.add(i % 2 ? bipyr(4, 0.34, 0.75, 0.4) : prismPt(6, 0.22, 0.55, 0.35), {
            sc: [sz, sz, sz], pos: [Math.cos(a) * d, -0.5 + r() * 0.1, Math.sin(a) * d],
            rot: [(r() - 0.5) * 0.9, r() * 6, (r() - 0.5) * 0.9],
            mat: mt ? mMetal(col, mt, 0.8, 50, 0) : { col: col, metal: 0, sp: 0.55, sh: 30 }
        });
    }
    return s;
};
SCN.gem = function (c) {
    var s = new Scene(), m = { gem: true, col: c, alpha: 0.62 };
    s.add(brilliant(), { sc: [1.15, 1.15, 1.15], rot: [0.55, 0.3, 0], mat: m });
    s.add(brilliant(), { sc: [0.55, 0.55, 0.55], pos: [1.5, -0.45, 0.4], rot: [-0.4, 1, 0.5], mat: m });
    s.add(brilliant(), { sc: [0.45, 0.45, 0.45], pos: [-1.35, -0.55, 0.5], rot: [0.3, 2, -0.5], mat: m });
    return s;
};
SCN.powder = function (c, z) {
    var s = new Scene(), r = rng(31 + (z || 0)), i;
    for (i = 0; i < 100; i++) {
        var a = r() * 2 * PI, rr = 1.35 * Math.sqrt(r()), top = 1.05 * Math.pow(1 - rr / 1.35, 1.1), sz = 0.09 + r() * 0.07;
        s.add(bipyr(4, 1, 1, 1), {
            sc: [sz, sz, sz], pos: [Math.cos(a) * rr, r() * top, Math.sin(a) * rr], rot: [r() * 3, r() * 6, r() * 3],
            mat: { col: shade(c, 0.78 + r() * 0.4), metal: 0, sp: 0.25, sh: 20 }
        });
    }
    return s;
};
SCN.ghost = function (c, z, acc) {
    var s = new Scene(), r = rng(9 + (z || 0)), i, P = [], col = acc || [6, 182, 212];
    s.add(ico(2, null, true), { sc: [0.95, 0.95, 0.95], mat: { glass: true, alpha: 0.28 } });
    var halo = s.spr([0, 0, 0], 1.4, col, 0.3, true);
    for (i = 0; i < 30; i++) P.push({ o: s.spr([0, 0, 0], i < 3 ? 0.16 : 0.07, i < 3 ? [255, 255, 255] : col, i < 3 ? 0.95 : 0.55, true), a: r() * 6.28, b: r() * PI, w: 0.4 + r() * 1.3, q: 0.2 + r() * 0.6 });
    s.tick = function (dt, t) {
        halo.a = 0.22 + 0.1 * Math.sin(t * 2);
        P.forEach(function (p) {
            var a = p.a + t * p.w, q = p.q;
            p.o.p[0] = Math.cos(a) * Math.sin(p.b) * q; p.o.p[1] = Math.cos(p.b) * q * Math.cos(t * p.w * 0.7); p.o.p[2] = Math.sin(a) * Math.sin(p.b) * q;
        });
    };
    s.tick(0, 0);
    return s;
};

/* =====================================================================
 * مجسّمات الواقعية الجديدة: كل عنصر بالشكل اللي بنشوفه بيه فعلًا
 * ===================================================================== */
function mRaw(c, o) {
    o = o || {};
    return { col: c, metal: o.metal == null ? 0.8 : o.metal, sp: o.sp == null ? 0.4 : o.sp, sh: o.sh || 30, rough: o.rough == null ? 0.3 : o.rough,
        nj: o.nj == null ? 0.15 : o.nj, j: o.j == null ? 0.16 : o.j, c2: o.c2 ? hex(o.c2) : null, mix: o.mix || 0, rain: o.rain || 0 };
}
/* سطح خشن بتفاصيل متعددة المستويات (ضوضاء 3 طبقات) */
function lump2(seed, amp, f, sx, sy, sz) {
    f = f || 1; sx = sx || 1; sy = sy || 1; sz = sz || 1;
    return function (p) {
        var a = p[0] * f, b = p[1] * f, c = p[2] * f;
        var n = Math.sin(a * 2.9 + seed) * Math.sin(b * 3.3 + seed * 1.7) * Math.sin(c * 3.1 + seed * 0.6) +
            0.5 * Math.sin(a * 6.1 + seed * 2) * Math.sin(c * 5.7 + seed + b) +
            0.25 * Math.sin(a * 11.3 + seed * 3.1) * Math.sin(b * 10.7 + c * 9.1 + seed);
        var r = 1 + amp * n; return [p[0] * r * sx, p[1] * r * sy, p[2] * r * sz];
    };
}
function heapPos(r, R, H) { var a = r() * 2 * PI, d = R * Math.sqrt(r()); return [Math.cos(a) * d, H * Math.pow(1 - d / R, 1.1) * (0.55 + 0.45 * r()), Math.sin(a) * d]; }
function aimY(d) { return [Math.atan2(d[2], d[1]), 0, Math.atan2(-d[0], Math.hypot(d[1], d[2]))]; }

/* --- فلز خام: قطع غير منتظمة بسطح متكسّر ولمعان حسب العنصر --- */
SCN.raw = function (c, z, acc, o) {
    var s = new Scene(), mat = mRaw(c, o), sd = o.sd || 4, amp = o.amp == null ? 0.32 : o.amp, f = o.f || 1, seed = (o.seed || 0) + z;
    var SH = {
        rock: [[1.3, 0.9, 1.05, 0, 0, 0], [0.9, 0.65, 0.8, 1.3, -0.25, 0.3], [0.7, 0.5, 0.6, -0.95, -0.4, 0.85]],
        one: [[1.45, 1.05, 1.2, 0, 0, 0]],
        plate: [[1.75, 0.34, 1.15, 0, 0, 0], [1.0, 0.26, 0.7, 0.55, 0.3, 0.25]],
        long: [[1.95, 0.5, 0.62, 0, 0, 0], [1.3, 0.38, 0.5, -0.2, 0.45, 0.4], [0.9, 0.3, 0.4, 0.5, -0.1, -0.7]],
        pebbles: [[0.8, 0.6, 0.75, -0.9, 0, 0.1], [0.7, 0.5, 0.65, 0.5, -0.05, 0.7], [0.65, 0.5, 0.6, 0.7, -0.05, -0.7], [0.5, 0.4, 0.5, -0.4, -0.1, -0.95]]
    }[o.shape || 'rock'];
    SH.forEach(function (p, i) {
        s.add(ico(i ? Math.max(1, sd - 1) : sd, lump2(seed + i * 3.7, amp, f, p[0], p[1], p[2])), { pos: [p[3], p[4], p[5]], rot: [0, i * 1.3, 0], mat: mat });
    });
    return s;
};

/* --- شظايا بلورية حادة (بورون، سيليكون، رينيوم) --- */
SCN.shards = function (c, z, acc, o) {
    var s = new Scene(), r = rng(z * 13 + 1), n = o.n || 9, i;
    var mat = mRaw(c, { metal: o.metal == null ? 0.6 : o.metal, sp: 0.9, sh: o.sh || 70, rough: 0, nj: o.nj == null ? 0.05 : o.nj, j: o.j == null ? 0.25 : o.j, c2: o.c2, mix: o.mix });
    for (i = 0; i < n; i++) {
        var sz = 0.38 + r() * 0.5, p = heapPos(r, 1.15, 0.7);
        s.add(ico(1, lump2(i * 2.3 + z, 0.5, 1.2, 0.8 + r() * 0.6, 0.5 + r() * 0.5, 0.7 + r() * 0.5), false, true), { sc: [sz, sz, sz], pos: [p[0], sz * 0.55 + p[1], p[2]], rot: [r() * 6, r() * 6, r() * 6], mat: mat });
    }
    return s;
};

/* --- حبيبات / كرات (نيكل، سيلينيوم، رصاص، إنديوم...) --- */
SCN.pellets = function (c, z, acc, o) {
    var s = new Scene(), r = rng(z + 41), n = o.n || 26, sz0 = o.size || 0.32, irr = o.irr, i;
    var mat = mRaw(c, { metal: o.metal == null ? 0.9 : o.metal, sp: o.sp == null ? 0.8 : o.sp, sh: o.sh || 60, rough: o.rough == null ? 0.1 : o.rough, nj: 0, j: irr ? 0.2 : 0.06, c2: o.c2, mix: o.mix });
    for (i = 0; i < n; i++) {
        var p = heapPos(r, 1.3, 0.9), sz = sz0 * (0.75 + r() * 0.5);
        s.add(ico(1, irr ? lump2(i * 2.1 + z, 0.22, 1.4) : null, !irr), { sc: [sz, sz, sz], pos: [p[0], sz * 0.8 + p[1], p[2]], rot: [r() * 6, r() * 6, 0], mat: mat });
    }
    return s;
};

/* --- رقائق وبرادة (نحاس، ماغنسيوم، كروم، منجنيز) --- */
SCN.flakes = function (c, z, acc, o) {
    var s = new Scene(), r = rng(z + 61), n = o.n || 55, size = o.size || 1, i;
    var mat = mRaw(c, { metal: o.metal == null ? 0.88 : o.metal, sp: 0.7, sh: 50, rough: o.rough == null ? 0.15 : o.rough, nj: 0.3, j: 0.25, c2: o.c2, mix: o.mix });
    for (i = 0; i < n; i++) {
        var p = heapPos(r, 1.35, 0.85), a = (0.28 + r() * 0.4) * size, b = (0.2 + r() * 0.35) * size;
        s.add(bar(1, 1, 0.85, 0.9, 0.06 + r() * 0.05), { sc: [a, 1, b], pos: [p[0], p[1] + 0.05, p[2]], rot: [(r() - 0.5) * 1.1, r() * 6, (r() - 0.5) * 1.1], mat: mat });
    }
    return s;
};

/* --- حزمة قضبان (ألومنيوم، أسياخ حديد مضلّعة) --- */
SCN.bundle = function (c, z, acc, o) {
    var s = new Scene(), r = rng(z + 3), rr = o.rr || 0.3, i, k, pos = [[0, 0]];
    var m = mRaw(c, { metal: o.metal == null ? 0.9 : o.metal, sp: 0.55, sh: 45, rough: o.rough == null ? 0.12 : o.rough, nj: o.nj || 0, j: 0.08, c2: o.c2, mix: o.mix });
    for (i = 0; i < 6; i++) { var a = i * PI / 3 + 0.5; pos.push([Math.cos(a) * rr * 2.05, Math.sin(a) * rr * 2.05]); }
    pos.forEach(function (p) {
        var h = 2.7 + r() * 0.5, x0 = (r() - 0.5) * 0.5;
        s.add(cyl(rr, h, 18), { pos: [x0, p[0], p[1]], rot: [0, 0, PI / 2], mat: m });
        if (o.rib) for (k = 0; k < 11; k++) s.add(cyl(rr * 1.2, 0.05, 12), { pos: [x0 - h / 2 + 0.15 + k * (h - 0.3) / 10, p[0], p[1]], rot: [0, 0, PI / 2], mat: m });
    });
    return s;
};

/* --- إسفنج معدني (تيتانيوم) --- */
SCN.sponge = function (c, z, acc, o) {
    var s = new Scene(), r = rng(z + 91), i, mat = mRaw(c, { metal: 0.55, sp: 0.25, sh: 25, rough: 0.5, nj: 0.3, j: 0.3, c2: o.c2, mix: o.mix });
    for (i = 0; i < 26; i++) {
        var a = r() * 2 * PI, d = 1.25 * Math.sqrt(r()), sz = 0.3 + r() * 0.32;
        s.add(ico(1, lump2(i * 1.7 + z, 0.55, 1.3, 1, 0.8, 1)), { sc: [sz, sz, sz], pos: [Math.cos(a) * d, sz * 0.6 + (1 - d / 1.25) * 0.7 * r(), Math.sin(a) * d], rot: [r() * 6, r() * 6, r() * 6], mat: mat });
    }
    return s;
};

/* --- قضيب بلوري خشن (زركونيوم، فاناديوم، هافنيوم) --- */
SCN.crbar = function (c, z, acc, o) {
    var s = new Scene(), r = rng(z * 5 + 3), mat = mRaw(c, { metal: 0.85, sp: 0.5, sh: 40, rough: 0.2, nj: 0.2, j: 0.22, c2: o.c2, mix: o.mix, rain: o.rain });
    [[-0.55, 0], [0.4, 1]].forEach(function (b, bi) {
        var k, n = 9, len = 2.5;
        for (k = 0; k < n; k++) {
            var t = k / (n - 1) - 0.5, rr = 0.34 + r() * 0.13;
            s.add(ico(1, lump2(k * 2 + bi * 7 + z, 0.4, 1.3, 1, 1.1, 1)), { sc: [rr * 1.5, rr, rr], pos: [t * len + bi * 0.25, 0.05 * Math.sin(t * 4) + rr * 0.2, b[0]], rot: [r() * 6, r() * 6, r() * 6], mat: mat });
        }
    });
    return s;
};

/* --- بلورات متفرّعة (كالسيوم، ديسبروسيوم) --- */
SCN.dend = function (c, z, acc, o) {
    var s = new Scene(), r = rng(z * 11 + 5), b, t, mat = mRaw(c, { metal: 0.92, sp: 0.75, sh: 60, rough: 0.05, nj: 0.08, j: 0.2, c2: o.c2, mix: o.mix });
    s.add(ico(1, lump2(z, 0.35, 1.3, 1, 0.5, 1)), { sc: [0.75, 0.75, 0.75], pos: [0, -0.3, 0], mat: mat });
    for (b = 0; b < 14; b++) {
        var th = r() * 2 * PI, ph = 0.15 + r() * 1.25, d = [Math.cos(th) * Math.sin(ph), Math.cos(ph), Math.sin(th) * Math.sin(ph)];
        for (t = 0; t < 4; t++) {
            var dist = 0.25 + t * 0.33 + r() * 0.08, w = 0.15 - t * 0.028;
            s.add(bipyr(4, 1, 1.5, 1.5), { sc: [w, 0.3, w], pos: [d[0] * dist, d[1] * dist - 0.2, d[2] * dist], rot: aimY(d), mat: mat });
        }
    }
    return s;
};

/* --- مكعبات مصقولة (تنجستن، تانتالوم) --- */
SCN.cubes = function (c, z, acc, o) {
    var s = new Scene(), m = mRaw(c, { metal: 0.92, sp: 0.7, sh: 60, rough: 0.05, nj: 0.02, j: 0.06, c2: o.c2, mix: o.mix });
    [[-0.7, -0.0, 0.2, 0.25, 1.2], [0.85, -0.15, -0.3, -0.4, 0.9], [-0.55, 1.03, 0.15, 0.9, 0.85]].forEach(function (q) {
        s.add(bar(1, 1, 0.96, 0.96, 1), { sc: [q[4], q[4], q[4]], pos: [q[0], q[1], q[2]], rot: [0, q[3], 0], mat: m });
    });
    return s;
};

/* --- زر مصهور بقوس كهربي (روثينيوم، إيريديوم، لوتيتيوم، بلوتونيوم) --- */
SCN.button = function (c, z, acc, o) {
    var s = new Scene(), mat = mRaw(c, { metal: o.metal == null ? 0.9 : o.metal, sp: 0.55, sh: 45, rough: 0.15, nj: 0.12, j: 0.12, c2: o.c2, mix: o.mix });
    function dome(seed, amp) { var g = lump2(seed, amp, 2); return function (p) { var q = g(p); return [q[0], q[1] > 0 ? q[1] * 0.55 : q[1] * 0.1, q[2]]; }; }
    s.add(ico(3, dome(z, 0.12)), { sc: [1.25, 1, 1.25], mat: mat });
    s.add(ico(2, dome(z + 3, 0.14)), { sc: [0.8, 0.7, 0.8], pos: [1.55, 0, 0.5], rot: [0, 1, 0], mat: mat });
    s.add(ico(2, dome(z + 6, 0.14)), { sc: [0.55, 0.5, 0.55], pos: [-1.2, 0, 0.9], rot: [0, 2, 0], mat: mat });
    return s;
};

/* --- بزموت: بلورة مدرّجة بألوان قوس قزح --- */
SCN.hopper = function (c, z, acc, o) {
    var s = new Scene(), r = rng(z + 17);
    function hop(x, zz, sz, ry) {
        for (var i = 0; i < 7; i++) {
            var w = sz * (1 - i * 0.13), h = sz * 0.16, col = hsv(i * 0.85 + 0.4 + r() * 0.25, 0.6, 1);
            s.add(bar(w, w, w * 0.97, w * 0.97, h), { pos: [x, i * h, zz], rot: [0, ry + i * 0.04, 0], mat: { col: col, metal: 0.55, sp: 0.9, sh: 60, j: 0.1 } });
        }
    }
    hop(0, 0, 1.9, 0.3); hop(1.65, 0.5, 1.0, -0.5); hop(-1.45, 0.6, 0.9, 0.9);
    return s;
};

/* --- ألواح مموّجة (زنك) --- */
function waveSheet(w, len, amp, fq, nseg) {
    var v = [], f = [], i;
    for (i = 0; i <= nseg; i++) { var x = -len / 2 + len * i / nseg, y = amp * Math.sin(fq * x); v.push([x, y, -w / 2], [x, y, w / 2]); }
    for (i = 0; i < nseg; i++) {
        var xm = -len / 2 + len * (i + 0.5) / nseg, nn = nrm([-amp * fq * Math.cos(fq * xm), 1, 0]);
        f.push({ i: [2 * i, 2 * i + 2, 2 * i + 3, 2 * i + 1], n: nn });
        f.push({ i: [2 * i + 1, 2 * i + 3, 2 * i + 2, 2 * i], n: [-nn[0], -nn[1], -nn[2]] });
    }
    return mk(v, f);
}
SCN.corr = function (c, z, acc, o) {
    var s = new Scene(), m = mRaw(c, { metal: 0.8, sp: 0.6, sh: 50, rough: 0.1, nj: 0.05, j: 0.22 });
    s.add(waveSheet(1.7, 3.2, 0.13, 14, 64), { rot: [0, 0.25, 0], mat: m });
    s.add(waveSheet(1.5, 2.9, 0.13, 14, 64), { pos: [0.3, 0.42, 0.55], rot: [0.12, -0.3, 0.05], mat: m });
    return s;
};

/* --- شريط ملفوف (ماغنسيوم) --- */
SCN.ribbon = function (c, z, acc, o) {
    var s = new Scene(), v = [], f = [], N = 110, turns = 3.2, R = 0.7, W = 0.55, i;
    for (i = 0; i <= N; i++) {
        var t = i / N, a = t * turns * 2 * PI, x = (t - 0.5) * 2.0, rr = R * (1 + 0.07 * Math.sin(a * 2));
        v.push([x - W / 2, Math.cos(a) * rr, Math.sin(a) * rr], [x + W / 2, Math.cos(a) * rr, Math.sin(a) * rr]);
    }
    for (i = 0; i < N; i++) {
        var am = (i + 0.5) / N * turns * 2 * PI, nn = [0, Math.cos(am), Math.sin(am)];
        f.push({ i: [2 * i, 2 * i + 1, 2 * i + 3, 2 * i + 2], n: nn });
        f.push({ i: [2 * i + 2, 2 * i + 3, 2 * i + 1, 2 * i], n: [0, -nn[1], -nn[2]] });
    }
    s.add(mk(v, f), { rot: [0.5, 0.35, 0], mat: mMetal(c, 0.95, 0.7, 60, 0.05) });
    return s;
};

/* --- سبيكة أسطوانية داكنة (يورانيوم) --- */
SCN.slug = function (c, z, acc, o) {
    var s = new Scene(), m = mRaw(c, { metal: 0.35, sp: 0.25, sh: 20, rough: 0.5, nj: 0.14, j: 0.3, c2: o.c2 || '#5a5446', mix: o.mix == null ? 0.35 : o.mix });
    s.add(cyl(0.95, 1.5, 36), { mat: m });
    s.add(cyl(0.6, 1.0, 30), { pos: [1.75, -0.25, 0.4], rot: [PI / 2, 0.6, 0], mat: m });
    return s;
};

/* --- أسطوانة غاز صلب --- */
SCN.bottle = function (c, z, acc, o) {
    var s = new Scene(), body = mMetal([112, 122, 134], 0.75, 0.5, 40, 0.1), top = { col: c, metal: 0.35, sp: 0.6, sh: 40 }, brass = mMetal([200, 164, 72], 0.9, 0.7, 50);
    s.add(cyl(0.62, 2.3, 40), { mat: body });
    s.add(cyl(0.62, 0.45, 40, 0.24), { pos: [0, 1.375, 0], mat: top });
    s.add(cyl(0.2, 0.3, 14), { pos: [0, 1.75, 0], mat: brass });
    s.add(cyl(0.09, 0.5, 12), { pos: [0.22, 1.83, 0], rot: [0, 0, PI / 2], mat: brass });
    s.add(cyl(0.36, 0.05, 22), { pos: [0, 2.0, 0], mat: mPlastic([40, 40, 46], 0.3, 20) });
    s.add(cyl(0.66, 0.12, 40), { pos: [0, -1.21, 0], mat: mPlastic([34, 36, 42], 0.3, 20) });
    s.add(cyl(0.63, 0.4, 40), { pos: [0, 0.35, 0], mat: mPlastic([232, 234, 230], 0.2, 20) });
    return s;
};

/* --- دورق دائري فيه غاز ملوّن --- */
SCN.flask = function (c, z, acc, o) {
    var s = new Scene(), r = rng(3 + z), P = [], i;
    s.add(ico(2, null, true), { sc: [1.15, 1.15, 1.15], mat: GLASS });
    s.add(cyl(0.3, 0.9, 28), { pos: [0, 1.4, 0], mat: GLASS });
    s.add(cyl(0.36, 0.26, 20, 0.3), { pos: [0, 1.98, 0], mat: mPlastic([34, 34, 40], 0.3, 20) });
    s.add(cyl(0.55, 0.1, 30), { pos: [0, -1.12, 0], mat: mPlastic([40, 42, 48], 0.3, 20) });
    for (i = 0; i < 64; i++) {
        var a = r() * 2 * PI, b = Math.acos(2 * r() - 1), d = 0.9 * Math.cbrt(r()), sp = s.spr([0, 0, 0], 0.32 + r() * 0.14, c, 0.34, false);
        sp.x = Math.sin(b) * Math.cos(a) * d; sp.y = Math.cos(b) * d; sp.z = Math.sin(b) * Math.sin(a) * d;
        sp.vx = (r() - 0.5) * 0.5; sp.vy = (r() - 0.5) * 0.5; sp.vz = (r() - 0.5) * 0.5; P.push(sp);
    }
    s.tick = function (dt) {
        P.forEach(function (q) {
            q.x += q.vx * dt; q.y += q.vy * dt; q.z += q.vz * dt;
            if (Math.hypot(q.x, q.y, q.z) > 0.9) { q.vx = -q.vx; q.vy = -q.vy; q.vz = -q.vz; q.x *= 0.96; q.y *= 0.96; q.z *= 0.96; }
            q.p[0] = q.x; q.p[1] = q.y; q.p[2] = q.z;
        });
    };
    s.tick(0);
    return s;
};

/* --- برطمان زجاج فيه فلز تحت الزيت (ليثيوم، صوديوم، بوتاسيوم) --- */
SCN.jar = function (c, z, acc, o) {
    var s = new Scene(), r = rng(z * 7 + 2), i, mat = mRaw(c, { metal: 0.9, sp: 0.6, sh: 50, rough: 0.15, nj: 0.12, j: 0.2, c2: o.c2, mix: o.mix });
    s.add(cyl(0.9, 1.9, 44), { mat: GLASS });
    s.add(cyl(0.84, 1.5, 44), { pos: [0, -0.18, 0], mat: { glass: true, alpha: 1.0, gcol: 'rgb(238,200,96)' } });
    s.add(cyl(0.94, 0.34, 44), { pos: [0, 1.12, 0], mat: mPlastic([32, 34, 40], 0.4, 30) });
    var n = o.n || 3, sz = o.size || 0.5;
    for (i = 0; i < n; i++) {
        var a = i / n * 6.28 + r(), d = i ? 0.28 + r() * 0.22 : 0, k = sz * (1 - i * 0.1);
        s.add(ico(2, lump2(i * 5 + z, 0.28, 1, 1.2, 0.8, 1)), { sc: [k, k, k], pos: [Math.cos(a) * d, -0.95 + k * 0.62 + i * 0.05, Math.sin(a) * d], rot: [0, r() * 6, 0], mat: mat });
    }
    return s;
};

/* --- أمبولة زجاج مقفولة بغاز خامل (فلزات نشطة ونادرة) --- */
SCN.ampoule = function (c, z, acc, o) {
    var s = new Scene(), r = rng(z * 3 + 1), piece = o.piece || 'chunk', i;
    var mat = mRaw(c, { metal: 0.95, sp: 0.7, sh: 55, rough: 0.1, nj: o.nj == null ? 0.1 : o.nj, j: 0.15, c2: o.c2, mix: o.mix });
    s.add(cyl(0.56, 1.6, 36), { mat: GLASS });
    s.add(cyl(0.56, 0.8, 36, 0.09), { pos: [0, 1.2, 0], mat: GLASS });
    if (piece === 'drop') {
        s.add(ico(2, null, true), { sc: [0.38, 0.32, 0.38], pos: [0, -0.8 + 0.3, 0], mat: mMetal(c, 0.95, 0.9, 90, 0.1) });
        s.add(ico(1, null, true), { sc: [0.14, 0.12, 0.14], pos: [0.22, -0.8 + 0.12, 0.1], mat: mMetal(c, 0.95, 0.9, 90, 0.1) });
    } else if (piece === 'wire') {
        var path = [];
        for (i = 0; i <= 60; i++) { var a = i / 60 * 5 * 2 * PI; path.push([Math.cos(a) * 0.26, -0.7 + i / 60 * 0.8, Math.sin(a) * 0.26]); }
        s.add(tubeMesh(path, 0.05, 8, [0, 1, 0]), { mat: mMetal(c, 0.95, 0.8, 70, 0.05) });
    } else if (piece === 'shards') {
        for (i = 0; i < 4; i++) s.add(ico(1, lump2(i * 3 + z, 0.5, 1.2, 1.1, 0.6, 0.9), false, true), { sc: [0.3, 0.3, 0.3], pos: [(r() - 0.5) * 0.5, -0.8 + 0.18 + i * 0.07, (r() - 0.5) * 0.5], rot: [r() * 6, r() * 6, r() * 6], mat: mat });
    } else {
        s.add(ico(2, lump2(z, 0.3, 1, 1.2, 0.8, 1)), { sc: [0.38, 0.38, 0.38], pos: [0, -0.8 + 0.25, 0], mat: mat });
        s.add(ico(1, lump2(z + 4, 0.3, 1, 1, 0.8, 1)), { sc: [0.2, 0.2, 0.2], pos: [0.2, -0.8 + 0.14, 0.15], mat: mat });
    }
    return s;
};

/* --- سبائك: n=1 سبيكة واحدة، n=2 سبيكتين، n=3 هرم (ذهب) --- */
SCN.ingot = function (c, z, acc, o) {
    o = o || {};
    var s = new Scene(), n = o.n == null ? 3 : o.n, cast = o.cast;
    var base = { metal: o.metal == null ? 0.92 : o.metal, sp: o.sp == null ? 0.6 : o.sp, sh: o.sh || 55, rough: o.rough || 0, nj: cast ? (o.nj == null ? 0.1 : o.nj) : (o.nj || 0), j: cast ? 0.2 : 0.05, c2: o.c2, mix: o.mix };
    var m = mRaw(c, base), m2 = mRaw(shade(c, 0.86), base);
    var lay = n === 1 ? [[0, 0, 0, 0.1, 1.25]] : n === 2 ? [[-0.05, 0, -0.45, 0.1, 1], [0.15, 0.6, 0.1, -0.35, 1]] :
        [[-0.1, 0, -0.62, 0.05, 1], [0.1, 0, 0.62, -0.04, 1], [0, 0.6, 0, 0.12, 1]];
    lay.forEach(function (p) {
        s.add(bar(2.2, 1.1, 1.8, 0.82, 0.6), { sc: [p[4], p[4], p[4]], pos: [p[0], p[1], p[2]], rot: [0, p[3], 0], mat: m });
        s.add(bar(1.25, 0.5, 1.1, 0.42, 0.05), { sc: [p[4], p[4], p[4]], pos: [p[0], p[1] + 0.325 * p[4], p[2]], rot: [0, p[3], 0], mat: m2 });
    });
    return s;
};

/* --- أنبوبة تفريغ كهربي بأشكال مختلفة (نيون، أرجون، كريبتون، زينون) --- */
SCN.tube = function (c, z, acc, o) {
    o = o || {};
    var s = new Scene(), path = [], i, N = 70, sh = o.shape || 'wave', ymin = 1e9;
    for (i = 0; i <= N; i++) {
        var t = i / N, x = -1.75 + 3.5 * t, p;
        if (sh === 'line') p = [x, 0, 0];
        else if (sh === 'arch') { var a = t * PI; p = [-1.6 * Math.cos(a), 1.0 * Math.sin(a) - 0.4, 0]; }
        else if (sh === 'helix') { var q = t * PI * 6; p = [x * 0.9, 0.5 * Math.sin(q), 0.5 * Math.cos(q)]; }
        else p = [x, 0.5 * Math.sin(x * 2.1), 0];
        path.push(p); if (p[1] < ymin) ymin = p[1];
    }
    var up = sh === 'helix' ? [0.3, 0.2, 0.93] : [0, 0, 1];
    s.add(tubeMesh(path, 0.16, 10, up), { mat: { emis: true, col: c } });
    s.add(tubeMesh(path, 0.25, 10, up), { mat: { glass: true, alpha: 0.4 } });
    s.add(bar(4, 0.6, 4, 0.6, 0.08), { pos: [0, ymin - 0.6, 0], mat: mPlastic([26, 28, 36], 0.3, 20) });
    [path[0], path[N]].forEach(function (p) { s.add(ico(1, null, true), { sc: [0.24, 0.24, 0.24], pos: p, mat: mMetal([96, 100, 108], 0.8, 0.5, 40) }); });
    for (i = 0; i <= N; i += 3) s.spr(path[i], 0.6, c, 0.2, true);
    return s;
};

/* ---------- البيانات ---------- */
var DD = {
    ingot: 'فلز لامع، الشكل ده هو الشكل التجاري المعتاد لعيناته النقية (سبائك مصقولة).',
    chunk: 'فلز صلب لامع، بنشوفه قطع خام ونقية في معامل الكيمياء أكتر من الحياة اليومية.',
    rods: 'فلز صلب بيتصنّع على شكل قضبان وأسلاك.',
    disc: 'فلز لامع بيتصنّع على شكل عملات وأقراص.',
    nugget: 'قطعة فلز زي ما بتتستخرج من الطبيعة.',
    crystal: 'بلورات بتتكوّن بشكل طبيعي وبتتجمّع في عناقيد.',
    powder: 'مسحوق ناعم من حبيبات صغيرة.',
    raw: 'قطعة فلز خام بسطح خشن زي ما بنشوفها في المعامل ومتاحف المعادن.',
    shards: 'شظايا بلورية حادة لامعة.',
    pellets: 'حبيبات أو كرات صغيرة بتتباع بالكيلو للتصنيع.',
    flakes: 'رقائق رفيعة لامعة.',
    sponge: 'إسفنج معدني مسامي خشن.',
    cubes: 'مكعبات مصقولة بتتصنّع للمعامل والمقتنيات.',
    button: 'كتلة مصهورة بقوس كهربي على شكل زر محدّب.'
};
var LANTH = 'من «العناصر الأرضية النادرة»؛ فلز فضي بيتأكسد بسرعة فبيتخزن في عبوات محكمة.';
/* العنصر|النوع|اللون|الاسم|الوصف|اسم قصير|خيارات (مفتاح=قيمة) */
var RAW = [
 '1|bottle|#c62828|أسطوانة هيدروجين|غاز عديم اللون والرائحة وأخف غاز في الكون؛ بيتخزّن ويتنقل في أسطوانات صلب عالية الضغط.|أسطوانة',
 '2|balloon|#ef4444|بالون هيليوم|غاز خفيف عديم اللون؛ عشان كده بتطير بالونات الأفراح المملوءة بيه.',
 '3|jar|#d9dde1|ليثيوم (محفوظ تحت الزيت)|أخف الفلزات وطري لدرجة إنه بيتقطع بالسكينة، وبيتحفظ تحت الزيت عشان بيتأكسد بسرعة. هو اللي بيشغّل بطارية موبايلك.|تحت الزيت|n=3,size=0.45,c2=#8d9096,mix=0.45',
 '3|ampoule|#dfe2e6|ليثيوم (سلك في أمبولة)|سلك ليثيوم لامع جوه أمبولة زجاج مقفولة بغاز خامل.|أمبولة|piece=wire',
 '4|pellets|#aab0b6|بيريليوم (حبيبات)|فلز رمادي فضي خفيف وصلب جدًا؛ بيدخل في سبائك الطائرات والأقمار الصناعية ونوافذ أجهزة الأشعة.||n=26,size=0.3,irr=1,metal=0.75,rough=0.35,sh=35',
 '5|shards|#15151c|بورون نقي (بلورات سودا لامعة)|صلب جدًا وسواده لامع زي الزجاج؛ بنشوفه غالبًا جوه مركبات زي البوراكس.|بلورات|n=9,metal=0.55,sh=90,j=0.3',
 '5|powder|#4a362a|بورون (مسحوق بني)|مسحوق بني داكن ناعم بيتصنّع كده في المعامل.|مسحوق',
 '6|gem|#c8f0ff|ألماس|كربون مرتب في بلورات صلبة شفافة بتلمع؛ أصلب مادة طبيعية.|ألماس',
 '6|rods|#3a3d46|جرافيت (سن القلم الرصاص)|نفس الكربون بس مرتب في طبقات بتنزلق على بعضها، عشان كده بيكتب على الورق.|جرافيت|hex=1',
 '6|rock|#1d1e22|فحم|كربون غير نقي بنشوفه في الشواء والتدفئة.|فحم',
 '7|bottle|#1f2933|أسطوانة نيتروجين|بيمثل 78% من الهواء اللي حوالينا؛ عديم اللون والرائحة وبيتخزّن في أسطوانات.',
 '8|bottle|#e9eef3|أسطوانة أكسجين|21% من الهواء وضروري للتنفس؛ بنشوفه في أسطوانات المستشفيات واللحام.',
 '9|flask|#e7ee8f|غاز الفلور|غاز أصفر باهت سام جدًا وشديد النشاط، مبنشوفوش خارج المعامل.',
 '10|tube|#ff5a36|نيون (لافتات مضيئة)|غاز نبيل عديم اللون، وبيطلع ضوء برتقالي أحمر لما الكهرباء تعدّي فيه؛ ده سر لافتات النيون.||shape=wave',
 '11|jar|#dde1e5|صوديوم (تحت الزيت)|فلز فضي طري بيتقطع بالسكينة وبيتحفظ تحت الزيت لأنه بيتفاعل بعنف مع الماء والهواء.||n=3,size=0.55,c2=#9ba0a7,mix=0.3',
 '12|ribbon|#dfe2e6|ماغنسيوم (شريط)|فلز فضي خفيف؛ شريطه لما يتولّع بيطلع ضوء أبيض ساطع.|شريط',
 '12|flakes|#cdd1d6|ماغنسيوم (برادة)|برادة ناعمة بتتولّع بسهولة وبتدخل في الألعاب النارية.|برادة|n=90,size=0.55',
 '13|bundle|#d8dde3|ألومنيوم (قضبان)|فلز فضي خفيف بيتصنّع قضبان وقطاعات للشبابيك والهياكل.|قضبان|rr=0.3',
 '13|can|#d7dce2|ألومنيوم (علب ومواعين)|فلز فضي خفيف بنشوفه كل يوم في علب المشروبات والمواعين.|علب',
 '14|shards|#78859a|سيليكون نقي|رمادي مايل للأزرق ولامع؛ أساس الرقائق الإلكترونية.|قطع|n=9,metal=0.7,sh=80',
 '14|wafer|#5a6a8c|رقاقة سيليكون|بيتقطع منها المعالجات اللي في الموبايل والكمبيوتر.|رقاقة',
 '15|powder|#b91c1c|فوسفور أحمر|مسحوق أحمر داكن؛ موجود على جانب علبة الكبريت.|مسحوق',
 '15|raw|#6b1d1d|فوسفور أحمر (كتلة)|كتلة حمرا داكنة لامعة بتتصنّع في المعامل.|كتلة|shape=one,metal=0.2,sp=0.7,sh=45,amp=0.25,nj=0.2',
 '16|crystal|#f4d21f|كبريت أصفر (بلورات)|بلورات صفرا بتتكوّن حوالين البراكين والينابيع الحارة.|بلورات',
 '16|powder|#f2cf2a|مسحوق الكبريت|بودرة صفرا بنشوفها في الزراعة وبعض الأدوية.|بودرة',
 '16|rock|#e6c52a|حجر كبريت|قطع صفرا خشنة لها ريحة مميزة.|قطع',
 '17|flask|#c7e35a|غاز الكلور|غاز أخضر مصفر خانق وسام؛ بنشوف أثره في مطهرات حمامات السباحة.',
 '18|tube|#b79bff|أرجون (مصابيح)|غاز نبيل بيطلع ضوء بنفسجي لما الكهرباء تعدّي فيه، وبيتحط جوه اللمبات.||shape=line',
 '19|jar|#cfd3d8|بوتاسيوم (تحت الزيت)|فلز فضي طري جدًا بيتغطى بسرعة بطبقة رمادية مايلة للبنفسجي؛ بيتحفظ تحت الزيت.||n=4,size=0.5,c2=#6a6684,mix=0.55',
 '20|dend|#d6d9dc|كالسيوم (فلز)|فلز فضي رمادي بيتكوّن منه شكل متفرّع لما يتنقّى بالتقطير؛ في حياتنا بنشوفه في مركبات زي الطباشير والعظام.||c2=#9ea3a8,mix=0.4',
 '21|raw|#cfc9cc|سكانديوم|فلز فضي ببريق وردي خفيف؛ بيُضاف لسبائك الألومنيوم في الطائرات والمعدات الرياضية.||shape=long,metal=0.85,sp=0.5',
 '22|sponge|#9ca3aa|تيتانيوم (إسفنج)|بيتصنّع الأول كإسفنج رمادي مسامي بعدين بيتصهر؛ قوي وخفيف ومقاوم للتآكل.|إسفنج',
 '22|rods|#a8aeb6|تيتانيوم (قضبان)|بيدخل في مفاصل الأطراف الصناعية وهياكل الطيارات.|قضبان',
 '23|crbar|#b8bec6|فاناديوم (قضيب بلوري)|فلز فضي مايل للأزرق؛ بيقوّي الصلب ويدخل في صناعة الأدوات.',
 '24|raw|#8d9299|كروم (قطع خام)|فلز رمادي صلب؛ بيدّي حنفيات وإكسسوارات السيارات لمعة المرايا (طلاء الكروم).|قطع|shape=rock,metal=0.7,sh=45,nj=0.25',
 '24|flakes|#dfe4e8|كروم (رقائق لامعة)|رقائق فضية لامعة بتتنتج بالتحليل الكهربائي.|رقائق|n=55,metal=0.95',
 '25|raw|#80838a|منجنيز|فلز رمادي هش صلب؛ بيدخل في صناعة الصلب والبطاريات الجافة.|قطع|shape=rock,metal=0.45,rough=0.6,sp=0.2,c2=#6e6068,mix=0.35',
 '25|flakes|#9c9298|منجنيز (رقائق)|رقائق رمادية مايلة للوردي بتتنتج بالتحليل الكهربائي.|رقائق|n=50,metal=0.5,rough=0.4',
 '26|bundle|#6a6f76|حديد (أسياخ التسليح)|الحديد في حياتنا بيتحول غالبًا لصلب، زي أسياخ التسليح المضلّعة في المباني.|أسياخ|rib=1,rr=0.28,metal=0.6,rough=0.3,nj=0.05,c2=#8a5a3c,mix=0.15',
 '26|nails|#7b8088|حديد (مسامير)|مسامير الصلب.|مسامير',
 '26|ingot|#5e6269|سبيكة حديد (زهر)|الشكل التجاري للحديد قبل ما يتشكّل.|سبيكة|n=2,cast=1,metal=0.6,rough=0.35,nj=0.12',
 '27|raw|#8b98a9|كوبالت|فلز رمادي مزرق لامع بيدخل في البطاريات وفي الأصباغ الزرقا للزجاج والخزف.||shape=plate,metal=0.85,sh=50',
 '28|ingot|#cfd4d9|نيكل (سبائك)|فلز فضي لامع بيدخل في العملات والصلب المقاوم للصدأ.|سبائك|n=2,metal=0.95',
 '28|pellets|#c7ccd2|نيكل (كرات)|كرات نيكل بتتستخدم في الطلاء الكهربائي.|كرات|n=26,size=0.3,irr=1,metal=0.9,rough=0.2',
 '29|coil|#c8702a|نحاس (سلك)|أحمر برتقالي لامع وموصل ممتاز للكهرباء؛ أسلاك البيوت.|سلك',
 '29|raw|#c9783a|نحاس خام|قطعة نحاس طبيعية بسطح خشن وبقع خضرا (صدأ النحاس).|خام|shape=one,amp=0.3,metal=0.85,sp=0.5,c2=#4d9a7a,mix=0.22,nj=0.25',
 '29|flakes|#c76f2d|نحاس (برادة)|رايش نحاس لامع بيتنتج من الخراطة.|برادة|n=90,size=0.55',
 '30|corr|#b0b9c2|زنك (ألواح مموّجة)|فلز فضي مزرق بيتصنّع ألواح وبيتغطّى بيه الحديد (جلفنة) عشان ما يصدّيش.|ألواح',
 '30|pellets|#b8c0c8|زنك (حبيبات)|حبيبات زنك للتصنيع.|حبيبات|n=26,size=0.3,irr=1,metal=0.8,rough=0.3',
 '31|raw|#d3d9e0|جاليوم|فلز فضي لامع بينصهر في إيدك لأن انصهاره حوالي 30°م.||shape=plate,metal=0.97,sp=0.9,sh=80,rough=0,nj=0.04,amp=0.14',
 '32|raw|#a5abb3|جرمانيوم|فلز أبيض رمادي لامع هش؛ شبه موصل بيدخل في الألياف الضوئية والإلكترونيات.||shape=one,metal=0.85,sp=0.8,sh=60,nj=0.28,amp=0.36',
 '33|ampoule|#7a808a|زرنيخ (أمبولة)|رمادي معدني لامع بيسوّد بالتأكسد، وسام جدًا فبيتحفظ في أمبولة مقفولة.||piece=shards,c2=#3a3d42,mix=0.35',
 '34|pellets|#6c7077|سيلينيوم (حبيبات رمادية)|الشكل الثابت منه رمادي معدني؛ بيتستخدم في الخلايا الضوئية والزجاج.|حبيبات|n=26,size=0.3,irr=1,metal=0.8,sh=45,rough=0.25',
 '34|powder|#b6422d|سيلينيوم (مسحوق أحمر)|الشكل الأحمر غير المتبلور.|مسحوق',
 '35|vial|#7a1c10|بروم (سائل بني محمر)|اللافلز الوحيد اللي سائل في الجو العادي، بني محمر وريحته خانقة.',
 '36|tube|#dfe6df|كريبتون|غاز نبيل بيطلع ضوء أبيض مخضر لما الكهرباء تعدّي فيه.||shape=arch',
 '37|ampoule|#dad6cc|روبيديوم (أمبولة)|فلز فضي طري شديد النشاط بيتحفظ في أمبولة مقفولة.||piece=chunk',
 '38|raw|#d8d3bd|سترونشيوم|فلز فضي مصفر طري بيتأكسد بسرعة ويتغطى بطبقة صفرا؛ بيدّي لون أحمر للألعاب النارية.||shape=pebbles,metal=0.8,c2=#cdbf86,mix=0.5',
 '39|raw|#bcc1c7|إتريوم|فلز فضي بيدخل في شاشات التلفزيون الملونة والليزر.||shape=long,metal=0.85,sp=0.5',
 '40|crbar|#9fa6ad|زركونيوم (قضيب بلوري)|بيتنقّى كقضيب بلوري خشن؛ مقاوم جدًا للتآكل وبيدخل في أغلفة وقود المفاعلات.|قضيب بلوري',
 '40|rods|#a0a7af|زركونيوم (قضبان)|بيدخل في أغلفة وقود المفاعلات والأجهزة الطبية.|قضبان',
 '41|raw|#8e97a6|نيوبيوم|فلز رمادي بيتلوّن بألوان قوس قزح بالأنودة؛ بيدخل في الصلب عالي القوة وفي مغناطيسات الرنين المغناطيسي.||shape=plate,metal=0.8,rain=0.5,j=0.1,nj=0.08',
 '42|rods|#9aa5b1|موليبدينوم (قضبان)|فلز رمادي لامع يتحمّل حرارة عالية؛ بيدخل في المحركات والأدوات.',
 '43|ghost|#06b6d4|تكنيشيوم|أول عنصر اتصنّع بالإنسان، ومشع وعمره قصير؛ ما فيش عينة نشوفها، فالمجسّم تخيّلي.',
 '44|button|#b5bcc4|روثينيوم|فلز فضي أبيض صلب؛ بيدخل في الإلكترونيات والمجوهرات.||metal=0.9',
 '45|disc|#dde2e8|روديوم (طبقة مجوهرات)|فلز لامع ونادر بيتطلى بيه الذهب الأبيض.',
 '46|ingot|#d3d8dd|بلاديوم (سبيكة)|فلز فضي أبيض بيتستخدم في المحولات الحفازة والإلكترونيات.||n=1,metal=0.95',
 '47|raw|#dbdfe4|فضة (قطعة طبيعية)|قطعة فضة خام بسطح خشن بتسوّد بالتأكسد.|خام|shape=one,amp=0.28,metal=0.92,sp=0.7,sh=50,c2=#5d6168,mix=0.2',
 '47|disc|#e2e5ea|عملة فضة|قطع فضة مسكوكة زي العملات والمجوهرات.|عملة',
 '47|ingot|#e8ebef|فضة (سبيكة)|فلز أبيض لامع أفضل موصل للكهرباء.|سبيكة|n=1,metal=0.95',
 '48|raw|#b7bec8|كادميوم|فلز فضي مزرق طري سام؛ بيدخل في بطاريات النيكل-كادميوم.||shape=rock,amp=0.22,metal=0.85,sp=0.6',
 '49|pellets|#c3cbd5|إنديوم|فلز فضي طري جدًا؛ بيدخل في شاشات اللمس والشاشات المسطحة.||n=24,size=0.3,metal=0.97,sp=0.9,sh=70,rough=0.05',
 '50|can|#d7dce2|قصدير (علب الصفيح)|علب الصفيح معدن مطلي بالقصدير؛ بيدخل كمان في اللحام وسبيكة البرونز.',
 '51|raw|#7e848c|أنتيمون|فلز رمادي فضي لامع هش؛ بيدخل في مثبطات الحريق وبطاريات الرصاص.||shape=rock,metal=0.8,sp=0.8,sh=60,nj=0.3,amp=0.34',
 '52|raw|#8e939a|تيلوريوم|فلز فضي رمادي هش؛ بيدخل في الخلايا الشمسية وبعض السبائك.||shape=long,metal=0.8,sp=0.7,nj=0.28,amp=0.3',
 '53|crystal|#3b2160|يود (بلورات بنفسجية)|بلورات بنفسجية داكنة لامعة بتتحول لبخار بنفسجي؛ بيتحط منها المطهّر.||metal=1',
 '54|tube|#818cf8|زينون (كشافات)|غاز نبيل بيطلع ضوء أبيض مزرق؛ ده بتاع كشافات السيارات القوية.||shape=helix',
 '55|ampoule|#e8cf86|سيزيوم (أمبولة)|فلز ذهبي باهت طري جدًا وبينصهر في جو حار (28°م تقريبًا)؛ بيتحفظ في أمبولة مقفولة.||piece=drop',
 '56|raw|#cfd3d8|باريوم|فلز فضي طري بيتأكسد بسرعة ويتغطى بقشرة بيضا رمادي.||shape=pebbles,c2=#e6e4dc,mix=0.5,metal=0.7',
 '57|ampoule|#c7ccd2|لانثانوم (أمبولة)|' + LANTH + '||piece=chunk',
 '58|raw|#8d9197|سيريوم (حجر الولاعة)|بيتأكسد بسرعة ويطلّع شرر لما تحتك بيه؛ موجود في حجر الولاعة.||shape=long,c2=#5a5d62,mix=0.5,metal=0.7,rough=0.4',
 '59|ampoule|#c5c8a3|براسيوديميوم (أمبولة)|' + LANTH + '||piece=chunk',
 '60|disc|#7a828e|نيوديميوم (مغناطيس)|بيتصنّع منه أقوى المغناطيسات في السماعات والهاردات.',
 '61|ghost|#ec4899|بروميثيوم|عنصر مشع نادر جدًا في الطبيعة؛ ما فيش عينة نشوفها، فالمجسّم تخيّلي.',
 '62|raw|#c6c8c8|ساماريوم|' + LANTH + '||shape=pebbles,c2=#b0a572,mix=0.3',
 '63|ampoule|#cbb98a|يوروبيوم (أمبولة)|' + LANTH + ' بيتلوّن بالذهبي بالتأكسد.||piece=chunk,c2=#a88a4a,mix=0.5',
 '64|raw|#cdd2d8|جادولينيوم|' + LANTH + '||shape=one,metal=0.92,sp=0.7,sh=55,amp=0.22',
 '65|raw|#c1c6cc|تيربيوم|' + LANTH + '||shape=plate,metal=0.9',
 '66|dend|#c5c9ce|ديسبروسيوم (بلورات متفرّعة)|بيتنقّى بالتقطير فبيتكوّن بشكل متفرّع لامع؛ بيدخل في مغناطيسات المحركات.',
 '67|raw|#cbc4bd|هولميوم|' + LANTH + '||shape=pebbles,metal=0.9',
 '68|raw|#cabfc2|إربيوم|' + LANTH + '||shape=long,metal=0.88',
 '69|ingot|#c3c9c8|ثوليوم|' + LANTH + '||n=1,metal=0.92',
 '70|ampoule|#cdd1d5|إتربيوم (أمبولة)|' + LANTH + '||piece=chunk',
 '71|button|#c1c5cb|لوتيتيوم|' + LANTH + '||metal=0.92',
 '72|crbar|#8f97a4|هافنيوم (قضيب بلوري)|بيتنقّى كقضيب بلوري بألوان باهتة؛ بيدخل في قضبان التحكم بالمفاعلات وفي رقائق الكمبيوتر.||rain=0.4',
 '73|cubes|#8d96a6|تانتالوم|فلز مقاوم للتآكل بيدخل في مكثفات الموبايلات.',
 '74|cubes|#767d87|تنجستن (مكعبات)|أثقل بكتير من حجمه؛ أعلى فلز في درجة الانصهار.|مكعبات',
 '74|coil|#838d9a|تنجستن (فتيلة اللمبة)|أعلى فلز في درجة الانصهار؛ اتعمل منه فتيلة اللمبات القديمة.|فتيلة',
 '75|shards|#9097a0|رينيوم|فلز فضي ثقيل جدًا؛ بيدخل في محركات الطائرات النفاثة.||n=8,metal=0.9,sh=70',
 '76|raw|#6a8299|أوزميوم|أكثف عنصر طبيعي، رمادي مزرق لامع.||shape=pebbles,metal=0.95,sh=70,nj=0.2',
 '77|button|#b4bbc3|إيريديوم|شديد مقاومة التآكل؛ بيتستخدم في شمعات الإشعال والأجهزة الدقيقة.||metal=0.92',
 '78|ingot|#e3e7ea|بلاتين (سبيكة)|فلز أبيض نفيس بيتصنع منه المجوهرات وعوادم السيارات.|سبيكة|n=1,metal=0.95',
 '78|raw|#d7dbe0|بلاتين (قطعة طبيعية)|قطع البلاتين زي ما بتتلاقي في الطبيعة.|خام|shape=one,amp=0.2,metal=0.9',
 '79|ingot|#f1c232|ذهب (سبائك)|فلز أصفر لامع مبيصدّيش؛ بنشوفه سبائك ومجوهرات.|سبيكة',
 '79|raw|#f1c232|ذهب خام (قطعة طبيعية)|قطع الذهب زي ما بتتلاقي في الطبيعة.|خام|shape=one,amp=0.32,metal=0.95,sp=0.9,sh=70,nj=0.22',
 '79|disc|#f1c232|عملة ذهب|عملات الذهب المسكوكة.|عملة',
 '80|drop|#d3dae2|زئبق (سائل فضي)|الفلز الوحيد اللي سائل في الجو العادي؛ بيتجمّع في كرات لامعة وسام جدًا.',
 '81|raw|#8e949c|ثاليوم|فلز رمادي طري سام؛ بيتغطى بسرعة بطبقة رمادية داكنة.||shape=one,metal=0.5,rough=0.5,c2=#5a5f66,mix=0.6',
 '82|ingot|#707782|رصاص (سبائك)|فلز رمادي ثقيل وطري؛ بيحمي من الإشعاع وبيدخل في البطاريات.|سبائك|n=2,cast=1,metal=0.55,rough=0.35,nj=0.1',
 '82|pellets|#767d87|رصاص (كرات)|كرات الرصاص الصغيرة.|كرات|n=26,size=0.3,metal=0.7,rough=0.25,sp=0.5',
 '83|hopper|#c9a7b8|بزموت (بلورات)|فلز بيتبلور بشكل درجات هندسية بألوان قوس قزح.',
 '84|ghost|#14b8a6|بولونيوم|مشع نادر جدًا؛ ما فيش عينة آمنة نشوفها، فالمجسّم تخيّلي.',
 '85|ghost|#eab308|أستاتين|أندر العناصر في الطبيعة ومشع؛ ما فيش عينة نشوفها، فالمجسّم تخيّلي.',
 '86|gas|#c9b8ff|غاز الرادون|غاز مشع عديم اللون بيتسرّب من بعض الصخور والتربة؛ بنحسّه بأجهزة بس.',
 '87|ghost|#ef4444|فرانسيوم|مشع وعمره دقائق؛ ما فيش عينة نشوفها، فالمجسّم تخيّلي.',
 '88|ghost|#f97316|راديوم|مشع بيتوهّج في الظلام وكان بيتحط في ساعات قديمة؛ مفيش عينة بنشوفها دلوقتي، فالمجسّم تخيّلي.',
 '89|ghost|#06b6d4|أكتينيوم|مشع نادر جدًا؛ ما فيش عينة نشوفها، فالمجسّم تخيّلي.',
 '90|raw|#7b8088|ثوريوم|فلز مشع ضعيف الإشعاع بيتغطى بسرعة بطبقة سودا؛ بيتستخدم كوقود نووي محتمل.||shape=one,metal=0.5,rough=0.45,c2=#2d3034,mix=0.5',
 '91|ghost|#06b6d4|بروتكتينيوم|مشع نادر جدًا؛ ما فيش عينة نشوفها، فالمجسّم تخيّلي.',
 '92|slug|#2d2d31|يورانيوم (سبيكة)|فلز ثقيل جدًا بيسوَدّ سطحه بالتأكسد؛ وقود المفاعلات النووية.|سبيكة',
 '92|raw|#1b1b1d|يورانيوم (خام اليورانينايت)|الخام الأسود الثقيل اللي بيتستخرج منه اليورانيوم.|خام|shape=rock,metal=0.15,sp=0.5,sh=25,amp=0.36,f=1.5',
 '94|button|#999ea6|بلوتونيوم|فلز فضي معتم بيتأكسد بسرعة، بيتخزن في حاويات مخصوصة؛ وقود نووي ومصدر طاقة للمركبات الفضائية.||metal=0.8,c2=#6a684a,mix=0.4',
 '95|ghost|#06b6d4|أمريسيوم|موجود بكمية ميكروسكوبية جوه جهاز إنذار الدخان؛ مبنشوفوش، فالمجسّم تخيّلي.'
];
var GH = 'عنصر مُصنَّع مشع بيتكوّن في المعامل بذرات قليلة جدًا وبيفضل لحظات؛ ما فيش عينة نشوفها، فالمجسّم تخيّلي.';
var NAMES = { 93: 'نبتونيوم', 96: 'كوريوم', 97: 'بركيليوم', 98: 'كاليفورنيوم', 99: 'أينشتاينيوم', 100: 'فرميوم', 101: 'مندليفيوم', 102: 'نوبليوم', 103: 'لورنسيوم', 104: 'رذرفورديوم', 105: 'دوبنيوم', 106: 'سيبورجيوم', 107: 'بوريوم', 108: 'هاسيوم', 109: 'مايتنريوم', 110: 'دارمشتاتيوم', 111: 'رونتجينيوم', 112: 'كوبرنيسيوم', 113: 'نيهونيوم', 114: 'فليروفيوم', 115: 'موسكوفيوم', 116: 'ليفرموريوم', 117: 'تينيسين', 118: 'أوغانيسون' };

var DATA = {};
RAW.forEach(function (ln) {
    var p = ln.split('|'), z = +p[0], t = p[1];
    (DATA[z] = DATA[z] || []).push({ t: t, c: hex(p[2]), l: p[3], d: p[4] || DD[t] || '', s: p[5] || p[3], o: parseOpts(p[6]) });
});
Object.keys(NAMES).forEach(function (z) {
    if (!DATA[z]) DATA[z] = [{ t: 'ghost', c: hex('#06b6d4'), l: NAMES[z], d: GH, s: NAMES[z], o: {} }];
});

var NOTES = {
    gas: 'النقط بتمثّل جزيئات الغاز للتوضيح؛ الغاز نفسه مبيتشافش بسهولة.',
    tube: 'الضوء بيطلع لما الكهرباء تعدّي في الغاز جوه الأنبوبة.',
    ghost: 'تنبيه: ده تصوّر تخيّلي مش صورة حقيقية.',
    bottle: 'الغاز نفسه مبيتشافش؛ بنشوف الأسطوانة اللي بيتخزّن فيها، وألوانها بتختلف من بلد لبلد.',
    flask: 'الدخان الملوّن بيمثّل لون الغاز للتوضيح.',
    jar: 'الفلز ده نشط جدًا فبيتحفظ تحت الزيت بعيد عن الهواء والرطوبة.',
    ampoule: 'الفلزات النشطة والنادرة بتتقفل في أمبولة زجاج بغاز خامل عشان ما تتأكسدش.',
    hopper: 'ألوان قوس القزح من طبقة أكسيد رقيقة جدًا على سطح البلورة.',
    slug: 'مادة مشعة ضعيفة الإشعاع، وبتتخزّن بعيد عن الناس.'
};

/* ---------- المحرّك ---------- */
var sprC = {};
function spriteImg(c) {
    var k = (c[0] | 0) + ',' + (c[1] | 0) + ',' + (c[2] | 0);
    if (sprC[k]) return sprC[k];
    var cv = document.createElement('canvas'); cv.width = cv.height = 64;
    var x = cv.getContext('2d'), g = x.createRadialGradient(32, 32, 0, 32, 32, 32);
    g.addColorStop(0, 'rgba(' + k + ',1)'); g.addColorStop(0.4, 'rgba(' + k + ',0.55)'); g.addColorStop(1, 'rgba(' + k + ',0)');
    x.fillStyle = g; x.fillRect(0, 0, 64, 64);
    return (sprC[k] = cv);
}
function env(rx, ry) {
    var e = ry >= 0 ? 0.55 + 0.5 * Math.pow(ry, 0.6) : 0.55 + 0.43 * ry;
    e += 0.55 * Math.exp(-Math.pow((ry - 0.12) / 0.1, 2));
    if (ry > -0.2) e += 0.4 * Math.exp(-Math.pow((rx - 0.55) / 0.16, 2));
    return e;
}

function Real3D(canvas) {
    var ctx = canvas.getContext('2d'), self = this, sc = null, acc = [6, 182, 212];
    var yaw = 0.6, pitch = 0.38, vy = 0, vp = 0, zoom = 1, auto = true, raf = 0, t0 = 0, W = 0, H = 0, dpr = 1;
    var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduce) auto = false;
    var L = nrm([-0.45, 0.75, 0.5]), Hh = nrm([L[0], L[1], L[2] + 1]);

    function resize() {
        var r = canvas.getBoundingClientRect(); if (!r.width) return;
        dpr = Math.min(2, window.devicePixelRatio || 1);
        W = r.width; H = r.height; canvas.width = Math.round(W * dpr); canvas.height = Math.round(H * dpr);
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }
    window.addEventListener('resize', function () { if (raf) resize(); });

    function faceColor(m, nx, ny, nz, h, g, smo) {
        var d = nx * L[0] + ny * L[1] + nz * L[2]; if (d < 0) d = 0;
        var hh2 = nx * Hh[0] + ny * Hh[1] + nz * Hh[2]; if (hh2 < 0) hh2 = 0;
        var sp = Math.pow(hh2, m.sh || 30) * (m.sp == null ? 0.3 : m.sp) * 255, c = m.col, k, hv = h == null ? 0.5 : h;
        if (m.c2 && (smo ? hv : (hv * 97.13) % 1) < m.mix) c = m.c2;
        if (m.rain) { var rc = hsv(hv * 3.2 + 3.1, 0.38, 0.95); c = [c[0] * (1 - m.rain) + rc[0] * m.rain, c[1] * (1 - m.rain) + rc[1] * m.rain, c[2] * (1 - m.rain) + rc[2] * m.rain]; }
        var jv = m.j ? 1 + m.j * (smo ? 0.3 : 1) * (((smo ? g : (hv * 53.7) % 1)) - 0.5) * 2 : 1;
        if (m.emis) { k = 0.78 + 0.35 * Math.max(0, nz); return rgb(c[0] * k, c[1] * k, c[2] * k); }
        if (m.metal) {
            var e = env(2 * nz * nx, 2 * nz * ny);
            if (m.rough) e = e * (1 - m.rough) + 0.6 * m.rough;
            k = (0.3 + 0.7 * d) * (1 - m.metal) + e * m.metal;
        } else k = 0.3 + 0.7 * d;
        k *= jv;
        return rgb(c[0] * k + sp, c[1] * k + sp, c[2] * k + sp);
    }

    function render() {
        ctx.clearRect(0, 0, W, H);
        if (!sc) return;
        var V = sc.V, F = sc.F, S = sc.S, off = sc.off, n = V.length, i, k;
        var cY = Math.cos(yaw), sY = Math.sin(yaw), cP = Math.cos(pitch), sP = Math.sin(pitch);
        var D = sc.R * 3.4, unit = Math.min(W, H) / 2 / sc.R * 0.78 * zoom, cx = W / 2, cy = H / 2;
        if (sc._n !== n) { sc._vx = new Float32Array(n); sc._vy = new Float32Array(n); sc._vz = new Float32Array(n); sc._px = new Float32Array(n); sc._py = new Float32Array(n); sc._n = n; }
        var VX = sc._vx, VY = sc._vy, VZ = sc._vz, PX = sc._px, PY = sc._py;
        for (i = 0; i < n; i++) {
            var p = V[i], x = p[0] - off[0], y = p[1] - off[1], z = p[2] - off[2];
            var x1 = x * cY + z * sY, z1 = -x * sY + z * cY, y2 = y * cP - z1 * sP, z2 = y * sP + z1 * cP, f = D / (D - z2);
            VX[i] = x1; VY[i] = y2; VZ[i] = z2; PX[i] = cx + x1 * unit * f; PY[i] = cy - y2 * unit * f;
        }
        /* ظل الأرضية */
        var fz = sc.fy * sP, ff = D / (D - fz), gx = cx, gy = cy - sc.fy * cP * unit * ff, rx = sc.rs * unit * ff * 1.15;
        ctx.save(); ctx.translate(gx, gy); ctx.scale(1, Math.max(0.1, Math.abs(sP)));
        var gr = ctx.createRadialGradient(0, 0, 0, 0, 0, rx);
        gr.addColorStop(0, 'rgba(0,0,0,0.55)'); gr.addColorStop(0.6, 'rgba(0,0,0,0.25)'); gr.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = gr; ctx.fillRect(-rx, -rx, rx * 2, rx * 2); ctx.restore();

        var items = [];
        for (k = 0; k < F.length; k++) {
            var fc = F[k], m = fc.m, ids = fc.i, nw = fc.n;
            var nx = nw[0] * cY + nw[2] * sY, nz1 = -nw[0] * sY + nw[2] * cY, ny = nw[1] * cP - nz1 * sP, nz = nw[1] * sP + nz1 * cP;
            var i0 = ids[0];
            if (!m.glass && !m.gem && nx * (-VX[i0]) + ny * (-VY[i0]) + nz * (D - VZ[i0]) <= 0) continue;
            var zs = 0; for (i = 0; i < ids.length; i++) zs += VZ[ids[i]];
            var col, al = 1;
            if (m.glass) {
                var hh = Math.max(0, nx * Hh[0] + ny * Hh[1] + nz * Hh[2]);
                al = Math.min(0.75, m.alpha * (0.12 + 0.55 * (1 - Math.abs(nz))) + Math.pow(hh, 40) * 0.5);
                col = m.gcol || 'rgb(205,230,255)';
            } else if (m.gem) {
                var dd = Math.abs(nx * L[0] + ny * L[1] + nz * L[2]), hs = Math.pow(Math.abs(nx * Hh[0] + ny * Hh[1] + nz * Hh[2]), 28), c0 = m.col, kk = 0.45 + 0.55 * dd;
                col = rgb(c0[0] * kk + 255 * hs * 0.9, c0[1] * kk + 255 * hs * 0.9, c0[2] * kk + 255 * hs * 0.9); al = m.alpha;
            } else {
                var nsv = fc.s || nw, sx = nsv[0] * cY + nsv[2] * sY, sz1 = -nsv[0] * sY + nsv[2] * cY, sy = nsv[1] * cP - sz1 * sP, sz2 = nsv[1] * sP + sz1 * cP;
                col = faceColor(m, sx, sy, sz2, fc.h, fc.g, fc.sm);
            }
            items.push({ z: zs / ids.length, f: fc, c: col, a: al });
        }
        for (k = 0; k < S.length; k++) {
            var sp = S[k], sx = sp.p[0] - off[0], sy = sp.p[1] - off[1], sz = sp.p[2] - off[2];
            var a1 = sx * cY + sz * sY, b1 = -sx * sY + sz * cY, a2 = sy * cP - b1 * sP, b2 = sy * sP + b1 * cP, fs = D / (D - b2);
            items.push({ z: b2, s: sp, x: cx + a1 * unit * fs, y: cy - a2 * unit * fs, rr: sp.r * unit * fs });
        }
        items.sort(function (a, b) { return a.z - b.z; });

        var addMode = false;
        for (k = 0; k < items.length; k++) {
            var it = items[k];
            if (it.s) {
                var wantAdd = it.s.add;
                if (wantAdd !== addMode) { ctx.globalCompositeOperation = wantAdd ? 'lighter' : 'source-over'; addMode = wantAdd; }
                ctx.globalAlpha = it.s.a; ctx.drawImage(spriteImg(it.s.c), it.x - it.rr, it.y - it.rr, it.rr * 2, it.rr * 2); ctx.globalAlpha = 1;
                continue;
            }
            if (addMode) { ctx.globalCompositeOperation = 'source-over'; addMode = false; }
            var ids2 = it.f.i, mm = it.f.m;
            ctx.beginPath(); ctx.moveTo(PX[ids2[0]], PY[ids2[0]]);
            for (i = 1; i < ids2.length; i++) ctx.lineTo(PX[ids2[i]], PY[ids2[i]]);
            ctx.closePath();
            if (mm.glass) { ctx.globalAlpha = it.a; ctx.fillStyle = it.c; ctx.fill(); ctx.globalAlpha = 1; }
            else if (mm.gem) { ctx.globalAlpha = it.a; ctx.fillStyle = it.c; ctx.fill(); ctx.globalAlpha = 0.5; ctx.strokeStyle = 'rgba(255,255,255,0.7)'; ctx.lineWidth = 0.8; ctx.stroke(); ctx.globalAlpha = 1; }
            else { ctx.fillStyle = it.c; ctx.fill(); ctx.strokeStyle = it.c; ctx.lineWidth = 0.8; ctx.stroke(); }
        }
        if (addMode) ctx.globalCompositeOperation = 'source-over';
    }

    function frame(ts) {
        raf = requestAnimationFrame(frame);
        var dt = Math.min(0.05, (ts - (t0 || ts)) / 1000); t0 = ts;
        if (!W) resize();
        if (auto && !dragging) yaw += dt * 0.45;
        yaw += vy; pitch += vp; vy *= 0.94; vp *= 0.94;
        pitch = Math.max(-0.05, Math.min(1.35, pitch));
        if (sc && sc.tick) sc.tick(dt, ts / 1000);
        render();
    }

    /* ===== تحكم باللمس والماوس ===== */
    var dragging = false, last = null, pts = {}, pinch0 = 0, zoom0 = 1;
    function cnt() { return Object.keys(pts).length; }
    canvas.addEventListener('pointerdown', function (e) {
        canvas.setPointerCapture(e.pointerId); pts[e.pointerId] = { x: e.clientX, y: e.clientY };
        if (cnt() === 1) { dragging = true; last = { x: e.clientX, y: e.clientY }; vy = vp = 0; }
        if (cnt() === 2) { var k = Object.keys(pts), a = pts[k[0]], b = pts[k[1]]; pinch0 = Math.hypot(a.x - b.x, a.y - b.y); zoom0 = zoom; dragging = false; }
    });
    canvas.addEventListener('pointermove', function (e) {
        if (!pts[e.pointerId]) return; pts[e.pointerId] = { x: e.clientX, y: e.clientY };
        if (cnt() === 2) { var k = Object.keys(pts), a = pts[k[0]], b = pts[k[1]]; zoom = Math.max(0.6, Math.min(2.6, zoom0 * Math.hypot(a.x - b.x, a.y - b.y) / (pinch0 || 1))); return; }
        if (dragging && last) {
            var dx = e.clientX - last.x, dy = e.clientY - last.y; last = { x: e.clientX, y: e.clientY };
            yaw += dx * 0.011; pitch += dy * 0.011; vy = dx * 0.0016; vp = dy * 0.0016;
        }
    });
    function up(e) { delete pts[e.pointerId]; if (cnt() < 2) { dragging = cnt() === 1; if (dragging) { var k = Object.keys(pts)[0]; last = pts[k]; } } }
    canvas.addEventListener('pointerup', up); canvas.addEventListener('pointercancel', up);
    canvas.addEventListener('wheel', function (e) { e.preventDefault(); zoom = Math.max(0.6, Math.min(2.6, zoom * (e.deltaY < 0 ? 1.1 : 0.9))); }, { passive: false });

    this.set = function (z, f, accent) {
        acc = accent || acc;
        var fn = SCN[f.t] || SCN.ghost;
        sc = fn(f.c, z, acc, f.o || {}); sc.fin();
        if (!raf) render();
    };
    this.start = function () { if (!raf) { t0 = 0; resize(); raf = requestAnimationFrame(frame); } };
    this.stop = function () { if (raf > 0) cancelAnimationFrame(raf); raf = 0; };
    this.setAuto = function (v) { auto = v; };
    this.reset = function () { yaw = 0.6; pitch = 0.38; vy = vp = 0; zoom = 1; };
    document.addEventListener('visibilitychange', function () { if (document.hidden) { if (raf > 0) { cancelAnimationFrame(raf); raf = -1; } } else if (raf === -1) { raf = 0; self.start(); } });
}

Real3D.forms = function (z) { return DATA[z] || [{ t: 'ghost', c: hex('#06b6d4'), l: 'عنصر', d: GH, s: 'عنصر', o: {} }]; };
Real3D.note = function (t) { return NOTES[t] || ''; };
G.Real3D = Real3D;
})(window);
