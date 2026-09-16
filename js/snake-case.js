(function (root) {
  'use strict';

  function toSnakeCase(name) {
    let s = String(name)
      .normalize('NFD')
      .replace(/[̀-ͯ]/g, '') // strip accents
      .replace(/&/g, ' and ')
      .replace(/['’‘`´]/g, '') // drop apostrophes
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '_')
      .replace(/^_+|_+$/g, '');
    if (/^[0-9]/.test(s)) s = 'color_' + s;
    return s;
  }

  const api = { toSnakeCase };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.SnakeCase = api;
})(this);
