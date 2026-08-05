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

/* ===== 최근 30일 훈련 블록 (깃허브 잔디 형태) =====
   빌드 시점이 아니라 '보는 시점'의 오늘을 기준으로 창을 잡기 위해 런타임에 그린다. */
(function () {
  var root = document.getElementById('wk-activity');
  var grid = document.getElementById('wk-activity-grid');
  var dataEl = document.getElementById('wk-session-data');
  if (!root || !grid || !dataEl) return;

  var sessions;
  try {
    sessions = JSON.parse(dataEl.textContent) || [];
  } catch (e) {
    return;
  }

  var DAYS = parseInt(root.getAttribute('data-days'), 10) || 30;
  var WD = ['일', '월', '화', '수', '목', '금', '토'];

  // 날짜별로 합산 (하루에 두 세션을 한 경우 포함)
  var byDay = {};
  sessions.forEach(function (s) {
    var rec = byDay[s.date];
    if (!rec) {
      rec = byDay[s.date] = { count: 0, minutes: 0, url: s.url };
    }
    rec.count += 1;
    rec.minutes += (s.minutes || 0);
  });

  function pad(n) { return (n < 10 ? '0' : '') + n; }
  function ymd(dt) {
    return dt.getFullYear() + '-' + pad(dt.getMonth() + 1) + '-' + pad(dt.getDate());
  }

  // 훈련 시간에 따라 4단계. 시간을 안 적은 날도 훈련은 했으므로 최소 1단계.
  function levelOf(rec) {
    if (!rec || rec.count === 0) return 0;
    if (rec.minutes <= 60) return 1;
    if (rec.minutes <= 90) return 2;
    if (rec.minutes <= 120) return 3;
    return 4;
  }

  function formatMinutes(total) {
    if (total <= 0) return '';
    var h = Math.floor(total / 60);
    var m = total % 60;
    if (h === 0) return m + '분';
    return h + '시간' + (m > 0 ? ' ' + m + '분' : '');
  }

  var today = new Date();
  today.setHours(0, 0, 0, 0);
  var start = new Date(today);
  start.setDate(start.getDate() - (DAYS - 1));

  var frag = document.createDocumentFragment();

  // 첫 칸이 올바른 요일 줄에서 시작하도록 앞을 비워 둔다
  for (var b = 0; b < start.getDay(); b++) {
    var spacer = document.createElement('span');
    spacer.className = 'wk-cell wk-cell--empty';
    frag.appendChild(spacer);
  }

  var trainedDays = 0;
  var totalMinutes = 0;

  for (var i = 0; i < DAYS; i++) {
    var dt = new Date(start);
    dt.setDate(start.getDate() + i);

    var key = ymd(dt);
    var rec = byDay[key];
    if (rec) {
      trainedDays += 1;
      totalMinutes += rec.minutes;
    }

    var label = key + ' (' + WD[dt.getDay()] + ') · ';
    if (rec) {
      label += rec.count + '세션';
      var mins = formatMinutes(rec.minutes);
      if (mins) label += ' · ' + mins;
    } else {
      label += '훈련 없음';
    }

    // 그날 기록이 하나면 바로 그 일지로 넘어갈 수 있게 링크로 만든다
    var cell;
    if (rec && rec.count === 1 && rec.url) {
      cell = document.createElement('a');
      cell.href = rec.url;
      cell.setAttribute('aria-label', label);
    } else {
      cell = document.createElement('span');
    }
    cell.className = 'wk-cell wk-cell--' + levelOf(rec);
    cell.title = label;
    frag.appendChild(cell);
  }

  grid.textContent = '';
  grid.appendChild(frag);

  var summary = document.getElementById('wk-activity-summary');
  if (summary) {
    var time = formatMinutes(totalMinutes);
    summary.textContent = DAYS + '일 중 ' + trainedDays + '일 훈련'
      + (time ? ' · 총 ' + time : '');
  }

  // 최근 날짜가 보이도록 가로 스크롤을 끝으로
  var body = root.querySelector('.wk-activity__body');
  if (body) body.scrollLeft = body.scrollWidth;
})();
