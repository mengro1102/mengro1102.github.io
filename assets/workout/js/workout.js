/* =============================================================
   MMA Training Log — /workout/ 독립 사이트 스크립트
   블로그의 site.js 와 공유하는 것이 없다. 별도 도메인으로 옮길 때 그대로 이동.
   ============================================================= */

/* ===== 테마 토글 =====
   저장 키가 블로그(sit-theme)와 달라 두 사이트의 테마 설정이 섞이지 않는다. */
(function () {
  var STORAGE_KEY = 'workout-theme';
  var root = document.documentElement;
  var btn = document.querySelector('.wk-theme-toggle');
  if (!btn) return;

  function label(theme) {
    btn.setAttribute('aria-label', theme === 'dark' ? '라이트 모드로 전환' : '다크 모드로 전환');
  }

  function effective() {
    return root.getAttribute('data-theme') ||
      (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
  }

  label(effective());

  btn.addEventListener('click', function () {
    var next = effective() === 'dark' ? 'light' : 'dark';
    try { localStorage.setItem(STORAGE_KEY, next); } catch (e) {}
    root.setAttribute('data-theme', next);
    label(next);
  });
})();

/* ===== 종목 필터 ===== */
(function () {
  var chips = document.querySelectorAll('.wk-chip[data-filter]');
  var list = document.getElementById('wk-log-list');
  var empty = document.getElementById('wk-log-empty');
  if (!chips.length || !list) return;

  var cards = list.querySelectorAll('.wk-log');

  function apply(filter) {
    var shown = 0;
    cards.forEach(function (card) {
      var slugs = (card.getAttribute('data-categories') || '').split(/\s+/);
      var match = filter === 'all' || slugs.indexOf(filter) !== -1;
      card.hidden = !match;
      if (match) shown++;
    });
    if (empty) empty.hidden = shown > 0;
  }

  chips.forEach(function (chip) {
    chip.addEventListener('click', function () {
      chips.forEach(function (c) { c.classList.toggle('is-active', c === chip); });
      apply(chip.getAttribute('data-filter'));
    });
  });
})();

/* ===== 본문 표 가로 스크롤 =====
   kramdown 은 표를 감싸 주지 않아, 좁은 화면에서 넓은 표가 페이지를 밀어낸다. */
(function () {
  document.querySelectorAll('.wk-content table').forEach(function (table) {
    if (table.parentElement.classList.contains('wk-table-scroll')) return;
    var wrap = document.createElement('div');
    wrap.className = 'wk-table-scroll';
    table.parentNode.insertBefore(wrap, table);
    wrap.appendChild(table);
  });
})();
