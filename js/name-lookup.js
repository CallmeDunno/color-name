(function (root) {
  'use strict';

  const utils = typeof module !== 'undefined' && module.exports
    ? require('./color-utils.js')
    : root.ColorUtils;

  // data: { "ffa500": "Orange", ... } (keys are 6-char lowercase hex)
  function createLookup(data) {
    const exact = new Map();
    const entries = [];
    for (const [hex, name] of Object.entries(data)) {
      exact.set(hex, name);
      entries.push({ hex, name, lab: utils.rgbToLab(utils.hexToRgb(hex)) });
    }

    // Returns { name, hex, exact, deltaE } for a normalized hex.
    function findClosest(hex) {
      if (exact.has(hex)) return { name: exact.get(hex), hex, exact: true, deltaE: 0 };
      const lab = utils.rgbToLab(utils.hexToRgb(hex));
      let best = null;
      let bestDist = Infinity;
      for (const e of entries) {
        const d = utils.deltaE2000(lab, e.lab);
        if (d < bestDist) {
          bestDist = d;
          best = e;
        }
      }
      return { name: best.name, hex: best.hex, exact: false, deltaE: bestDist };
    }

    return { findClosest, size: entries.length };
  }

  const api = { createLookup };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.NameLookup = api;
})(this);
