(function (root) {
  'use strict';

  // Returns a 6-char lowercase hex (no "#"), or null if the input is invalid.
  function normalizeHex(input) {
    if (typeof input !== 'string') return null;
    let hex = input.trim().replace(/^#/, '').toLowerCase();
    if (!/^[0-9a-f]+$/.test(hex)) return null;
    if (hex.length === 3) hex = hex.split('').map((c) => c + c).join('');
    return hex.length === 6 ? hex : null;
  }

  function hexToRgb(hex) {
    const n = parseInt(hex, 16);
    return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
  }

  // sRGB (D65) -> CIELAB
  function rgbToLab([r, g, b]) {
    const lin = (c) => {
      c /= 255;
      return c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
    };
    const R = lin(r), G = lin(g), B = lin(b);
    const x = (R * 0.4124564 + G * 0.3575761 + B * 0.1804375) / 0.95047;
    const y = (R * 0.2126729 + G * 0.7151522 + B * 0.072175) / 1.0;
    const z = (R * 0.0193339 + G * 0.119192 + B * 0.9503041) / 1.08883;
    const f = (t) => (t > 216 / 24389 ? Math.cbrt(t) : (24389 / 27 * t + 16) / 116);
    const fx = f(x), fy = f(y), fz = f(z);
    return [116 * fy - 16, 500 * (fx - fy), 200 * (fy - fz)];
  }

  // CIEDE2000 color difference
  function deltaE2000([L1, a1, b1], [L2, a2, b2]) {
    const rad = Math.PI / 180;
    const C1 = Math.hypot(a1, b1), C2 = Math.hypot(a2, b2);
    const Cbar7 = Math.pow((C1 + C2) / 2, 7);
    const G = 0.5 * (1 - Math.sqrt(Cbar7 / (Cbar7 + Math.pow(25, 7))));
    const a1p = a1 * (1 + G), a2p = a2 * (1 + G);
    const C1p = Math.hypot(a1p, b1), C2p = Math.hypot(a2p, b2);
    const hue = (b, a) => {
      if (a === 0 && b === 0) return 0;
      const h = Math.atan2(b, a) / rad;
      return h < 0 ? h + 360 : h;
    };
    const h1p = hue(b1, a1p), h2p = hue(b2, a2p);

    const dLp = L2 - L1;
    const dCp = C2p - C1p;
    let dhp = 0;
    if (C1p * C2p !== 0) {
      dhp = h2p - h1p;
      if (dhp > 180) dhp -= 360;
      else if (dhp < -180) dhp += 360;
    }
    const dHp = 2 * Math.sqrt(C1p * C2p) * Math.sin((dhp / 2) * rad);

    const Lbarp = (L1 + L2) / 2;
    const Cbarp = (C1p + C2p) / 2;
    let hbarp = h1p + h2p;
    if (C1p * C2p !== 0) {
      if (Math.abs(h1p - h2p) > 180) hbarp += hbarp < 360 ? 360 : -360;
      hbarp /= 2;
    }

    const T = 1
      - 0.17 * Math.cos((hbarp - 30) * rad)
      + 0.24 * Math.cos(2 * hbarp * rad)
      + 0.32 * Math.cos((3 * hbarp + 6) * rad)
      - 0.2 * Math.cos((4 * hbarp - 63) * rad);
    const dTheta = 30 * Math.exp(-Math.pow((hbarp - 275) / 25, 2));
    const Cbarp7 = Math.pow(Cbarp, 7);
    const Rc = 2 * Math.sqrt(Cbarp7 / (Cbarp7 + Math.pow(25, 7)));
    const Sl = 1 + (0.015 * Math.pow(Lbarp - 50, 2)) / Math.sqrt(20 + Math.pow(Lbarp - 50, 2));
    const Sc = 1 + 0.045 * Cbarp;
    const Sh = 1 + 0.015 * Cbarp * T;
    const Rt = -Math.sin(2 * dTheta * rad) * Rc;

    const l = dLp / Sl, c = dCp / Sc, h = dHp / Sh;
    return Math.sqrt(l * l + c * c + h * h + Rt * c * h);
  }

  const api = { normalizeHex, hexToRgb, rgbToLab, deltaE2000 };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.ColorUtils = api;
})(this);
