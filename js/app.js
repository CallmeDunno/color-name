(function () {
  'use strict';

  const $ = (id) => document.getElementById(id);
  const form = $('lookup-form');
  const input = $('hex-input');
  const picker = $('picker');
  const submitBtn = $('submit-btn');
  const errorEl = $('error');
  const statusEl = $('status');
  const resultEl = $('result');

  let lookup = null;

  function showError(msg) {
    errorEl.textContent = msg;
    errorEl.hidden = !msg;
  }

  function render(inputHex) {
    const match = lookup.findClosest(inputHex);
    $('swatch-input').style.background = '#' + inputHex;
    $('swatch-match').style.background = '#' + match.hex;
    $('input-hex').textContent = '#' + inputHex;
    $('match-hex').textContent = '#' + match.hex;
    $('color-name').textContent = match.name;
    const snake = SnakeCase.toSnakeCase(match.name);
    $('snake-name').textContent = snake;
    $('xml-snippet').textContent = '<color name="' + snake + '">#' + inputHex + '</color>';

    const badge = $('match-badge');
    badge.className = 'badge ' + (match.exact ? 'exact' : 'approx');
    badge.textContent = match.exact
      ? 'Khớp chính xác'
      : 'Gần đúng (ΔE = ' + match.deltaE.toFixed(2) + ')';
    resultEl.hidden = false;
  }

  function search(raw, { updateUrl = true } = {}) {
    const hex = ColorUtils.normalizeHex(raw);
    if (!hex) {
      showError('Mã HEX không hợp lệ. Ví dụ hợp lệ: #ffa500, ffa500, #fa0');
      resultEl.hidden = true;
      return;
    }
    showError('');
    input.value = hex;
    picker.value = '#' + hex;
    if (lookup) render(hex);
    if (updateUrl) {
      const url = new URL(location.href);
      url.searchParams.set('hex', hex);
      history.replaceState(null, '', url);
    }
  }

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    search(input.value);
  });

  // Strip "#" (and spaces) as the user types or pastes, keeping the caret in place.
  input.addEventListener('input', () => {
    const raw = input.value;
    const clean = raw.replace(/[#\s]/g, '').slice(0, 6);
    if (clean === raw) return;
    const caret = input.selectionStart - raw.slice(0, input.selectionStart).replace(/[^#\s]/g, '').length;
    input.value = clean;
    input.setSelectionRange(Math.min(caret, clean.length), Math.min(caret, clean.length));
  });

  input.addEventListener('keydown', (e) => {
    if (e.key !== 'Enter' || submitBtn.disabled) return;
    e.preventDefault();
    search(input.value);
  });

  picker.addEventListener('input', () => search(picker.value));

  resultEl.addEventListener('click', async (e) => {
    const btn = e.target.closest('.copy');
    if (!btn) return;
    const text = $(btn.dataset.target).textContent;
    try {
      await navigator.clipboard.writeText(text);
      btn.textContent = 'Đã copy';
    } catch {
      btn.textContent = 'Lỗi';
    }
    setTimeout(() => (btn.textContent = 'Copy'), 1200);
  });

  fetch('data/colornames.min.json')
    .then((r) => {
      if (!r.ok) throw new Error(r.status);
      return r.json();
    })
    .then((data) => {
      lookup = NameLookup.createLookup(data);
      statusEl.textContent = lookup.size.toLocaleString('vi-VN') + ' tên màu sẵn sàng.';
      submitBtn.disabled = false;
      const initial = new URLSearchParams(location.search).get('hex');
      if (initial) search(initial, { updateUrl: false });
      else input.focus();
    })
    .catch(() => {
      statusEl.textContent = 'Không tải được dữ liệu màu. Hãy chạy qua web server (vd: npx serve .), không mở trực tiếp bằng file://';
    });
})();
