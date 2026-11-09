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

/* ---------- المجسّمات (Meshes) ---------- */
function mk(v, f, c) { return { v: v, f: f, c: c || [0, 0, 0] }; }

function ico(sd, fn, sph) {
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
    var sc = o.sc || [1, 1, 1], ps = o.pos || [0, 0, 0], rt = o.rot || [0, 0, 0], mat = o.mat, base = this.V.length, V = this.V, F = this.F;
    function tp(p) { var q = rot([p[0] * sc[0], p[1] * sc[1], p[2] * sc[2]], rt[0], rt[1], rt[2]); return [q[0] + ps[0], q[1] + ps[1], q[2] + ps[2]]; }
    function tn(n) { return nrm(rot([n[0] / sc[0], n[1] / sc[1], n[2] / sc[2]], rt[0], rt[1], rt[2])); }
    var W = m.v.map(tp), cc = tp(m.c);
    m.f.forEach(function (f) {
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
        F.push({ i: ids, n: n, m: mat });
    });
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
    s.add(ico(1, lump(4, 0.25, 1.1, 0.3, 0.9)), { pos: [0, -0.62, 0], mat: mPlastic([52, 56, 66], 0.05, 8) });
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

/* ---------- البيانات: العنصر|النوع|اللون|الاسم|الوصف|اسم قصير|خيارات ---------- */
var DD = {
    ingot: 'فلز لامع، الشكل ده هو الشكل التجاري المعتاد لعيناته النقية (سبائك مصقولة).',
    chunk: 'فلز صلب لامع، بنشوفه قطع خام ونقية في معامل الكيمياء أكتر من الحياة اليومية.',
    rods: 'فلز صلب بيتصنّع على شكل قضبان وأسلاك.',
    disc: 'فلز لامع بيتصنّع على شكل عملات وأقراص.',
    nugget: 'قطعة فلز زي ما بتتستخرج من الطبيعة.',
    crystal: 'بلورات بتتكوّن بشكل طبيعي وبتتجمّع في عناقيد.',
    powder: 'مسحوق ناعم من حبيبات صغيرة.'
};
var LANTH = 'من «العناصر الأرضية النادرة»؛ فلز فضي بيتأكسد بسرعة فبيتخزن في عبوات محكمة.';
var RAW = [
 '1|gas|#bfe3ff|غاز الهيدروجين|عديم اللون والرائحة وأخف غاز في الكون؛ بنشوفه محبوس في أسطوانات خاصة.',
 '2|balloon|#ef4444|بالون هيليوم|غاز خفيف عديم اللون؛ عشان كده بتطير بالونات الأفراح المملوءة بيه.',
 '3|ingot|#cfd6dd|ليثيوم (فلز فضي طري)|أخف الفلزات وطري لدرجة إنه بيتقطع بالسكينة، وبيتحفظ تحت الزيت. هو اللي بيشغّل بطارية موبايلك.',
 '4|chunk|#a5adb4|بيريليوم|فلز رمادي فضي خفيف وصلب، بيدخل في سبائك الطائرات والأقمار الصناعية.',
 '5|chunk|#34343f|بورون نقي (بلورات سودا لامعة)|صلب جدًا وسواده لامع؛ بنشوفه غالبًا جوه مركبات زي البوراكس.',
 '6|gem|#c8f0ff|ألماس|كربون مرتب في بلورات صلبة شفافة بتلمع؛ أصلب مادة طبيعية.|ألماس',
 '6|rods|#3a3d46|جرافيت (سن القلم الرصاص)|نفس الكربون بس مرتب في طبقات بتنزلق على بعضها، عشان كده بيكتب على الورق.|جرافيت|hex',
 '6|rock|#1d1e22|فحم|كربون غير نقي بنشوفه في الشواء والتدفئة.|فحم',
 '7|gas|#c7dcff|غاز النيتروجين|بيمثل 78% من الهواء اللي حوالينا؛ عديم اللون والرائحة.',
 '8|gas|#9fd0ff|غاز الأكسجين|21% من الهواء وضروري للتنفس؛ عديم اللون، وبنشوفه في أسطوانات المستشفيات.',
 '9|gas|#e9f08a|غاز الفلور|غاز أصفر باهت سام وشديد النشاط، مبنشوفوش خارج المعامل.',
 '10|tube|#ff5a36|نيون (لافتات مضيئة)|غاز نبيل عديم اللون، وبيطلع ضوء برتقالي أحمر لما الكهرباء تعدّي فيه؛ ده سر لافتات النيون.',
 '11|ingot|#d8dde2|صوديوم (فلز طري)|فلز فضي طري بيتحفظ تحت الزيت لأنه بيتفاعل بعنف مع الماء والهواء.',
 '12|rods|#cdd2d8|ماغنسيوم (قضبان وأشرطة)|فلز فضي خفيف؛ شريطه لما يتولّع بيطلع ضوء أبيض ساطع.',
 '13|can|#d7dce2|ألومنيوم (علب ومواعين)|فلز فضي خفيف بنشوفه كل يوم في علب المشروبات والمواعين.',
 '14|chunk|#6b7686|سيليكون نقي|رمادي مايل للأزرق ولامع؛ أساس الرقائق الإلكترونية.|قطعة',
 '14|wafer|#5a6a8c|رقاقة سيليكون|بيتقطع منها المعالجات اللي في الموبايل والكمبيوتر.|رقاقة',
 '15|powder|#b91c1c|فوسفور أحمر|مسحوق أحمر داكن؛ موجود على جانب علبة الكبريت.',
 '16|crystal|#f4d21f|كبريت أصفر (بلورات)|بلورات صفرا بتتكوّن حوالين البراكين والينابيع الحارة.|بلورات',
 '16|powder|#f2cf2a|مسحوق الكبريت|بودرة صفرا بنشوفها في الزراعة وبعض الأدوية.|بودرة',
 '16|rock|#e6c52a|حجر كبريت|قطع صفرا خشنة لها ريحة مميزة.|قطع',
 '17|gas|#b5d63a|غاز الكلور|غاز أخضر مصفر خانق وسام؛ بنشوف أثره في مطهرات حمامات السباحة.',
 '18|tube|#a78bfa|أرجون (مصابيح)|غاز نبيل بيطلع ضوء بنفسجي لما الكهرباء تعدّي فيه، وبيتحط جوه اللمبات.',
 '19|ingot|#d4d8dd|بوتاسيوم (فلز طري)|فلز فضي طري جدًا بيتفاعل بشدة مع الماء، وهو مهم للنبات وفي الموز.',
 '20|chunk|#dfe3e8|كالسيوم (فلز)|فلز أبيض فضي؛ في حياتنا بنشوفه جوه مركبات زي الطباشير والعظام.',
 '21|ingot|#c5c9ce|سكانديوم',
 '22|rods|#a8aeb6|تيتانيوم (قضبان)|فلز قوي وخفيف؛ بيدخل في مفاصل الأطراف الصناعية وهياكل الطيارات.',
 '23|chunk|#aab4c0|فاناديوم',
 '24|ingot|#e6ebf0|كروم (سبائك لامعة)|بيدّي حنفيات وإكسسوارات السيارات لمعة المرايا.',
 '25|chunk|#8d9097|منجنيز',
 '26|nails|#7b8088|حديد (مسامير)|الحديد في حياتنا بيتحول غالبًا لصلب، زي المسامير والأسياخ.|مسامير',
 '26|ingot|#6e747d|سبيكة حديد|الشكل التجاري للحديد قبل ما يتشكّل.|سبيكة',
 '27|chunk|#8aa0bd|كوبالت|فلز أزرق رمادي لامع بيدخل في البطاريات والأصباغ الزرقا.',
 '28|disc|#d3d7dc|نيكل (عملات)|فلز فضي بيدخل في العملات المعدنية والصلب المقاوم للصدأ.',
 '29|coil|#c8702a|نحاس (سلك)|أحمر برتقالي لامع وموصل ممتاز للكهرباء؛ أسلاك البيوت.|سلك',
 '29|nugget|#c9783a|نحاس خام|قطعة نحاس طبيعية زي ما بتتستخرج.|خام',
 '30|ingot|#b6c0ca|زنك|فلز فضي مزرق؛ بيتغطى بيه الحديد (جلفنة) عشان ما يصدّيش.',
 '31|chunk|#cfd8e3|جاليوم|فلز فضي بينصهر في إيدك لأن انصهاره حوالي 30°م.',
 '32|chunk|#8f98a4|جرمانيوم',
 '33|chunk|#747b86|زرنيخ|رمادي معدني لامع وسام جدًا.',
 '34|powder|#b6422d|سيلينيوم (مسحوق أحمر)',
 '35|vial|#7a1c10|بروم (سائل بني محمر)|اللافلز الوحيد اللي سائل في الجو العادي، بني محمر وريحته خانقة.',
 '36|tube|#e5e7eb|كريبتون|غاز نبيل بيطلع ضوء أبيض مخضر لما الكهرباء تعدّي فيه.',
 '37|ingot|#cfd3d8|روبيديوم',
 '38|chunk|#d8dade|سترونشيوم',
 '39|ingot|#bcc0c6|إتريوم',
 '40|rods|#a0a7af|زركونيوم|بيدخل في أغلفة وقود المفاعلات والأجهزة الطبية.',
 '41|ingot|#929ba7|نيوبيوم',
 '42|ingot|#9ca7b3|موليبدينوم',
 '43|ghost|#06b6d4|تكنيشيوم|أول عنصر اتصنّع بالإنسان، ومشع وعمره قصير؛ ما فيش عينة نشوفها، فالمجسّم تخيّلي.',
 '44|chunk|#a9b2ba|روثينيوم',
 '45|disc|#dde2e8|روديوم (طبقة مجوهرات)|فلز لامع ونادر بيتطلى بيه الذهب الأبيض.',
 '46|ingot|#d1d6dc|بلاديوم',
 '47|ingot|#e8ebef|فضة (سبائك)|فلز أبيض لامع أفضل موصل للكهرباء.|سبيكة',
 '47|disc|#e2e5ea|عملة فضة|قطع فضة مسكوكة زي العملات والمجوهرات.|عملة',
 '48|ingot|#b9c0c9|كادميوم',
 '49|ingot|#bcc4cf|إنديوم',
 '50|ingot|#c3c9d0|قصدير|فلز فضي طري بنشوفه في اللحام وعلب الصفيح.',
 '51|chunk|#9fa8b3|أنتيمون',
 '52|chunk|#8c919b|تيلوريوم',
 '53|crystal|#3b2160|يود (بلورات بنفسجية)|بلورات بنفسجية داكنة لامعة بتتحول لبخار بنفسجي؛ بيتحط منها المطهّر.||metal',
 '54|tube|#818cf8|زينون (كشافات)|غاز نبيل بيطلع ضوء أبيض مزرق؛ ده بتاع كشافات السيارات القوية.',
 '55|nugget|#e8d6a4|سيزيوم|فلز ذهبي باهت وطري جدًا، وبينصهر في جو حار (28°م تقريبًا).',
 '56|chunk|#cfd3d8|باريوم',
 '57|ingot|#c1c7cd|لانثانوم|' + LANTH,
 '58|chunk|#b3b9c0|سيريوم (حجر الولاعة)|بيطلّع شرر لما تحتك بيه؛ موجود في حجر الولاعة.',
 '59|chunk|#b9c9a8|براسيوديميوم|' + LANTH,
 '60|disc|#7a828e|نيوديميوم (مغناطيس)|بيتصنّع منه أقوى المغناطيسات في السماعات والهاردات.',
 '61|ghost|#ec4899|بروميثيوم|عنصر مشع نادر جدًا في الطبيعة؛ ما فيش عينة نشوفها، فالمجسّم تخيّلي.',
 '62|chunk|#c0c5cb|ساماريوم|' + LANTH,
 '63|chunk|#c5c9ce|يوروبيوم|' + LANTH,
 '64|chunk|#c3c8ce|جادولينيوم|' + LANTH,
 '65|chunk|#c0c5cb|تيربيوم|' + LANTH,
 '66|chunk|#c2c6cc|ديسبروسيوم|' + LANTH,
 '67|chunk|#c6c5c0|هولميوم|' + LANTH,
 '68|chunk|#c9c5c5|إربيوم|' + LANTH,
 '69|chunk|#c5c9c9|ثوليوم|' + LANTH,
 '70|chunk|#cccfd3|إتربيوم|' + LANTH,
 '71|chunk|#c1c5cb|لوتيتيوم|' + LANTH,
 '72|ingot|#a9afb7|هافنيوم',
 '73|ingot|#8c95a4|تانتالوم|فلز مقاوم للتآكل بيدخل في مكثفات الموبايلات.',
 '74|coil|#838d9a|تنجستن (فتيلة اللمبة)|أعلى فلز في درجة الانصهار؛ اتعمل منه فتيلة اللمبات القديمة.',
 '75|chunk|#9ba1a9|رينيوم',
 '76|chunk|#6b8197|أوزميوم|أكثف عنصر طبيعي، رمادي مزرق.',
 '77|chunk|#adb4bc|إيريديوم',
 '78|ingot|#e2e6ea|بلاتين|فلز أبيض نفيس بيتصنع منه المجوهرات وعوادم السيارات.',
 '79|ingot|#f1c232|ذهب (سبائك)|فلز أصفر لامع مبيصدّيش؛ بنشوفه سبائك ومجوهرات.|سبيكة',
 '79|nugget|#f1c232|ذهب خام (قطعة طبيعية)|قطع الذهب زي ما بتتلاقي في الطبيعة.|خام',
 '79|disc|#f1c232|عملة ذهب|عملات الذهب المسكوكة.|عملة',
 '80|drop|#d3dae2|زئبق (سائل فضي)|الفلز الوحيد اللي سائل في الجو العادي؛ بيتجمّع في كرات لامعة وسام جدًا.',
 '81|chunk|#9ea7b2|ثاليوم',
 '82|ingot|#6f7783|رصاص|فلز رمادي ثقيل وطري؛ بيحمي من الإشعاع وبيدخل في البطاريات.',
 '83|crystal|#c9a7b8|بزموت (بلورات)|فلز بيتبلور بشكل درجات هندسية بألوان قوس قزح.||metal',
 '84|ghost|#14b8a6|بولونيوم|مشع نادر جدًا؛ ما فيش عينة آمنة نشوفها، فالمجسّم تخيّلي.',
 '85|ghost|#eab308|أستاتين|أندر العناصر في الطبيعة ومشع؛ ما فيش عينة نشوفها، فالمجسّم تخيّلي.',
 '86|gas|#c9b8ff|غاز الرادون|غاز مشع عديم اللون بيتسرّب من بعض الصخور والتربة؛ بنحسّه بأجهزة بس.',
 '87|ghost|#ef4444|فرانسيوم|مشع وعمره دقائق؛ ما فيش عينة نشوفها، فالمجسّم تخيّلي.',
 '88|ghost|#f97316|راديوم|مشع بيتوهّج في الظلام وكان بيتحط في ساعات قديمة؛ مفيش عينة بنشوفها دلوقتي، فالمجسّم تخيّلي.',
 '89|ghost|#06b6d4|أكتينيوم|مشع نادر جدًا؛ ما فيش عينة نشوفها، فالمجسّم تخيّلي.',
 '90|chunk|#9aa1a9|ثوريوم|فلز مشع ضعيف الإشعاع بيتستخدم كوقود نووي محتمل.',
 '91|ghost|#06b6d4|بروتكتينيوم|مشع نادر جدًا؛ ما فيش عينة نشوفها، فالمجسّم تخيّلي.',
 '92|ingot|#4f5662|يورانيوم|فلز ثقيل مشع وقود المفاعلات النووية؛ بيتخزن في حاويات محكمة.',
 '95|ghost|#06b6d4|أمريسيوم|موجود بكمية ميكروسكوبية جوه جهاز إنذار الدخان؛ مبنشوفوش، فالمجسّم تخيّلي.',
 '94|chunk|#8f939c|بلوتونيوم|مشع وبيتخزن في حاويات مخصوصة؛ وقود نووي ومصدر طاقة للمركبات الفضائية.'
];
var GH = 'عنصر مُصنَّع مشع بيتكوّن في المعامل بذرات قليلة جدًا وبيفضل لحظات؛ ما فيش عينة نشوفها، فالمجسّم تخيّلي.';
var NAMES = { 93: 'نبتونيوم', 96: 'كوريوم', 97: 'بركيليوم', 98: 'كاليفورنيوم', 99: 'أينشتاينيوم', 100: 'فرميوم', 101: 'مندليفيوم', 102: 'نوبليوم', 103: 'لورنسيوم', 104: 'رذرفورديوم', 105: 'دوبنيوم', 106: 'سيبورجيوم', 107: 'بوريوم', 108: 'هاسيوم', 109: 'مايتنريوم', 110: 'دارمشتاتيوم', 111: 'رونتجينيوم', 112: 'كوبرنيسيوم', 113: 'نيهونيوم', 114: 'فليروفيوم', 115: 'موسكوفيوم', 116: 'ليفرموريوم', 117: 'تينيسين', 118: 'أوغانيسون' };

var DATA = {};
RAW.forEach(function (ln) {
    var p = ln.split('|'), z = +p[0], t = p[1];
    (DATA[z] = DATA[z] || []).push({ t: t, c: hex(p[2]), l: p[3], d: p[4] || DD[t] || '', s: p[5] || p[3], o: { hex: p[6] === 'hex', metal: p[6] === 'metal' || p[7] === 'metal' } });
});
Object.keys(NAMES).forEach(function (z) {
    if (!DATA[z]) DATA[z] = [{ t: 'ghost', c: hex('#06b6d4'), l: NAMES[z], d: GH, s: NAMES[z], o: {} }];
});

var NOTES = { gas: 'النقط بتمثّل جزيئات الغاز للتوضيح؛ الغاز نفسه مبيتشافش بسهولة.', tube: 'الضوء بيطلع لما الكهرباء تعدّي في الغاز جوه الأنبوبة.', ghost: 'تنبيه: ده تصوّر تخيّلي مش صورة حقيقية.' };

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

    function faceColor(m, nx, ny, nz) {
        var d = nx * L[0] + ny * L[1] + nz * L[2]; if (d < 0) d = 0;
        var h = nx * Hh[0] + ny * Hh[1] + nz * Hh[2]; if (h < 0) h = 0;
        var sp = Math.pow(h, m.sh || 30) * (m.sp == null ? 0.3 : m.sp) * 255, c = m.col, k;
        if (m.emis) { k = 0.78 + 0.35 * Math.max(0, nz); return rgb(c[0] * k, c[1] * k, c[2] * k); }
        if (m.metal) {
            var e = env(2 * nz * nx, 2 * nz * ny);
            if (m.rough) e = e * (1 - m.rough) + 0.6 * m.rough;
            k = (0.3 + 0.7 * d) * (1 - m.metal) + e * m.metal;
        } else k = 0.3 + 0.7 * d;
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
                col = 'rgb(205,230,255)';
            } else if (m.gem) {
                var dd = Math.abs(nx * L[0] + ny * L[1] + nz * L[2]), hs = Math.pow(Math.abs(nx * Hh[0] + ny * Hh[1] + nz * Hh[2]), 28), c0 = m.col, kk = 0.45 + 0.55 * dd;
                col = rgb(c0[0] * kk + 255 * hs * 0.9, c0[1] * kk + 255 * hs * 0.9, c0[2] * kk + 255 * hs * 0.9); al = m.alpha;
            } else col = faceColor(m, nx, ny, nz);
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
